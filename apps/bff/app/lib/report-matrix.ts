// Lightweight, shared matrix builder for PL/BS/BvA parity.
// Input rows shape is intentionally simple and adapter-friendly across reports.
// rows: [{ account_code, account_name, pivot_key (nullable), amount }]
export type MatrixRowIn = {
  account_code: string;
  account_name: string;
  pivot_key: string | null;
  amount: number;
};

export type MatrixOut = {
  columns: string[]; // ordered unique pivot headers
  rows: Array<{
    account_code: string;
    account_name: string;
    by_pivot: Record<string, number>;
    row_total: number;
  }>;
  totals_by_pivot: Record<string, number>;
  grand_total: number;
};

export function buildMatrix(
  rows: MatrixRowIn[],
  opts: {
    pivotNullLabel: string;
    precision: number;
    includeGrandTotal: boolean;
  }
): MatrixOut {
  const { pivotNullLabel, precision, includeGrandTotal } = opts;
  const norm = (v: string | null) =>
    v && v.trim().length ? v : pivotNullLabel;

  // Collect unique columns preserving encounter order
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const col = norm(r.pivot_key);
    if (!seen.has(col)) {
      seen.add(col);
      columns.push(col);
    }
  }

  // Group by account
  const byAcct = new Map<
    string,
    { account_name: string; by_pivot: Record<string, number> }
  >();
  for (const r of rows) {
    const key = r.account_code;
    const col = norm(r.pivot_key);
    const entry = byAcct.get(key) ?? {
      account_name: r.account_name,
      by_pivot: {},
    };
    entry.by_pivot[col] = (entry.by_pivot[col] ?? 0) + r.amount;
    byAcct.set(key, entry);
  }

  // Format rows and totals
  const round = (n: number) => {
    const f = Math.pow(10, precision);
    return Math.round(n * f) / f;
  };

  const totals_by_pivot: Record<string, number> = {};
  const rowsOut: MatrixOut['rows'] = [];
  for (const [account_code, { account_name, by_pivot }] of byAcct) {
    let row_total = 0;
    const out: Record<string, number> = {};
    for (const c of columns) {
      const v = by_pivot[c] ?? 0;
      out[c] = round(v);
      row_total += v;
      totals_by_pivot[c] = (totals_by_pivot[c] ?? 0) + v;
    }
    rowsOut.push({
      account_code,
      account_name,
      by_pivot: out,
      row_total: round(row_total),
    });
  }

  // Stable sort by account code (optional; matches typical report behavior)
  rowsOut.sort((a, b) => a.account_code.localeCompare(b.account_code, 'en'));

  // Totals & grand total
  let grand_total = 0;
  for (const c of columns) {
    const total = round(totals_by_pivot[c] ?? 0);
    totals_by_pivot[c] = total;
    grand_total += total;
  }
  grand_total = includeGrandTotal ? round(grand_total) : 0;

  return { columns, rows: rowsOut, totals_by_pivot, grand_total };
}
