export type Rounding = 'half_up' | 'bankers';

export function roundMoney(
  n: number,
  precision = 2,
  mode: Rounding = 'half_up'
) {
  const f = Math.pow(10, precision);
  if (mode === 'bankers') {
    // round half to even
    const x = n * f;
    const i = Math.floor(x);
    const frac = x - i;
    if (Math.abs(frac - 0.5) < 1e-9) {
      return (i % 2 === 0 ? i : i + 1) / f;
    }
    return Math.round(x) / f;
  }
  return Math.round(n * f) / f;
}

export type TaxContext = {
  company_id: string;
  doc_date: string; // ISO date
  code_id: string; // e.g. "SR"
  base_amount: number; // taxable base (in base currency)
  precision?: number; // dp for currency
  rounding?: Rounding;
  rate?: number | null; // if provided, use it; else resolve by rule
};

export type ResolvedTax = {
  code_id: string;
  rate: number;
  tax_amount: number; // rounded
};

export function computeTax(ctx: TaxContext & { rate: number }): ResolvedTax {
  const precision = ctx.precision ?? 2;
  const rounding = ctx.rounding ?? 'half_up';
  const tax = ctx.base_amount * ctx.rate;
  return {
    code_id: ctx.code_id,
    rate: ctx.rate,
    tax_amount: roundMoney(tax, precision, rounding),
  };
}
