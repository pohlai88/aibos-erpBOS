// M16.2: Bulk Asset Posting Service
// Handles bulk posting of depreciation/amortization with dry-run diff

import { postDepreciation } from '../capex/post';
import { postAmortization } from '../intangibles/post';
import { pool } from '../../lib/db';
import { BulkPostResult } from '@aibos/contracts';

export async function bulkPostAssets(
  companyId: string,
  kind: 'depr' | 'amort',
  year: number,
  month: number,
  dryRun: boolean,
  memo?: string,
  planIds?: string[]
): Promise<BulkPostResult> {
  // Gather target schedules (unbooked)
  const baseFilter = (rows: any[]) =>
    rows.filter(
      (r: any) =>
        Number(r.year) === year && Number(r.month) === month && !r.booked_flag
    );

  let targets: any[] = [];

  if (kind === 'depr') {
    const rows = await pool.query(
      `SELECT * FROM depr_schedule WHERE company_id = $1`,
      [companyId]
    );
    targets = baseFilter(rows.rows);
    if (planIds?.length) {
      targets = targets.filter(r => planIds.includes(r.plan_id));
    }
  } else {
    const rows = await pool.query(
      `SELECT * FROM amort_schedule WHERE company_id = $1`,
      [companyId]
    );
    targets = baseFilter(rows.rows);
    if (planIds?.length) {
      targets = targets.filter(r => planIds.includes(r.plan_id));
    }
  }

  const total = targets.reduce((a, r) => a + Number(r.amount), 0);
  const distinctPlans = Array.from(new Set(targets.map(r => r.plan_id)));

  if (dryRun) {
    // Diff: what would be posted
    return {
      dry_run: true,
      kind,
      year,
      month,
      plans: distinctPlans.length,
      lines: targets.length,
      total_amount: Number(total.toFixed(2)),
      sample: targets.slice(0, 5).map(t => ({
        plan_id: t.plan_id,
        amount: Number(t.amount),
        present_ccy: t.present_ccy,
      })),
    };
  }

  // Real posting
  const res =
    kind === 'depr'
      ? await postDepreciation(companyId, year, month, memo, undefined, false)
      : await postAmortization(companyId, year, month, memo, undefined, false);

  return {
    dry_run: false,
    kind,
    year,
    month,
    posted_journals: res.journals.length,
  };
}

/**
 * Gets summary statistics for a specific period
 */
export async function getPostingSummary(
  companyId: string,
  kind: 'depr' | 'amort',
  year: number,
  month: number
): Promise<{
  total_amount: number;
  plan_count: number;
  line_count: number;
  booked_count: number;
  unbooked_count: number;
}> {
  const table = kind === 'depr' ? 'depr_schedule' : 'amort_schedule';

  const allRows = await pool.query(
    `SELECT * FROM ${table} WHERE company_id = $1 AND year = $2 AND month = $3`,
    [companyId, year, month]
  );

  const rows = allRows.rows;
  const booked = rows.filter(r => r.booked_flag);
  const unbooked = rows.filter(r => !r.booked_flag);

  const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const distinctPlans = new Set(rows.map(r => r.plan_id));

  return {
    total_amount: Number(totalAmount.toFixed(2)),
    plan_count: distinctPlans.size,
    line_count: rows.length,
    booked_count: booked.length,
    unbooked_count: unbooked.length,
  };
}

/**
 * Validates that posting is safe (no conflicts, valid period)
 */
export async function validatePostingSafety(
  companyId: string,
  kind: 'depr' | 'amort',
  year: number,
  month: number,
  planIds?: string[]
): Promise<{ safe: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  // Check if period is in the future
  const now = new Date();
  const targetDate = new Date(year, month - 1, 1);
  if (targetDate > now) {
    warnings.push(
      `Posting for future period ${year}-${month.toString().padStart(2, '0')}`
    );
  }

  // Check if period is too far in the past (more than 2 years)
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1);
  if (targetDate < twoYearsAgo) {
    warnings.push(
      `Posting for old period ${year}-${month.toString().padStart(2, '0')} (more than 2 years ago)`
    );
  }

  // Check for existing posted entries
  const table = kind === 'depr' ? 'depr_schedule' : 'amort_schedule';
  const existingRows = await pool.query(
    `SELECT COUNT(*) as count FROM ${table} WHERE company_id = $1 AND year = $2 AND month = $3 AND booked_flag = true`,
    [companyId, year, month]
  );

  if (Number(existingRows.rows[0].count) > 0) {
    warnings.push(
      `Some entries for ${year}-${month.toString().padStart(2, '0')} are already posted`
    );
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
