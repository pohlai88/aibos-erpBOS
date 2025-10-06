// M16.1: Amortization Schedule Generation Service
// Generates monthly amortization schedules using straight-line method

import { pool } from '../../lib/db';
import { ulid } from 'ulid';

export interface AmortGenerateResult {
  plans: number;
  schedule_rows: number;
}

function monthsBetween(
  startISO: string,
  months: number
): Array<{ year: number; month: number }> {
  const parts = startISO.split('-').map(Number);
  const y = parts[0]!;
  const m = parts[1]!;
  return Array.from({ length: months }, (_, i) => {
    const dt = new Date(y, m - 1 + i, 1);
    return { year: dt.getFullYear(), month: dt.getMonth() + 1 };
  });
}

function straightLineAmortization(amount: number, lifeM: number): number[] {
  const perMonth = amount / lifeM;
  return Array.from({ length: lifeM }, () => perMonth);
}

export async function generateAmortizationSchedules(
  companyId: string,
  precision: number = 2,
  planId?: string
): Promise<AmortGenerateResult> {
  // Get plans to process
  const plansQuery = planId
    ? `SELECT * FROM intangible_plan WHERE company_id = $1 AND id = $2`
    : `SELECT * FROM intangible_plan WHERE company_id = $1`;

  const plansResult = await pool.query(
    plansQuery,
    planId ? [companyId, planId] : [companyId]
  );
  const plans = plansResult.rows;

  let inserted = 0;

  for (const plan of plans) {
    const amount = Number(plan.amount);
    const lifeM = plan.life_m;

    // Generate amortization series (straight-line only for intangibles)
    const series = straightLineAmortization(amount, lifeM);

    // Generate month periods
    const months = monthsBetween(plan.in_service, lifeM);

    // Create schedule rows
    const rows = months.map((m, idx) => ({
      id: ulid(),
      company_id: companyId,
      plan_id: plan.id,
      year: m.year,
      month: m.month,
      currency: plan.currency,
      present_ccy: plan.present_ccy,
      amount: Number((series[idx] ?? 0).toFixed(precision)),
    }));

    // Insert schedules (ignore conflicts on unique constraint)
    if (rows.length > 0) {
      try {
        for (const row of rows) {
          await pool.query(
            `INSERT INTO amort_schedule (
              id, company_id, plan_id, year, month, currency, present_ccy, amount
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (company_id, plan_id, year, month) DO NOTHING`,
            [
              row.id,
              row.company_id,
              row.plan_id,
              row.year,
              row.month,
              row.currency,
              row.present_ccy,
              row.amount,
            ]
          );
        }
        inserted += rows.length;
      } catch (error) {
        console.log(`Schedules already exist for plan ${plan.id}, skipping`);
      }
    }
  }

  return {
    plans: plans.length,
    schedule_rows: inserted,
  };
}

export async function getAmortizationSchedule(
  companyId: string,
  planId: string
) {
  const result = await pool.query(
    `SELECT * FROM amort_schedule WHERE company_id = $1 AND plan_id = $2 ORDER BY year, month`,
    [companyId, planId]
  );

  return result.rows;
}

export async function getUnbookedAmortizationSchedules(
  companyId: string,
  year: number,
  month: number
) {
  const result = await pool.query(
    `SELECT * FROM amort_schedule WHERE company_id = $1 AND year = $2 AND month = $3 AND booked_flag = false`,
    [companyId, year, month]
  );

  return result.rows;
}
