import type { GiveawayFilters, Participant, FilterResult, FilterStats, ExclusionReason } from '@/types/giveaway';
import { parseMentions, isValidInstagramUsername } from './username-normalizer';
export function filterParticipants(participants:Participant[],filters:GiveawayFilters,options:{blacklistedUsernames:Set<string>;previousWinnerUsernames:Set<string>;followerUsernames:Set<string>|null}):FilterResult {
  if(filters.followerCheckMode==='IMPORTED_FOLLOWERS_MATCH' && options.followerUsernames===null)throw new Error('Follower list required');
  const stats:FilterStats={total:participants.length,eligible:0,duplicateUsers:0,missingKeyword:0,missingMentions:0,blacklisted:0,notInFollowers:0,outsideDateRange:0,previousWinners:0,emptyComments:0,isReply:0};
  const eligible:Participant[]=[],excluded:Participant[]=[];
  const seen=new Set<string>(),seenMentions=new Set<string>();
  const mapping:Partial<Record<ExclusionReason,keyof FilterStats>>={DUPLICATE_USER:'duplicateUsers',DUPLICATE_MENTIONS:'duplicateUsers',MISSING_KEYWORD:'missingKeyword',MISSING_HASHTAG:'missingKeyword',MISSING_MENTIONS:'missingMentions',BLACKLISTED:'blacklisted',NOT_IN_IMPORTED_FOLLOWERS:'notInFollowers',OUTSIDE_DATE_RANGE:'outsideDateRange',PREVIOUS_WINNER:'previousWinners',EMPTY_COMMENT:'emptyComments',IS_REPLY:'isReply'};
  for(const p of participants){
    let reason:ExclusionReason|null=null;
    const text=p.commentText??'',u=p.usernameNormalized,mentions=parseMentions(text);
    const mentionKey=u+':'+[...mentions].sort().join(',');
    const timestamp=p.commentTimestamp?Date.parse(p.commentTimestamp):NaN;
    const hashtags=[...text.matchAll(/(?:^|[^\p{L}\p{N}_])#([\p{L}\p{N}_]+)/gu)].map(m=>m[1].toLowerCase());
    if(!isValidInstagramUsername(u))reason='INVALID_USERNAME';
    else if(!filters.includeReplies && p.parentCommentId)reason='IS_REPLY';
    else if(filters.excludeEmptyComments && !text.trim())reason='EMPTY_COMMENT';
    else if(filters.excludeBlacklisted && options.blacklistedUsernames.has(u))reason='BLACKLISTED';
    else if(filters.excludePreviousWinners && options.previousWinnerUsernames.has(u))reason='PREVIOUS_WINNER';
    else if((filters.dateFrom || filters.dateTo) && (!Number.isFinite(timestamp) || (filters.dateFrom && timestamp<Date.parse(filters.dateFrom+'T00:00:00Z')) || (filters.dateTo && timestamp>Date.parse(filters.dateTo+'T23:59:59.999Z'))))reason='OUTSIDE_DATE_RANGE';
    else if(filters.requiredKeyword.trim() && !(filters.keywordCaseSensitive?text:text.toLowerCase()).includes(filters.keywordCaseSensitive?filters.requiredKeyword.trim():filters.requiredKeyword.trim().toLowerCase()))reason='MISSING_KEYWORD';
    else if(filters.requiredHashtag.trim() && !hashtags.includes(filters.requiredHashtag.trim().replace(/^#/,'').toLowerCase()))reason='MISSING_HASHTAG';
    else if(mentions.length<filters.requiredMentions)reason='MISSING_MENTIONS';
    else if(filters.followerCheckMode==='IMPORTED_FOLLOWERS_MATCH' && !options.followerUsernames!.has(u))reason='NOT_IN_IMPORTED_FOLLOWERS';
    else if(filters.uniqueUsersOnly && seen.has(u))reason='DUPLICATE_USER';
    else if(filters.filterDuplicateMentions && mentions.length>0 && seenMentions.has(mentionKey))reason='DUPLICATE_MENTIONS';
    if(reason){excluded.push({...p,isEligible:false,exclusionReason:reason});const key=mapping[reason];if(key)stats[key]++;}
    else {eligible.push({...p,isEligible:true,exclusionReason:null});seen.add(u);seenMentions.add(mentionKey);stats.eligible++;}
  }
  return {eligible,excluded,stats,totalCount:participants.length,eligibleCount:eligible.length};
}
export function intersectWithFollowers(participants:Participant[],followerUsernames:Set<string>){const matched=participants.filter(p=>followerUsernames.has(p.usernameNormalized));return {matched,commentCount:participants.length,followerCount:followerUsernames.size,matchedCount:matched.length};}
