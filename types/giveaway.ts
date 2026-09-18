export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ExclusionReason =
  | 'DUPLICATE_USER'
  | 'DUPLICATE_MENTIONS'
  | 'MISSING_HASHTAG'
  | 'MISSING_KEYWORD'
  | 'MISSING_MENTIONS'
  | 'BLACKLISTED'
  | 'NOT_IN_IMPORTED_FOLLOWERS'
  | 'OUTSIDE_DATE_RANGE'
  | 'PREVIOUS_WINNER'
  | 'EMPTY_COMMENT'
  | 'INVALID_USERNAME'
  | 'IS_REPLY';

export type FollowerCheckMode =
  | 'NOT_CHECKED'
  | 'MANUAL_CONFIRMED'
  | 'IMPORTED_FOLLOWERS_MATCH'
  | 'EXTERNAL_PROVIDER_CHECKED';

export interface GiveawayFilters {
  uniqueUsersOnly: boolean;
  includeReplies: boolean;
  excludeEmptyComments: boolean;
  excludePreviousWinners: boolean;
  excludeBlacklisted: boolean;
  requiredKeyword: string;
  keywordCaseSensitive: boolean;
  requiredHashtag: string;
  requiredMentions: number;
  filterDuplicateMentions: boolean;
  dateFrom: string | null;
  dateTo: string | null;
  followerCheckMode: FollowerCheckMode;
  followerListId: string | null;
}

export const DEFAULT_FILTERS: GiveawayFilters = {
  uniqueUsersOnly: true,
  includeReplies: false,
  excludeEmptyComments: true,
  excludePreviousWinners: true,
  excludeBlacklisted: true,
  requiredKeyword: '',
  keywordCaseSensitive: false,
  requiredHashtag: '',
  requiredMentions: 0,
  filterDuplicateMentions: false,
  dateFrom: null,
  dateTo: null,
  followerCheckMode: 'NOT_CHECKED',
  followerListId: null,
};

export interface Participant {
  id: string;
  usernameOriginal: string;
  usernameNormalized: string;
  commentText: string | null;
  commentId: string | null;
  commentTimestamp: string | null;
  parentCommentId: string | null;
  profilePictureUrl: string | null;
  isEligible: boolean;
  exclusionReason: ExclusionReason | null;
  isWinner: boolean;
  metadata: Json;
}

export interface FilterResult {
  eligible: Participant[];
  excluded: Participant[];
  totalCount: number;
  eligibleCount: number;
  stats: FilterStats;
}

export interface FilterStats {
  total: number;
  eligible: number;
  duplicateUsers: number;
  missingKeyword: number;
  missingMentions: number;
  blacklisted: number;
  notInFollowers: number;
  outsideDateRange: number;
  previousWinners: number;
  emptyComments: number;
  isReply: number;
}

export interface DrawResult {
  drawId: string;
  giveawayId: string;
  sequenceNumber: number;
  winners: DrawWinner[];
  eligibleCount: number;
  participantPoolHash: string;
  randomMethod: string;
  createdAt: string;
}

export interface DrawWinner {
  id: string;
  drawId: string;
  giveawayId: string;
  username: string;
  participantEntryId: string | null;
  position: number;
  isReserve: boolean;
  commentText: string | null;
  profilePictureUrl: string | null;
  metadata: Json;
  createdAt: string;
}

export interface DrawRequest {
  giveawayId: string;
  winnerCount: number;
  reserveCount: number;
  filters: GiveawayFilters;
  idempotencyKey: string;
  excludePreviousWinnerUsernames: string[];
}

export interface VerificationData {
  drawId: string;
  giveawayName: string;
  drawTimestamp: string;
  sequenceNumber: number;
  eligibleParticipantCount: number;
  participantPoolHash: string;
  randomMethod: string;
  winners: Array<{ username: string; position: number; isReserve: boolean }>;
}
