type Line = Record<string, any>;

interface PivotOpts {
  pivotKey: 'cost_center' | 'project';
  nullLabel: string;
  precision: number;
  grandTotal: boolean;
  valueKey: string; // e.g., "amount", "balance"
  pivotValueSelector?: (v: any) => string | null; // optional custom mapping
}

/** Builds { rows: [...], totals_by_pivot: {...}, pivots: [...ordered...] } */
export function buildPivotMatrix(
  lines: Line[],
  rowKeySelector: (l: Line) => string, // e.g., account code or name
  opts: PivotOpts
) {
  const {
    pivotKey,
    nullLabel,
    precision,
    grandTotal,
    valueKey,
    pivotValueSelector,
  } = opts;

  // Collect pivot values (ordered by appearance)
  const pivotOrder: string[] = [];
  const seen = new Set<string>();
  function normPivot(v: any): string {
    const raw = pivotValueSelector ? pivotValueSelector(v) : (v ?? null);
    const s =
      raw === null || raw === undefined || raw === '' ? nullLabel : String(raw);
    if (!seen.has(s)) {
      seen.add(s);
      pivotOrder.push(s);
    }
    return s;
  }

  // Group by row key, aggregate values by pivot
  const rowMap = new Map<string, Record<string, number>>();
  for (const l of lines) {
    const rowKey = rowKeySelector(l);
    const pv = normPivot(l[pivotKey]);
    const val = Number(l[valueKey] ?? 0);
    const row = rowMap.get(rowKey) ?? {};
    row[pv] = (row[pv] ?? 0) + val;
    rowMap.set(rowKey, row);
  }

  const rows = Array.from(rowMap.entries()).map(([rowKey, cols]) => {
    let total = 0;
    const out: Record<string, any> = { row: rowKey };
    for (const p of pivotOrder) {
      const v = Number(cols[p] ?? 0);
      total += v;
      out[p] = Number(v.toFixed(precision));
    }
    out.total = Number(total.toFixed(precision));
    return out;
  });

  // Totals by pivot
  const totals_by_pivot: Record<string, number> = {};
  for (const p of pivotOrder) {
    let t = 0;
    for (const r of rows) t += Number(r[p] ?? 0);
    totals_by_pivot[p] = Number(t.toFixed(precision));
  }
  if (grandTotal) {
    const grand = Object.values(totals_by_pivot).reduce(
      (a, b) => a + (b as number),
      0
    );
    (totals_by_pivot as any).grand_total = Number(grand.toFixed(precision));
  }

  return { rows, totals_by_pivot, pivots: pivotOrder };
}
