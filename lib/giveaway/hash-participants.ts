import { createHash } from 'node:crypto';
import type { Participant } from '@/types/giveaway';
export function canonicalizePool(participants: Participant[]): string {
  const rows=participants.map(p=>({id:p.id,username:p.usernameNormalized,commentId:p.commentId,text:p.commentText,timestamp:p.commentTimestamp,parent:p.parentCommentId}));
  rows.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  return JSON.stringify(rows);
}
export function hashParticipantPool(participants: Participant[]): string { return createHash('sha256').update(canonicalizePool(participants),'utf8').digest('hex'); }
export function truncatedHash(hash:string):string { return hash.slice(0,16); }
