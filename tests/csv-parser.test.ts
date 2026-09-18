import { describe, expect, it } from 'vitest';
import { parseCsvFile, parseTxtFile } from '@/lib/import/csv-parser';

describe('parseCsvFile', () => {
  it('detects a username column and skips duplicates', () => {
    const result = parseCsvFile('username,extra\n@Ada\nAda\nbad name\n');
    expect(result.detectedColumn).toBe('username');
    expect(result.validUsernames.map((p) => p.usernameNormalized)).toEqual(['ada']);
    expect(result.duplicates).toHaveLength(1);
    expect(result.invalidRows).toHaveLength(1);
  });
});

describe('parseTxtFile', () => {
  it('parses one username per line', () => {
    const result = parseTxtFile('@one\n\n@two\n');
    expect(result.validUsernames.map((p) => p.usernameNormalized)).toEqual(['one', 'two']);
  });
});
