import { describe, expect, it } from 'vitest';
import { parseInstagramUrl } from '@/lib/instagram/url-parser';

describe('parseInstagramUrl', () => {
  it('normalizes reel and post links', () => {
    expect(parseInstagramUrl('https://instagram.com/reel/AbC123/?utm_source=ig')).toEqual({
      type: 'REEL',
      shortcode: 'AbC123',
      normalizedUrl: 'https://www.instagram.com/reel/AbC123/',
    });
    expect(parseInstagramUrl('https://www.instagram.com/p/PostCode/')?.type).toBe('POST');
  });

  it('rejects non-instagram URLs', () => {
    expect(parseInstagramUrl('https://example.com/p/abc')).toBeNull();
    expect(parseInstagramUrl('http://instagram.com/p/abc')).toBeNull();
  });
});
