// Meta / Instagram Graph API Data Transfer Objects

export interface IGMedia {
  id: string;
  shortcode?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL';
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp: string;
  comments_count?: number;
  like_count?: number;
  username?: string;
}

export interface IGComment {
  id: string;
  text: string;
  timestamp: string;
  username?: string;
  from?: {
    id: string;
    username: string;
  };
  parent_id?: string;
  replies?: IGCommentPage;
}

export interface IGCommentPage {
  data: IGComment[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

export interface IGUser {
  id: string;
  username: string;
  name?: string;
  account_type?: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL';
  followers_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  biography?: string;
  website?: string;
}

export interface IGTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface IGLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface ParsedInstagramUrl {
  type: 'POST' | 'REEL';
  shortcode: string;
  normalizedUrl: string;
}
