import { jsonValue } from '@/lib/serializable';
import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import type { TransactionSql, Sql } from 'postgres';
import { db } from '@/lib/db/sql';
import { fail } from './http';
import { filterParticipants } from '@/lib/giveaway/filter-participants';
import { hashParticipantPool, canonicalizePool } from '@/lib/giveaway/hash-participants';
import { selectWinnersWithReserves, RANDOM_METHOD } from '@/lib/giveaway/random-draw';
import type { Participant, GiveawayFilters } from '@/types/giveaway';
import type { Giveaway, Draw, Winner } from '@/types/app';
import type { z } from 'zod';
import { drawSchema, giveawaySchema } from '@/lib/validation';
type Query=Sql|TransactionSql;
export function participant(username:string, original=username):Participant { return {id:randomUUID(),usernameOriginal:original,usernameNormalized:username,commentText:null,commentId:null,commentTimestamp:null,parentCommentId:null,profilePictureUrl:null,isEligible:true,exclusionReason:null,isWinner:false,metadata:{}}; }
export async function ownedGiveaway(sql:Query, userId:string,id:string,lock=false):Promise<Giveaway> {
  const rows=lock?await sql<Giveaway[]>`select * from giveaways where id=${id} and user_id=${userId} for update`:await sql<Giveaway[]>`select * from giveaways where id=${id} and user_id=${userId}`;
  if(!rows[0]) fail('Giveaway topilmadi.',404); return rows[0];
}
export async function pool(sql:Query,userId:string,giveaway:Giveaway,filters:GiveawayFilters){
  const entries=await sql<{payload:Participant}[]>`select payload from giveaway_entries where giveaway_id=${giveaway.id} and user_id=${userId} order by ordinal`;
  const blacklist=await sql<{username:string}[]>`select username from blacklist_entries where user_id=${userId}`;
  const previous=await sql<{username:string}[]>`select distinct username from winners where giveaway_id=${giveaway.id} and user_id=${userId}`;
  let followers:Set<string>|null=null;
  if(filters.followerCheckMode==='IMPORTED_FOLLOWERS_MATCH'){
    if(!filters.followerListId)fail('Obunachilar ro‘yxatini tanlang.');
    const lists=await sql`select id from participant_lists where id=${filters.followerListId} and user_id=${userId} and type='followers'`;
    if(!lists.length)fail('Obunachilar ro‘yxati topilmadi.');
    const rows=await sql<{username_normalized:string}[]>`select username_normalized from participant_list_entries where list_id=${filters.followerListId} and user_id=${userId}`;
    followers=new Set(rows.map(r=>r.username_normalized));
  }
  const effective={...filters,excludeEmptyComments:giveaway.source_type==='MANUAL_IMPORT'?false:filters.excludeEmptyComments};
  const result=filterParticipants(entries.map(r=>({...r.payload,isWinner:previous.some(w=>w.username===r.payload.usernameNormalized)})),effective,{blacklistedUsernames:new Set(blacklist.map(r=>r.username)),previousWinnerUsernames:new Set(previous.map(r=>r.username)),followerUsernames:followers});
  return {...result,filters:effective,followerCount:followers?.size??null};
}
export async function createGiveaway(userId:string,input:z.infer<typeof giveawaySchema>){
  return db().begin(async sql=>{
    let participants:Participant[]=[]; let source:Giveaway['source']={};
    if(input.sourceType==='MANUAL_IMPORT') {
      if(!input.listId)fail('Ishtirokchilar ro‘yxatini tanlang.');
      const [list]=await sql`select id from participant_lists where id=${input.listId} and user_id=${userId}`; if(!list)fail('Ro‘yxat topilmadi.');
      const entries=await sql`select username_normalized,username_original from participant_list_entries where list_id=${input.listId} and user_id=${userId} order by ordinal`;
      participants=entries.map(e=>participant(e.username_normalized,e.username_original)); source={listId:input.listId};
    } else {
      if(!input.sourceId)fail('Avval kommentlarni yuklang.');
      const [loaded]=await sql`select * from giveaway_sources where id=${input.sourceId} and user_id=${userId} and complete=true and provider=${input.sourceType}`;
      if(!loaded)fail('Kommentlar to‘liq yuklanmagan.');
      const entries=await sql<{payload:Participant}[]>`select payload from comments where source_id=${input.sourceId} and user_id=${userId} order by comment_id`;
      participants=entries.map(e=>({...e.payload,id:randomUUID()})); source={url:loaded.url,media:loaded.media};
    }
    if(!participants.length)fail('Ro‘yxatda ishtirokchilar yo‘q.');
    const filters={...input.filters,excludeEmptyComments:input.sourceType==='MANUAL_IMPORT'?false:input.filters.excludeEmptyComments};
    const [giveaway]=await sql`insert into giveaways(user_id,name,source_type,source,filters,participant_count) values(${userId},${input.name},${input.sourceType},${sql.json(jsonValue(source))},${sql.json(jsonValue(filters))},${participants.length}) returning *`;
    for(let i=0;i<participants.length;i+=500){ const rows=participants.slice(i,i+500).map((p,index)=>({id:p.id,user_id:userId,giveaway_id:giveaway.id,payload:sql.json(jsonValue(p)),ordinal:i+index})); await sql`insert into giveaway_entries ${sql(rows,'id','user_id','giveaway_id','payload','ordinal')}`; }
    return giveaway;
  });
}
export async function drawGiveaway(userId:string,id:string,input:z.infer<typeof drawSchema>){
  return db().begin(async sql=>{
    await sql`set local lock_timeout = '10s'`;
    const giveaway=await ownedGiveaway(sql,userId,id,true);
    const requestHash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const [existing]=await sql<(Draw & {request_hash:string})[]>`select * from draws where giveaway_id=${id} and user_id=${userId} and idempotency_key=${input.idempotencyKey}`;
    if(existing){if(existing.request_hash!==requestHash)fail('Bir xil so‘rov kaliti boshqa parametrlar bilan ishlatildi.',409); const winners=await sql<Winner[]>`select * from winners where draw_id=${existing.id} and user_id=${userId} order by position`; return {...existing,pool_snapshot:undefined,request_hash:undefined,winners};}
    if(giveaway.status==='archived')fail('Arxivlangan giveaway uchun tanlov yopilgan.',409);
    const filtered=await pool(sql,userId,giveaway,input.filters);
    if(input.winnerCount+input.reserveCount>filtered.eligibleCount)fail('G‘olib va zaxiralar soni mos ishtirokchilar sonidan oshdi.');
    const selected=selectWinnersWithReserves(filtered.eligible,input.winnerCount,input.reserveCount);
    const [sequence]=await sql`select coalesce(max(sequence_number),0)+1 as number from draws where giveaway_id=${id}`;
    const [draw]=await sql`insert into draws(user_id,giveaway_id,sequence_number,eligible_count,winner_count,filters_snapshot,participant_pool_hash,pool_snapshot,random_method,source,idempotency_key,request_hash,public) values(${userId},${id},${sequence.number},${filtered.eligibleCount},${input.winnerCount},${sql.json(jsonValue(filtered.filters))},${hashParticipantPool(filtered.eligible)},${sql.json(jsonValue(JSON.parse(canonicalizePool(filtered.eligible))))},${RANDOM_METHOD},${sql.json(jsonValue(giveaway.source))},${input.idempotencyKey},${requestHash},${input.public}) returning id, giveaway_id,sequence_number,eligible_count,participant_pool_hash,random_method,created_at,filters_snapshot,public`;
    const rows=[...selected.mainWinners,...selected.reserveWinners].map((p,i)=>({user_id:userId,draw_id:draw.id,giveaway_id:id,participant_entry_id:p.id,username:p.usernameNormalized,position:i+1,is_reserve:i>=input.winnerCount,comment_text:p.commentText}));
    const winners=await sql`insert into winners ${sql(rows)} returning *`;
    await sql`update giveaways set status='completed', filters=${sql.json(jsonValue(filtered.filters))},updated_at=now() where id=${id} and user_id=${userId}`;
    await sql`insert into audit_logs(user_id,action,resource_id,metadata) values(${userId},'DRAW_CREATED',${draw.id},${sql.json(jsonValue({sequence:sequence.number,poolHash:draw.participant_pool_hash}))})`;
    return {...draw,winners};
  });
}
