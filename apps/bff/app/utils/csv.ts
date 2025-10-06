// CSV Parser Utility for Financial Data
// Minimal, dependency-light CSV parser that handles commas, quotes, and newlines

export async function parseCsv(
  text: string
): Promise<Record<string, string>[]> {
  // Minimal CSV parser: handles commas, quotes, and newlines
  // For exotic CSVs, swap with 'csv-parse/sync'; interface compatible.
  const rows: Record<string, string>[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(Boolean);
  if (!lines.length) return rows;

  const headers = splitLine(lines[0]!);
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]!);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = cells[j] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++; // Skip the next quote
      } else {
        inQ = !inQ;
      }
    } else if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

/**
 * Validates CSV structure and returns helpful error messages
 */
export function validateCsvStructure(text: string): {
  valid: boolean;
  error?: string;
  headers?: string[];
} {
  try {
    const lines = text.replace(/\r\n/g, '\n').split('\n').filter(Boolean);
    if (!lines.length) {
      return { valid: false, error: 'CSV file is empty' };
    }

    const headers = splitLine(lines[0]!);
    if (!headers.length) {
      return { valid: false, error: 'No headers found in CSV' };
    }

    // Check for duplicate headers
    const uniqueHeaders = new Set(headers);
    if (uniqueHeaders.size !== headers.length) {
      return { valid: false, error: 'Duplicate headers found in CSV' };
    }

    return { valid: true, headers };
  } catch (error) {
    return { valid: false, error: `Invalid CSV format: ${error}` };
  }
}

/**
 * Normalizes CSV headers to lowercase for easier mapping
 */
export function normalizeCsvHeaders(headers: string[]): Record<string, string> {
  const normalized: Record<string, string> = {};
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    normalized[normalizedHeader] = header;
  });
  return normalized;
}
