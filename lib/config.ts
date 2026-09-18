/**
 * Centralized application configuration.
 * Change APP_NAME here to rename the entire application.
 */

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'RandomPick';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
export const IS_DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';


export const PAGINATION_CONFIG = {
  commentsPerPage: 100,
  maxCommentPages: 500, // Safety limit: 50,000 comments
  participantsPerPage: 50,
  giveawaysPerPage: 20,
} as const;

export const SECURITY_CONFIG = {
  oauthStateExpiry: 10 * 60 * 1000, // 10 minutes
  tokenEncryptionAlgorithm: 'aes-256-gcm' as const,
} as const;
