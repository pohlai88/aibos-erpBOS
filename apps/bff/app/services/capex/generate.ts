// M16: Depreciation Schedule Generation Service
// Generates monthly depreciation schedules using SL and DDB methods

import { pool } from '../../lib/db';
import { ulid } from 'ulid';

export interface GenerateResult {
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

function straightLine(
  amount: number,
  lifeM: number,
  residualPct: number
): number[] {
  const base = amount * (1 - residualPct / 100);
  const perMonth = base / lifeM;
  return Array.from({ length: lifeM }, () => perMonth);
}

function doubleDecliningBalance(
  amount: number,
  lifeM: number,
  residualPct: number
): number[] {
  // Simple DDB approximation: rate = 2 / lifeM on diminishing base; stop at residual floor
  const floor = amount * (residualPct / 100);
  const rate = 2 / lifeM;
  const arr: number[] = [];
  let base = amount;

  for (let i = 0; i < lifeM; i++) {
    // If we've already reached the floor, no more depreciation
    if (base <= floor) {
      arr.push(0);
      continue;
    }

    let dep = base * rate;

    // If this depreciation would take us below the floor,
    // adjust to exactly reach the floor
    if (base - dep < floor) {
      dep = base - floor;
    }

    arr.push(dep);
    base -= dep;
  }

  return arr;
}

export async function generateSchedules(
  companyId: string,
  precision: number = 2,
  planId?: string
): Promise<GenerateResult> {
  // Get plans to process
  const plansQuery = planId
    ? `SELECT * FROM capex_plan WHERE company_id = $1 AND id = $2`
    : `SELECT * FROM capex_plan WHERE company_id = $1`;

  const plansResult = await pool.query(
    plansQuery,
    planId ? [companyId, planId] : [companyId]
  );
  const plans = plansResult.rows;

  let inserted = 0;

  for (const plan of plans) {
    // Get asset class details
    const assetClassResult = await pool.query(
      `SELECT * FROM asset_class_ref WHERE code = $1 LIMIT 1`,
      [plan.asset_class]
    );

    if (assetClassResult.rows.length === 0) {
      console.warn(
        `Asset class ${plan.asset_class} not found for plan ${plan.id}`
      );
      continue;
    }

    const assetClass = assetClassResult.rows[0];

    // Use plan overrides or asset class defaults
    const method = plan.method ?? assetClass.method;
    const lifeM = plan.life_m ?? assetClass.default_life_m;
    const residualPct = Number(assetClass.residual_pct);
    const amount = Number(plan.capex_amount);

    // Generate depreciation series
    const series =
      method === 'DDB'
        ? doubleDecliningBalance(amount, lifeM, residualPct)
        : straightLine(amount, lifeM, residualPct);

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
            `INSERT INTO depr_schedule (
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

export async function getSchedule(companyId: string, planId: string) {
  const result = await pool.query(
    `SELECT * FROM depr_schedule WHERE company_id = $1 AND plan_id = $2 ORDER BY year, month`,
    [companyId, planId]
  );

  return result.rows;
}

export async function getUnbookedSchedules(
  companyId: string,
  year: number,
  month: number
) {
  const result = await pool.query(
    `SELECT * FROM depr_schedule WHERE company_id = $1 AND year = $2 AND month = $3 AND booked_flag = false`,
    [companyId, year, month]
  );

  return result.rows;
}
