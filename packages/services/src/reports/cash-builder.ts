import { ok, err } from '@aibos/contracts';
import type { CashReport, CashReportLine, CashMoney } from '@aibos/contracts';
import { toCamel } from '@aibos/utils';

type RawLine = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  bucket?: string | number;
};

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}
function makeMoney(currency: string, amount: number): CashMoney {
  return { currency, amount };
}

export async function buildCashReport(args: {
  companyId: string;
  year: number;
  month?: number;
}) {
  const { companyId, year, month } = args;
  if (!companyId)
    return err({ code: 'ARG_MISSING', message: 'companyId is required' });
  if (!Number.isInteger(year))
    return err({ code: 'ARG_INVALID', message: 'year must be an integer' });

  const rows: RawLine[] = (await fetchLines(companyId, year, month).then(
    toCamel
  )) as RawLine[];
  // Group by line id/name, allow multiple buckets (e.g., monthly columns)
  const map = new Map<
    string,
    { name: string; currency: string; values: CashMoney[] }
  >();
  for (const r of rows) {
    const key = r.id;
    if (!map.has(key)) {
      map.set(key, { name: r.name, currency: r.currency, values: [] });
    }
    map.get(key)!.values.push(makeMoney(r.currency, r.amount));
  }

  const lines: CashReportLine[] = Array.from(map.entries()).map(([id, rec]) => {
    const totalAmt = sum(rec.values.map(v => v.amount));
    return {
      id,
      name: rec.name,
      values: rec.values,
      total: makeMoney(rec.currency, totalAmt),
    };
  });

  const report: CashReport = {
    companyId,
    period: month !== undefined ? { year, month } : { year },
    lines,
  };
  return ok(report);
}

async function fetchLines(
  companyId: string,
  year: number,
  month?: number
): Promise<RawLine[]> {
  // Mock implementation - replace with actual DB query
  return [
    { id: 'cash-1', name: 'Operating Cash', amount: 100000, currency: 'USD' },
    { id: 'cash-2', name: 'Investment Cash', amount: 50000, currency: 'USD' },
  ];
}
