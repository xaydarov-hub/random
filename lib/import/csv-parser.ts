import Papa from 'papaparse';
import { normalizeUsername } from '@/lib/giveaway/username-normalizer';

export interface ImportedParticipant {
  usernameOriginal: string;
  usernameNormalized: string;
  rowIndex: number;
}

export interface ImportPreviewResult {
  totalRows: number;
  validUsernames: ImportedParticipant[];
  duplicates: ImportedParticipant[];
  invalidRows: Array<{ row: number; value: string }>;
  detectedColumn: string | null;
  availableColumns: string[];
}

/**
 * Known column names that likely contain Instagram usernames.
 */
const KNOWN_USERNAME_COLUMNS = [
  'username',
  'user',
  'instagram',
  'handle',
  'name',
  'account',
  'ig',
  '@',
];

/**
 * Detects which column in a CSV likely contains usernames.
 */
export function detectUsernameColumn(headers: string[]): string | null {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const known of KNOWN_USERNAME_COLUMNS) {
    const idx = normalized.indexOf(known);
    if (idx !== -1) return headers[idx];
  }
  // If only one column, assume it's the username column
  if (headers.length === 1) return headers[0];
  return null;
}

/**
 * Parses a CSV string and extracts usernames from the specified column.
 */
export function parseCsvFile(
  content: string,
  columnName?: string,
): ImportPreviewResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
  });

  const headers = result.meta.fields ?? [];
  const detectedColumn = columnName ?? detectUsernameColumn(headers);

  const validUsernames: ImportedParticipant[] = [];
  const duplicates: ImportedParticipant[] = [];
  const invalidRows: Array<{ row: number; value: string }> = [];
  const seenNormalized = new Set<string>();

  if (!detectedColumn) {
    return {
      totalRows: result.data.length,
      validUsernames: [],
      duplicates: [],
      invalidRows: result.data.map((_, i) => ({ row: i + 1, value: 'No username column detected' })),
      detectedColumn: null,
      availableColumns: headers,
    };
  }

  result.data.forEach((row, index) => {
    const raw = row[detectedColumn] ?? '';
    const normalized = normalizeUsername(raw);

    if (!normalized) {
      invalidRows.push({ row: index + 1, value: raw });
      return;
    }

    const participant: ImportedParticipant = {
      usernameOriginal: raw.trim(),
      usernameNormalized: normalized,
      rowIndex: index + 1,
    };

    if (seenNormalized.has(normalized)) {
      duplicates.push(participant);
    } else {
      seenNormalized.add(normalized);
      validUsernames.push(participant);
    }
  });

  return {
    totalRows: result.data.length,
    validUsernames,
    duplicates,
    invalidRows,
    detectedColumn,
    availableColumns: headers,
  };
}

/**
 * Parses a plain text file where each line is a username.
 */
export function parseTxtFile(content: string): ImportPreviewResult {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const validUsernames: ImportedParticipant[] = [];
  const duplicates: ImportedParticipant[] = [];
  const invalidRows: Array<{ row: number; value: string }> = [];
  const seenNormalized = new Set<string>();

  lines.forEach((line, index) => {
    const normalized = normalizeUsername(line);

    if (!normalized) {
      invalidRows.push({ row: index + 1, value: line });
      return;
    }

    const participant: ImportedParticipant = {
      usernameOriginal: line,
      usernameNormalized: normalized,
      rowIndex: index + 1,
    };

    if (seenNormalized.has(normalized)) {
      duplicates.push(participant);
    } else {
      seenNormalized.add(normalized);
      validUsernames.push(participant);
    }
  });

  return {
    totalRows: lines.length,
    validUsernames,
    duplicates,
    invalidRows,
    detectedColumn: 'line',
    availableColumns: [],
  };
}
