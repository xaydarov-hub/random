import type { ParsedInstagramUrl } from '@/types/instagram';

/**
 * Parses Instagram post and reel URLs into a normalized structure.
 *
 * Supported formats:
 * - https://www.instagram.com/p/SHORTCODE/
 * - https://instagram.com/p/SHORTCODE/
 * - https://www.instagram.com/reel/SHORTCODE/
 * - https://instagram.com/reel/SHORTCODE/
 * - https://www.instagram.com/reels/SHORTCODE/
 *
 * Strips: utm params, query strings, trailing slash differences
 */

const INSTAGRAM_URL_REGEX =
  /^https:\/\/(?:www\.)?instagram\.com\/(p|reel|reels)\/([A-Za-z0-9_-]{1,30})\/?$/i;

export function parseInstagramUrl(input: string): ParsedInstagramUrl | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Strip query string and fragments before matching
  const urlWithoutQuery = trimmed.split('?')[0].split('#')[0];

  const match = INSTAGRAM_URL_REGEX.exec(urlWithoutQuery);
  if (!match) return null;

  const [, pathType, shortcode] = match;
  if (!pathType || !shortcode) return null;

  // Validate shortcode length and characters
  if (shortcode.length < 1 || shortcode.length > 30) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(shortcode)) return null;

  const type: 'POST' | 'REEL' =
    pathType === 'p' ? 'POST' : 'REEL';

  const normalizedPath = type === 'POST' ? 'p' : 'reel';
  const normalizedUrl = `https://www.instagram.com/${normalizedPath}/${shortcode}/`;

  return { type, shortcode, normalizedUrl };
}

export function isValidInstagramUrl(input: string): boolean {
  return parseInstagramUrl(input) !== null;
}

export function extractShortcode(input: string): string | null {
  return parseInstagramUrl(input)?.shortcode ?? null;
}
