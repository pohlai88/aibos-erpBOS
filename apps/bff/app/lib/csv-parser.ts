// M14.3: CSV Parser Utility for Budget Import

interface BudgetImportRequest {
  mapping: {
    account_code: string;
    month: string;
    amount: string;
    cost_center?: string;
    project?: string;
  };
  defaults: {
    currency: string;
    year: number;
  };
  precision: number;
}

interface BudgetImportError {
  row: number;
  issues: string[];
}

export interface ParsedRow {
  account_code: string;
  month: string;
  amount: string;
  cost_center?: string;
  project?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: BudgetImportError[];
  meta: {
    rows_total: number;
    rows_valid: number;
    rows_invalid: number;
  };
}

export async function parseCsvStream(
  bytes: Uint8Array,
  config: BudgetImportRequest
): Promise<ParseResult> {
  const text = new TextDecoder().decode(bytes);
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return {
      rows: [],
      errors: [{ row: 0, issues: ['CSV file is empty'] }],
      meta: { rows_total: 0, rows_valid: 0, rows_invalid: 0 },
    };
  }

  // Parse header row
  const headerLine = lines[0];
  if (!headerLine) {
    return {
      rows: [],
      errors: [{ row: 0, issues: ['CSV file is empty'] }],
      meta: { rows_total: 0, rows_valid: 0, rows_invalid: 0 },
    };
  }

  const headers = parseCsvLine(headerLine);

  // Validate required columns exist
  const requiredColumns = [
    config.mapping.account_code,
    config.mapping.month,
    config.mapping.amount,
  ];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          issues: [`Missing required columns: ${missingColumns.join(', ')}`],
        },
      ],
      meta: { rows_total: 0, rows_valid: 0, rows_invalid: 0 },
    };
  }

  const rows: ParsedRow[] = [];
  const errors: BudgetImportError[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const values = parseCsvLine(line);
    const rowErrors: string[] = [];

    // Extract values based on mapping
    const accountCode = getColumnValue(
      values,
      headers,
      config.mapping.account_code
    );
    const month = getColumnValue(values, headers, config.mapping.month);
    const amount = getColumnValue(values, headers, config.mapping.amount);
    const costCenter = config.mapping.cost_center
      ? getColumnValue(values, headers, config.mapping.cost_center)
      : undefined;
    const project = config.mapping.project
      ? getColumnValue(values, headers, config.mapping.project)
      : undefined;

    // Validate required fields
    if (!accountCode) rowErrors.push('Account code is required');
    if (!month) rowErrors.push('Month is required');
    if (!amount) rowErrors.push('Amount is required');

    // Validate month format (1-12 or YYYY-MM)
    if (month && !isValidMonth(month)) {
      rowErrors.push('Month must be 1-12 or YYYY-MM format');
    }

    // Validate amount format
    if (amount && !isValidAmount(amount)) {
      rowErrors.push('Amount must be a valid number');
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, issues: rowErrors });
    } else {
      rows.push({
        account_code: accountCode!,
        month: month!,
        amount: amount!,
        ...(costCenter && { cost_center: costCenter }),
        ...(project && { project: project }),
      });
    }
  }

  return {
    rows,
    errors,
    meta: {
      rows_total: lines.length - 1,
      rows_valid: rows.length,
      rows_invalid: errors.length,
    },
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function getColumnValue(
  values: string[],
  headers: string[],
  columnName: string
): string | undefined {
  const index = headers.indexOf(columnName);
  return index >= 0 ? values[index] : undefined;
}

function isValidMonth(month: string): boolean {
  // Check if it's 1-12
  const num = parseInt(month);
  if (num >= 1 && num <= 12) return true;

  // Check if it's YYYY-MM format
  const yyyyMmPattern = /^\d{4}-\d{2}$/;
  if (yyyyMmPattern.test(month)) {
    const [, monthPart] = month.split('-');
    if (monthPart) {
      const monthNum = parseInt(monthPart);
      return monthNum >= 1 && monthNum <= 12;
    }
  }

  return false;
}

function isValidAmount(amount: string): boolean {
  // Remove common separators and check if it's a valid number
  const cleaned = amount.replace(/[,$]/g, '');
  const num = parseFloat(cleaned);
  return !isNaN(num) && isFinite(num);
}

export function normalizeMonth(month: string, year: number): string {
  const num = parseInt(month);
  if (num >= 1 && num <= 12) {
    return `${year}-${num.toString().padStart(2, '0')}`;
  }

  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  throw new Error(`Invalid month format: ${month}`);
}

export function normalizeAmount(amount: string, precision: number): number {
  const cleaned = amount.replace(/[,$]/g, '');
  const num = parseFloat(cleaned);
  return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}
