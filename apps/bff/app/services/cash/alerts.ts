import { pool } from "../../lib/db";

type Period = { year: number; month: number };
type Row = { cc?: string|null; project?: string|null; netChange: number };

function monthKey(p: Period) { return `${p.year}-${String(p.month).padStart(2,"0")}`; }
function addMonths(p: Period, n: number): Period {
  const d = new Date(p.year, p.month-1+n, 1);
  return { year: d.getFullYear(), month: d.getMonth()+1 };
}

export async function evaluateCashAlerts(
  companyId: string,
  cashVersionCode: string,
  period: Period
) {
  // resolve version
  const versionResult = await pool.query(
    `SELECT id FROM cash_forecast_version WHERE company_id = $1 AND code = $2 LIMIT 1`,
    [companyId, cashVersionCode]
  );
  if (versionResult.rows.length === 0) return { breaches: [], versionMissing: true };
  const ver = versionResult.rows[0];

  // pull month + trailing 2 months (for burn calc)
  const months: Period[] = [addMonths(period, -2), addMonths(period, -1), period];

  const rowsResult = await pool.query(
    `SELECT year, month, cost_center, project, net_change FROM cash_line WHERE company_id = $1 AND version_id = $2`,
    [companyId, ver.id]
  );

  // group by period (+ optional dims)
  const byMonth = new Map<string, Row[]>();
  for (const r of rowsResult.rows) {
    const key = `${r.year}-${String(r.month).padStart(2,"0")}`;
    const arr = byMonth.get(key) ?? [];
    arr.push({ cc: r.cost_center ?? null, project: r.project ?? null, netChange: Number(r.net_change) });
    byMonth.set(key, arr);
  }

  // helpers: cash balance approximation (cumulative net), and burn (avg outflow)
  // Note: if you track opening balances, swap this to exact balance source.
  const cumulative = (upto: Period, cc?: string|null, project?: string|null) => {
    let total = 0;
    for (const [k, arr] of byMonth.entries()) {
      const parts = k.split("-");
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (y > upto.year || (y === upto.year && m > upto.month)) continue;
      for (const it of arr) {
        if (cc && it.cc !== cc) continue;
        if (project && it.project !== project) continue;
        total += it.netChange;
      }
    }
    return total;
  };

  const burnAvg = (cc?: string|null, project?: string|null) => {
    let out = 0, cnt = 0;
    for (const p of months) {
      const key = monthKey(p);
      const arr = byMonth.get(key) ?? [];
      const net = arr.filter(it => (!cc || it.cc === cc) && (!project || it.project === project))
                     .reduce((a,b) => a + b.netChange, 0);
      if (net < 0) { out += -net; cnt++; }
    }
    return cnt ? out / cnt : 0;
  };

  const rulesResult = await pool.query(
    `SELECT id, name, type, threshold_num, filter_cc, filter_project FROM cash_alert_rule WHERE company_id = $1 AND is_active = true`,
    [companyId]
  );

  const breaches: Array<{
    rule_id: string; name: string; type: string;
    cc?: string|null; project?: string|null;
    balance?: number; burn_rate?: number; runway_months?: number; threshold: number
  }> = [];

  for (const r of rulesResult.rows) {
    const cc = (r.filter_cc ?? null) || undefined;
    const pj = (r.filter_project ?? null) || undefined;

    const bal = cumulative(period, cc, pj);          // approx cash balance at period end
    const burn = burnAvg(cc, pj);                    // avg monthly burn last 3 months
    const runway = burn > 0 ? bal / burn : Infinity; // months

    if (r.type === "min_cash" && bal < Number(r.threshold_num)) {
      breaches.push({ rule_id: r.id, name: r.name, type: r.type, cc, project: pj,
        balance: Number(bal.toFixed(2)), threshold: Number(r.threshold_num) });
    }
    if (r.type === "max_burn" && burn > Number(r.threshold_num)) {
      breaches.push({ rule_id: r.id, name: r.name, type: r.type, cc, project: pj,
        burn_rate: Number(burn.toFixed(2)), threshold: Number(r.threshold_num) });
    }
    if (r.type === "runway_months" && runway < Number(r.threshold_num)) {
      breaches.push({ rule_id: r.id, name: r.name, type: r.type, cc, project: pj,
        runway_months: Number(runway.toFixed(2)), threshold: Number(r.threshold_num) });
    }
  }

  return { version: cashVersionCode, period, breaches };
}

// stubbed dispatcher (email/webhook later)
export async function dispatchCashNotifications(_companyId: string, breaches: any[]) {
  return { dispatched: breaches.length };
}
