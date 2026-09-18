import { jsonValue } from '@/lib/serializable';
import 'server-only';
import { db } from '@/lib/db/sql';
import { fail } from './http';
import { MetaProvider, type Account, type CommentCursor, type Provider } from '@/lib/instagram/meta-client';
import { ExternalProvider } from '@/lib/instagram/external-provider';
import { decryptToken } from '@/lib/security/encryption';
import { AppError } from '@/types/errors';
import { normalizeUsername } from '@/lib/giveaway/username-normalizer';
import { participant } from './giveaways';
export async function providerFor(userId:string,type:string):Promise<Provider>{
  if(type==='EXTERNAL_PROVIDER')return new ExternalProvider();
  const [integration]=await db()<{account:Account;encrypted_access_token:string;token_expires_at:Date}[]>`select account,encrypted_access_token,token_expires_at from instagram_integrations where user_id=${userId}`;
  if(!integration)throw new AppError('INSTAGRAM_NOT_CONNECTED','Not connected',400);
  if(new Date(integration.token_expires_at).getTime()<=Date.now())throw new AppError('INSTAGRAM_TOKEN_EXPIRED','Expired',400);
  return new MetaProvider(decryptToken(integration.encrypted_access_token),integration.account.user_id??integration.account.id);
}
export async function loadCommentBatch(userId:string,id:string,expectedPage:number){
  return db().begin(async sql=>{
    const [source]=await sql`select * from giveaway_sources where id=${id} and user_id=${userId} for update`;
    if(!source)fail('Post topilmadi.',404);
    if(source.complete || source.page_count!==expectedPage){const [count]=await sql`select count(*)::int as count from comments where source_id=${id} and user_id=${userId}`;return {count:count.count,complete:source.complete,page:source.page_count};}
    if(source.page_count>=100000)fail('Xavfsizlik chegarasiga yetildi. Importdan foydalaning.');
    const provider=await providerFor(userId,source.provider);
    const page=await provider.getCommentPage(source.media.id,source.cursor?JSON.parse(source.cursor) as CommentCursor:null);
    for(const comment of page.comments){
      const username=comment.from?.username??comment.username??'';
      const p={...participant(normalizeUsername(username)??'',username),commentId:comment.id,commentText:comment.text??null,commentTimestamp:comment.timestamp??null,parentCommentId:comment.parent_id??null,metadata:{userId:comment.from?.id??null}};
      await sql`insert into comments(user_id,source_id,comment_id,payload) values(${userId},${id},${comment.id},${sql.json(jsonValue(p))}) on conflict(source_id,comment_id) do nothing`;
    }
    const [count]=await sql`select count(*)::int as count from comments where source_id=${id} and user_id=${userId}`;
    if(count.count>50000)fail('50 000 komment chegarasidan oshdi. Tanlovni qismlarga ajrating.');
    await sql`update giveaway_sources set cursor=${page.cursor?JSON.stringify(page.cursor):null},complete=${page.cursor===null},page_count=page_count+1 where id=${id} and user_id=${userId}`;
    return {count:count.count,complete:page.cursor===null,page:source.page_count+1};
  });
}
