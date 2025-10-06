import type { Pool } from 'pg';
import { DefaultFxPolicy } from '@aibos/policies';

export async function getFxQuotesForDateOrBefore(
  pool: Pool,
  from: string,
  to: string,
  onISO: string,
  daysBack = 30
) {
  // fetch within window to reduce scan
  const { rows } = await pool.query(
    `
    select date::text as date, from_ccy as from, to_ccy as to, rate::text
    from fx_rate
    where from_ccy = $1 and to_ccy = $2 and date <= $3 and date >= ($3::date - $4::int)
    order by date desc
    limit 30
  `,
    [from, to, onISO, daysBack]
  );
  return rows.map(r => ({
    date: r.date,
    from: r.from,
    to: r.to,
    rate: Number(r.rate),
  }));
}

export async function computeBaseAmounts(
  pool: Pool,
  companyId: string,
  docDate: string,
  lines: Array<{ amount: number; currency: string }>
): Promise<{ baseCurrency: string; rateUsed: number; baseAmounts: number[] }> {
  // Get company base currency
  const company = await pool.query(
    `select base_currency from company where id=$1`,
    [companyId]
  );
  if (!company.rows.length) throw new Error('Company not found');
  const baseCurrency = company.rows[0].base_currency;

  const baseAmounts: number[] = [];
  let rateUsed = 1.0;

  for (const line of lines) {
    if (line.currency === baseCurrency) {
      // Same currency - no conversion needed
      baseAmounts.push(line.amount);
    } else {
      // Different currency - get FX rate
      const quotes = await getFxQuotesForDateOrBefore(
        pool,
        line.currency,
        baseCurrency,
        docDate
      );
      const rate = DefaultFxPolicy.selectRate(
        quotes,
        line.currency,
        baseCurrency,
        docDate
      );

      if (!rate) {
        throw new Error(
          `No FX rate available for ${line.currency} to ${baseCurrency} on ${docDate}`
        );
      }

      const baseAmount = Math.round(line.amount * rate * 100) / 100; // Round to 2 decimal places
      baseAmounts.push(baseAmount);
      rateUsed = rate;
    }
  }

  return { baseCurrency, rateUsed, baseAmounts };
}
