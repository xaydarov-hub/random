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
