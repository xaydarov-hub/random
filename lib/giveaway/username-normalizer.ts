/**
 * Username normalization utilities.
 *
 * Handles:
 * - @username → username
 * - JOHN.DOE → john.doe
 * - https://instagram.com/john.doe/ → john.doe
 * - Leading/trailing whitespace
 * - Instagram profile URLs
 */

const INSTAGRAM_PROFILE_URL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/;

/**
 * Common Instagram UI chrome that ends up on its own line when a comment
 * section is copy-pasted as plain text (relative timestamps, action labels).
 * Filtered out so it never gets mistaken for a real username.
 */
const UI_NOISE_WORDS = new Set([
  'reply', 'replies', 'like', 'likes', 'view', 'more', 'translate', 'seetranslation',
  'follow', 'following', 'edited', 'pinned', 'author', 'verified', 'ago',
  'javob', 'javoblar', 'layk', 'layklar', "ko'proq", 'koproq', 'tarjima', 'tarjimasinikorish',
  'kuzatish', 'kuzataman', 'izoh', 'izohlar', 'muallif',
  'ответить', 'ответы', 'нравится', 'показать', 'перевод', 'подписаться', 'подписка', 'автор',
]);
const RELATIVE_TIME_REGEX = /^\d{1,3}(s|m|h|d|w|y|sek|soat|kun|hafta|oy|yil|min)$/i;

/**
 * Detects tokens that are Instagram UI chrome rather than usernames —
 * relative timestamps ("2d", "3h"), bare like/reply counts, or action labels.
 */
export function isLikelyUiNoise(token: string): boolean {
  const t = token.trim().toLowerCase();
  if (!t) return false;
  if (/^\d+$/.test(t)) return true;
  if (RELATIVE_TIME_REGEX.test(t)) return true;
  if (UI_NOISE_WORDS.has(t)) return true;
  return false;
}

/**
 * Normalizes a username string to lowercase without @ prefix.
 * Returns null if the input is not a valid username.
 */
export function normalizeUsername(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  let cleaned = input.trim();

  // Handle Instagram profile URLs
  const urlMatch = INSTAGRAM_PROFILE_URL_REGEX.exec(cleaned);
  if (urlMatch && urlMatch[1]) {
    cleaned = urlMatch[1];
  }

  // Remove leading @
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.slice(1);
  }

  // Lowercase
  cleaned = cleaned.toLowerCase();

  // Validate: Instagram usernames are 1-30 chars, alphanumeric, dots, underscores
  if (!isValidInstagramUsername(cleaned)) return null;

  return cleaned;
}

/**
 * Validates if a string is a valid Instagram username format.
 */
export function isValidInstagramUsername(username: string): boolean {
  if (!username || username.length < 1 || username.length > 30) return false;
  // Instagram allows letters, numbers, dots, and underscores
  // Cannot start or end with a dot, no consecutive dots
  if (!/^[a-z0-9._]+$/i.test(username)) return false;
  if (username.startsWith('.') || username.endsWith('.')) return false;
  if (username.includes('..')) return false;
  return true;
}

/**
 * Deduplicates a list of normalized usernames, keeping first occurrence.
 */
export function deduplicateUsernames(usernames: string[]): string[] {
  const seen = new Set<string>();
  return usernames.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

/**
 * Parses @mention references from comment text.
 * Returns an array of normalized usernames mentioned.
 */
export function parseMentions(text: string): string[] {
  if (!text) return [];
  const mentionRegex = /(?:^|[^A-Za-z0-9._@])@([A-Za-z0-9._]{1,30})(?![A-Za-z0-9._])/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    const normalized = normalizeUsername(match[1]);
    if (normalized) mentions.push(normalized);
  }

  return [...new Set(mentions)]; // unique mentions only
}

/**
 * Sanitizes a cell value for CSV export to prevent formula injection.
 * Prefixes with a single quote if the cell starts with = + - @ etc.
 */
export function sanitizeCsvCell(value: string): string {
  if (!value) return value;
  if (/^[\s\uFEFF]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value)) {
    return `'${value}`;
  }
  return value;
}
