import { describe, expect, it } from 'vitest';
import { normalizeUsername, parseMentions, sanitizeCsvCell } from '@/lib/giveaway/username-normalizer';

describe('normalizeUsername', () => {
  it('strips @ and lowercases', () => {
    expect(normalizeUsername('@JOHN.Doe')).toBe('john.doe');
  });

  it('extracts a profile URL', () => {
    expect(normalizeUsername('https://www.instagram.com/besh.bola/')).toBe('besh.bola');
  });

  it('rejects invalid names', () => {
    expect(normalizeUsername('')).toBeNull();
    expect(normalizeUsername('.starts')).toBeNull();
    expect(normalizeUsername('two..dots')).toBeNull();
    expect(normalizeUsername('has a space')).toBeNull();
  });
});

describe('parseMentions', () => {
  it('returns unique mentions', () => {
    expect(parseMentions('tag @alpha and @Beta and @alpha again')).toEqual(['alpha', 'beta']);
  });
});

describe('sanitizeCsvCell', () => {
  it('neutralizes formula injection', () => {
    expect(sanitizeCsvCell('=cmd')).toBe("'=cmd");
    expect(sanitizeCsvCell('hello')).toBe('hello');
  });
});
