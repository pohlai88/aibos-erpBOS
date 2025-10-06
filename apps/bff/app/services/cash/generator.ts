// M15: Cash Flow Generator Service
// apps/bff/app/services/cash/generator.ts

import { pool } from '../../lib/db';
import { resolveScenarioToVersionId } from './resolveScenario';

// Simple ULID generator (reusing pattern from M14.5)
function generateId(): string {
  return `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Simple hash function for idempotency
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Working Capital Math Helpers
function arFromRevenue(rev: number, dsoDays: number): number {
  return (rev * dsoDays) / 365;
}

function apFromCogs(cogs: number, dpoDays: number): number {
  return (cogs * dpoDays) / 365;
}

function invFromCogs(cogs: number, dioDays: number): number {
  return (cogs * dioDays) / 365;
}

// Indirect Cash Flow Calculation
function cashFromPL(
  monthData: {
    year: number;
    month: number;
    revenue: number;
    cogs: number;
    opex: number;
    taxPct: number;
    interestApr: number;
  },
  deltaAR: number,
  deltaAP: number,
  deltaInv: number
) {
  const grossProfit = monthData.revenue - monthData.cogs;
  const ebit = grossProfit - monthData.opex;
  const tax = Math.max(0, ebit) * (monthData.taxPct / 100);
  const interest = Math.max(
    0,
    (monthData.revenue + monthData.cogs + monthData.opex) *
      (monthData.interestApr / 100 / 12)
  );
  const netIncome = ebit - tax - interest;

  // Indirect method adjustments
  const cashFromOps = netIncome - deltaAR + deltaAP - deltaInv;
  return {
    cashIn: Math.max(0, cashFromOps),
    cashOut: Math.max(0, -cashFromOps),
    net: cashFromOps,
  };
}

// Fetch PL data from existing budget/forecast lines
async function fetchPlData(
  companyId: string,
  year: number,
  scenarioTag: string
): Promise<
  Array<{
    year: number;
    month: number;
    revenue: number;
    cogs: number;
    opex: number;
    cost_center?: string | null;
    project?: string | null;
    currency: string;
  }>
> {
  const versionId = await resolveScenarioToVersionId(companyId, scenarioTag);
  if (!versionId) {
    throw new Error(`Scenario ${scenarioTag} not found`);
  }

  const { type } = parseScenarioTag(scenarioTag);

  if (type === 'forecast') {
    // Query forecast_line table
    const result = await pool.query(
      `SELECT 
        fl.year,
        fl.month,
        fl.account_code,
        fl.amount,
        fl.cost_center_code,
        fl.project_code,
        fl.currency
      FROM forecast_line fl
      WHERE fl.company_id = $1 AND fl.version_id = $2
      ORDER BY fl.year, fl.month, fl.account_code`,
      [companyId, versionId]
    );

    // Group by month and account type
    const monthlyData: Record<string, any> = {};

    for (const row of result.rows) {
      const key = `${row.year}-${row.month}-${row.cost_center_code || ''}-${row.project_code || ''}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: row.year,
          month: row.month,
          revenue: 0,
          cogs: 0,
          opex: 0,
          cost_center: row.cost_center_code,
          project: row.project_code,
          currency: row.currency,
        };
      }

      // Categorize by account code (simplified)
      if (row.account_code.startsWith('4')) {
        // Revenue accounts
        monthlyData[key].revenue += Number(row.amount);
      } else if (row.account_code.startsWith('5')) {
        // COGS accounts
        monthlyData[key].cogs += Number(row.amount);
      } else if (row.account_code.startsWith('6')) {
        // Operating expenses
        monthlyData[key].opex += Number(row.amount);
      }
    }

    return Object.values(monthlyData);
  } else {
    // Query budget_line table
    const result = await pool.query(
      `SELECT 
        bl.period_year as year,
        bl.period_month as month,
        bl.account_code,
        bl.amount_base as amount,
        bl.cost_center_code,
        bl.project_code,
        bl.currency
      FROM budget_line bl
      WHERE bl.company_id = $1 AND bl.version_id = $2
      ORDER BY bl.period_year, bl.period_month, bl.account_code`,
      [companyId, versionId]
    );

    // Group by month and account type
    const monthlyData: Record<string, any> = {};

    for (const row of result.rows) {
      const key = `${row.year}-${row.month}-${row.cost_center_code || ''}-${row.project_code || ''}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: row.year,
          month: row.month,
          revenue: 0,
          cogs: 0,
          opex: 0,
          cost_center: row.cost_center_code,
          project: row.project_code,
          currency: row.currency,
        };
      }

      // Categorize by account code (simplified)
      if (row.account_code.startsWith('4')) {
        // Revenue accounts
        monthlyData[key].revenue += Number(row.amount);
      } else if (row.account_code.startsWith('5')) {
        // COGS accounts
        monthlyData[key].cogs += Number(row.amount);
      } else if (row.account_code.startsWith('6')) {
        // Operating expenses
        monthlyData[key].opex += Number(row.amount);
      }
    }

    return Object.values(monthlyData);
  }
}

// Main Cash Flow Generation Function
export async function generateCashFlow(
  companyId: string,
  versionId: string,
  year: number,
  profile: {
    dso_days: number;
    dpo_days: number;
    dio_days: number;
    tax_rate_pct: number;
    interest_apr: number;
  },
  presentCcy: string,
  precision: number,
  fromScenario: string
) {
  const startTime = Date.now();

  // 1) Pull PL monthly rows for the scenario used as the driver basis
  const plRows = await fetchPlData(companyId, year, fromScenario);

  if (plRows.length === 0) {
    throw new Error(`No PL data found for scenario: ${fromScenario}`);
  }

  // 2) Aggregate by month (+ optional dim breakout retained)
  const keyed: Record<
    string,
    {
      revenue: number;
      cogs: number;
      opex: number;
      cost_center?: string | null;
      project?: string | null;
      currency: string;
    }
  > = {};

  for (const r of plRows) {
    const k = `${r.year}-${r.month}-${r.cost_center ?? ''}-${r.project ?? ''}`;
    const item = keyed[k] ?? {
      revenue: 0,
      cogs: 0,
      opex: 0,
      cost_center: r.cost_center ?? null,
      project: r.project ?? null,
      currency: r.currency,
    };
    item.revenue += r.revenue;
    item.cogs += r.cogs;
    item.opex += r.opex;
    keyed[k] = item;
  }

  // 3) Build cash lines with WC deltas
  const values: any[] = [];

  for (const [k, v] of Object.entries(keyed)) {
    const [yStr, mStr, cc, pj] = k.split('-');
    const y = Number(yStr),
      m = Number(mStr);

    // approx WC balances for this month
    const ar = arFromRevenue(v.revenue, profile.dso_days);
    const ap = apFromCogs(v.cogs, profile.dpo_days);
    const inv = invFromCogs(v.cogs, profile.dio_days);

    // last-month for deltas (simple: use previous key with same CC/Project)
    const prevKey = `${y}-${m - 1 || 12}-${cc}-${pj}`;
    const prev = keyed[prevKey] ?? { revenue: 0, cogs: 0 };
    const arPrev = arFromRevenue(prev.revenue, profile.dso_days);
    const apPrev = apFromCogs(prev.cogs, profile.dpo_days);
    const invPrev = invFromCogs(prev.cogs, profile.dio_days);

    const deltas = { dAR: ar - arPrev, dAP: ap - apPrev, dInv: inv - invPrev };
    const cash = cashFromPL(
      {
        year: y,
        month: m,
        revenue: v.revenue,
        cogs: v.cogs,
        opex: v.opex,
        taxPct: profile.tax_rate_pct,
        interestApr: profile.interest_apr,
      },
      deltas.dAR,
      deltas.dAP,
      deltas.dInv
    );

    const net = Number(cash.net.toFixed(precision));
    values.push({
      id: generateId(),
      companyId,
      versionId,
      year: y,
      month: m,
      currency: v.currency,
      presentCcy: presentCcy,
      cashIn: Number(cash.cashIn.toFixed(precision)),
      cashOut: Number(cash.cashOut.toFixed(precision)),
      netChange: net,
      costCenter: cc || null,
      project: pj || null,
    });
  }

  // 4) Idempotency source_hash derived from (companyId, versionId, profile params, presentCcy)
  const sourceHash = await sha256Hex(
    JSON.stringify({
      companyId,
      versionId,
      year,
      presentCcy,
      profile,
      fromScenario,
    })
  );

  // 5) Write in a transaction, replacing previous generation with same hash
  await pool.query('BEGIN');
  try {
    // Delete previous with same hash (if any)
    await pool.query(
      `DELETE FROM cash_line WHERE company_id = $1 AND version_id = $2`,
      [companyId, versionId]
    );

    // Insert new cash lines
    if (values.length > 0) {
      for (const value of values) {
        await pool.query(
          `INSERT INTO cash_line (
            id, company_id, version_id, year, month, currency, present_ccy,
            cash_in, cash_out, net_change, cost_center, project, source_hash
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            value.id,
            value.companyId,
            value.versionId,
            value.year,
            value.month,
            value.currency,
            value.presentCcy,
            value.cashIn,
            value.cashOut,
            value.netChange,
            value.costCenter,
            value.project,
            sourceHash,
          ]
        );
      }
    }

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }

  const duration = Date.now() - startTime;

  // Observability logging
  console.log(
    JSON.stringify({
      event: 'cash_flow_generated',
      company_id: companyId,
      cash_version_id: versionId,
      from_scenario: fromScenario,
      lines_processed: values.length,
      duration_ms: duration,
      source_hash: sourceHash,
      timestamp: new Date().toISOString(),
    })
  );

  return {
    inserted: values.length,
    source_hash: sourceHash,
    durationMs: duration,
  };
}

// Helper function for parseScenarioTag (needed by fetchPlData)
function parseScenarioTag(tag: string) {
  const [t, rest] = tag.includes(':') ? tag.split(':') : ['budget', tag];
  return { type: t as 'budget' | 'forecast', code: rest };
}
