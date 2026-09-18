import { jsonValue } from '@/lib/serializable';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { db } from '@/lib/db/sql';
import { route, body, fail } from '@/lib/server/http';
import { importSchema, giveawaySchema, drawSchema, filtersSchema, settingsSchema } from '@/lib/validation';
import { parseCsvFile, parseTxtFile } from '@/lib/import/csv-parser';
import { normalizeUsername,sanitizeCsvCell } from '@/lib/giveaway/username-normalizer';
import { createGiveaway, drawGiveaway, ownedGiveaway, pool } from '@/lib/server/giveaways';
import { providerFor,loadCommentBatch } from '@/lib/server/instagram';
import { generateOAuthState,validateOAuthState } from '@/lib/security/csrf';
import { encryptToken,decryptToken } from '@/lib/security/encryption';
import { META_SCOPES,exchangeCode,MetaProvider,refreshToken } from '@/lib/instagram/meta-client';
import { externalEnabled } from '@/lib/instagram/external-provider';
import { parseInstagramUrl } from '@/lib/instagram/url-parser';
import { DEFAULT_FILTERS } from '@/types/giveaway';
import { APP_NAME } from '@/lib/config';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
async function dispatch(request:Request,userId:string){
  const url=new URL(request.url),path=url.pathname.replace(/^\/api\//,''),method=request.method,sql=db();
  if(path==='dashboard' && method==='GET'){
    const [stats]=await sql`select (select count(*)::int from giveaways where user_id=${userId}) as giveaways,(select count(*)::int from giveaway_entries where user_id=${userId}) as participants,(select count(*)::int from winners where user_id=${userId}) as winners,(select count(*)::int from instagram_integrations where user_id=${userId}) as integrations`;
    const recent=await sql`select * from giveaways where user_id=${userId} order by created_at desc limit 5`;return {stats,recent};
  }
  if(path==='settings'){
    if(method==='GET'){const [profile]=await sql`select settings from profiles where id=${userId}`;return {appName:APP_NAME,winnerCount:1,animationDuration:4,theme:'system',language:'uz',filters:DEFAULT_FILTERS,...profile?.settings};}
    if(method==='POST'){const input=await body(request,settingsSchema);await sql`insert into profiles(id,settings) values(${userId},${sql.json(jsonValue(input))}) on conflict(id) do update set settings=excluded.settings`;return input;}
  }
  if(path==='blacklist'){
    if(method==='GET')return sql`select id,username from blacklist_entries where user_id=${userId} order by username`;
    if(method==='POST'){const input=await body(request,z.object({usernames:z.string().max(30000)}));const names=[...new Set(input.usernames.split(/[\s,;]+/).map(normalizeUsername).filter((n):n is string=>Boolean(n)))];if(!names.length)fail('Username topilmadi.');const rows=names.map(username=>({user_id:userId,username}));await sql`insert into blacklist_entries ${sql(rows)} on conflict(user_id,username) do nothing`;return {added:names.length};}
    if(method==='DELETE'){const {id}=await body(request,z.object({id:z.string().uuid()}));await sql`delete from blacklist_entries where id=${id} and user_id=${userId}`;return {ok:true};}
  }
  if(path==='imports' && method==='GET')return sql`select id,name,type,valid_rows,total_rows,created_at from participant_lists where user_id=${userId} order by created_at desc`;
  if((path==='import/preview'||path==='import/create') && method==='POST'){
    const input=await body(request,importSchema);const preview=input.format==='csv'?parseCsvFile(input.content,input.column):parseTxtFile(input.content);
    if(preview.totalRows>50000)fail('Bir ro‘yxatga ko‘pi bilan 50 000 qator yuklang.');
    if(path==='import/preview')return {...preview,validCount:preview.validUsernames.length,duplicateCount:preview.duplicates.length,invalidCount:preview.invalidRows.length,validUsernames:preview.validUsernames.slice(0,20),duplicates:preview.duplicates.slice(0,20),invalidRows:preview.invalidRows.slice(0,20)};
    const entries=(input.deduplicate?preview.validUsernames:[...preview.validUsernames,...preview.duplicates]).sort((a,b)=>a.rowIndex-b.rowIndex);
    if(!entries.length)fail('Yaroqli username topilmadi. CSV ustunini tekshiring.');
    return sql.begin(async tx=>{
      const [list]=await tx`insert into participant_lists(user_id,name,type,original_filename,total_rows,valid_rows) values(${userId},${input.name},${input.type},${input.filename??null},${preview.totalRows},${entries.length}) returning *`;
      for(let i=0;i<entries.length;i+=1000){const rows=entries.slice(i,i+1000).map((p,index)=>({list_id:list.id,user_id:userId,username_original:p.usernameOriginal,username_normalized:p.usernameNormalized,ordinal:i+index}));await tx`insert into participant_list_entries ${tx(rows)}`;}return list;
    });
  }
  if(path==='giveaways'){
    if(method==='POST')return createGiveaway(userId,await body(request,giveawaySchema));
    if(method==='GET'){const page=Math.max(1,Number(url.searchParams.get('page'))||1);const q=(url.searchParams.get('q')??'').slice(0,100);const [count]=await sql`select count(*)::int as total from giveaways where user_id=${userId} and name ilike ${'%'+q+'%'}`;const items=await sql`select g.*,(select count(*)::int from winners w where w.giveaway_id=g.id and w.user_id=${userId}) as winner_count from giveaways g where user_id=${userId} and name ilike ${'%'+q+'%'} order by created_at desc limit 20 offset ${(page-1)*20}`;return {items,total:count.total};}
  }
  const match=/^giveaways\/([a-f0-9-]+)(?:\/(prepare|draw|export|archive))?$/.exec(path);
  if(match){const id=z.string().uuid().parse(match[1]),action=match[2];
    if(action==='draw' && method==='POST')return drawGiveaway(userId,id,await body(request,drawSchema));
    const giveaway=await ownedGiveaway(sql,userId,id);
    if(action==='archive' && method==='POST'){await sql`update giveaways set status='archived',updated_at=now() where id=${id} and user_id=${userId}`;return {ok:true};}
    if(action==='prepare' && method==='POST'){const {filters}=await body(request,z.object({filters:filtersSchema}));const result=await pool(sql,userId,giveaway,filters);return {totalCount:result.totalCount,eligibleCount:result.eligibleCount,excludedCount:result.excluded.length,stats:result.stats,followerCount:result.followerCount};}
    if(method==='GET'){
      const draws=await sql`select d.id,d.giveaway_id,d.sequence_number,d.eligible_count,d.participant_pool_hash,d.random_method,d.created_at,d.filters_snapshot,d.public,coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'username',w.username,'position',w.position,'is_reserve',w.is_reserve,'comment_text',w.comment_text,'participant_entry_id',w.participant_entry_id) order by position) from winners w where w.draw_id=d.id and w.user_id=${userId}),'[]') as winners from draws d where giveaway_id=${id} and user_id=${userId} order by sequence_number desc`;
      const result=await pool(sql,userId,giveaway,giveaway.filters);
      if(action==='export'){
        const winnerExport=url.searchParams.get('type')==='winners';
        const rows=winnerExport?draws.flatMap(d=>(d.winners as {position:number;username:string;comment_text:string|null;is_reserve:boolean}[]).map(w=>({position:w.position,username:w.username,comment:w.comment_text??'',drawn_at:d.created_at,draw_id:d.id,reserve:w.is_reserve}))):[...result.eligible,...result.excluded].map(p=>({username:p.usernameNormalized,comment:p.commentText??'',comment_date:p.commentTimestamp??'',eligible:p.isEligible,exclusion_reason:p.exclusionReason??'',winner:p.isWinner,winner_position:draws.flatMap(d=>(d.winners as {participant_entry_id:string;position:number}[]).filter(w=>w.participant_entry_id===p.id).map(w=>w.position)).join(';')}));
        const safe=rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='string'?sanitizeCsvCell(v):v])));
        return new Response('\uFEFF'+Papa.unparse(safe),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="randompick-${winnerExport?'winners':'participants'}-${id}.csv"`,'Cache-Control':'no-store'}});
      }
      let entries=[...result.eligible,...result.excluded];const q=(url.searchParams.get('q')??'').toLowerCase();const state=url.searchParams.get('state');
      entries=entries.filter(p=>(p.usernameNormalized.includes(q)||(p.commentText??'').toLowerCase().includes(q)) && (state==='eligible'?p.isEligible:state==='excluded'?!p.isEligible:state==='winner'?p.isWinner:true));
      if(url.searchParams.get('sort')==='username')entries.sort((a,b)=>a.usernameNormalized.localeCompare(b.usernameNormalized));
      if(url.searchParams.get('sort')==='date')entries.sort((a,b)=>(b.commentTimestamp??'').localeCompare(a.commentTimestamp??''));
      const page=Math.max(1,Number(url.searchParams.get('page'))||1);
      return {giveaway,draws,total:entries.length,participants:entries.slice((page-1)*50,page*50),eligibleCount:result.eligibleCount,excludedCount:result.excluded.length};
    }
  }
  if(path==='instagram/integrations'){
    if(method==='GET'){const integrations=await sql`select id,account,token_expires_at,connected_at,(token_expires_at > now()) as active from instagram_integrations where user_id=${userId}`;return {integrations,metaConfigured:Boolean(process.env.META_APP_ID&&process.env.META_APP_SECRET&&process.env.TOKEN_ENCRYPTION_KEY),externalEnabled:externalEnabled()};}
    if(method==='DELETE'){await sql`delete from instagram_integrations where user_id=${userId}`;return {ok:true};}
  }
  if(path==='instagram/refresh'&&method==='POST'){const [integration]=await sql`select * from instagram_integrations where user_id=${userId}`;if(!integration)fail('Hisob ulanmagan.');const token=await refreshToken(decryptToken(integration.encrypted_access_token));await sql`update instagram_integrations set encrypted_access_token=${encryptToken(token.access_token)},token_expires_at=${new Date(Date.now()+token.expires_in*1000)} where user_id=${userId}`;return {ok:true};}
  if(path==='instagram/oauth/start'&&method==='POST'){
    if(!process.env.META_APP_ID||!process.env.META_APP_SECRET||!process.env.INSTAGRAM_REDIRECT_URI||!process.env.TOKEN_ENCRYPTION_KEY)fail('Meta ilovasi serverda hali sozlanmagan.',503);
    const state=generateOAuthState();const jar=await cookies();jar.set('ig_oauth',JSON.stringify({state,userId}),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:600,path:'/api/instagram/oauth/callback'});
    const destination=new URL('https://www.instagram.com/oauth/authorize');Object.entries({client_id:process.env.META_APP_ID,redirect_uri:process.env.INSTAGRAM_REDIRECT_URI,response_type:'code',scope:META_SCOPES.join(','),state,enable_fb_login:'0',force_authentication:'1'}).forEach(([k,v])=>destination.searchParams.set(k,v));return {url:destination.toString()};
  }
  if(path==='instagram/oauth/callback'&&method==='GET'){
    const jar=await cookies(),raw=jar.get('ig_oauth')?.value;jar.delete({name:'ig_oauth',path:'/api/instagram/oauth/callback'});
    if(!raw)fail('Instagram ulanish so‘rovining muddati tugadi.');const stored=JSON.parse(raw) as {state:string;userId:string};
    if(stored.userId!==userId || !validateOAuthState(stored.state,url.searchParams.get('state')??''))fail('OAuth so‘rovi tasdiqlanmadi.',403);
    const target=new URL('/dashboard/integrations',process.env.NEXT_PUBLIC_APP_URL??url.origin);
    if(url.searchParams.get('error')){target.searchParams.set('error','cancelled');return NextResponse.redirect(target);}
    const code=url.searchParams.get('code');if(!code)fail('Instagram kodi yuborilmadi.');
    const token=await exchangeCode(code);const provider=new MetaProvider(token.access_token,'me'),account=await provider.getAccount();
    await sql`insert into instagram_integrations(user_id,account,encrypted_access_token,token_expires_at) values(${userId},${sql.json(jsonValue(account))},${encryptToken(token.access_token)},${new Date(Date.now()+token.expires_in*1000)}) on conflict(user_id) do update set account=excluded.account,encrypted_access_token=excluded.encrypted_access_token,token_expires_at=excluded.token_expires_at,connected_at=now()`;
    return NextResponse.redirect(target);
  }
  if(path==='instagram/media/resolve'&&method==='POST'){
    const input=await body(request,z.object({url:z.string().max(1000),provider:z.enum(['META_OFFICIAL','EXTERNAL_PROVIDER']).default('META_OFFICIAL')}));const parsed=parseInstagramUrl(input.url);if(!parsed)fail('Instagram Reel yoki Post havolasini kiriting.');
    const provider=await providerFor(userId,input.provider),media=await provider.resolveMedia(parsed.normalizedUrl);
    const [source]=await sql`insert into giveaway_sources(user_id,provider,media,url) values(${userId},${input.provider},${sql.json(jsonValue(media))},${parsed.normalizedUrl}) returning id`;return {sourceId:source.id,media};
  }
  if(path==='instagram/media/comments'&&method==='POST'){const input=await body(request,z.object({sourceId:z.string().uuid(),page:z.number().int().min(0)}));return loadCommentBatch(userId,input.sourceId,input.page);}
  fail('Sahifa topilmadi.',404);
}
export const GET=route(dispatch);
export const POST=async(request:Request)=>route(dispatch,new URL(request.url).pathname.endsWith('/draw')?'draw':'write')(request);
export const DELETE=route(dispatch,'write');
