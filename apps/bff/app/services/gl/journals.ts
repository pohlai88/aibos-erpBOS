// M17: Global Journal Posting Service
// Central journal posting with period enforcement

import { pool } from '../../lib/db';
import { assertOpenPeriod } from './periods';

export interface JournalEntry {
  date: Date;
  memo?: string;
  lines: Array<{
    accountId: string;
    debit?: number;
    credit?: number;
    description?: string;
  }>;
  tags?: Record<string, any>;
}

export async function postJournal(
  companyId: string,
  je: JournalEntry
): Promise<{ journalId: string; linesPosted: number }> {
  // Enforce period policy
  await assertOpenPeriod(companyId, je.date);

  // Validate journal entry
  const totalDebits = je.lines.reduce(
    (sum, line) => sum + (line.debit || 0),
    0
  );
  const totalCredits = je.lines.reduce(
    (sum, line) => sum + (line.credit || 0),
    0
  );

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error('Journal entry is not balanced');
  }

  // Generate journal ID
  const journalId = `JE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Insert journal entry
  await pool.query(
    `INSERT INTO journal_entries (id, company_id, date, memo, tags, created_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      journalId,
      companyId,
      je.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
      je.memo || null,
      je.tags ? JSON.stringify(je.tags) : null,
      new Date().toISOString(),
      'system', // TODO: Get from auth context
    ]
  );

  // Insert journal lines
  for (const line of je.lines) {
    const lineId = `${journalId}-${Math.random().toString(36).substr(2, 9)}`;
    await pool.query(
      `INSERT INTO journal_lines (id, journal_id, account_id, debit, credit, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        lineId,
        journalId,
        line.accountId,
        line.debit || 0,
        line.credit || 0,
        line.description || null,
      ]
    );
  }

  return {
    journalId,
    linesPosted: je.lines.length,
  };
}
