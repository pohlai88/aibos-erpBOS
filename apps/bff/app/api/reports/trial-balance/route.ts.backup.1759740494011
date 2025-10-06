import { pool } from '../../../lib/db';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import { convertToPresent } from '@aibos/policies';

async function getPresentQuotes(base: string, present: string, onISO: string) {
  const { rows } = await pool.query(
    `select date::text as date, from_ccy as from, to_ccy as to, rate::text
       from fx_rate
      where from_ccy=$1 and to_ccy=$2 and date <= $3
      order by date desc
      limit 1`,
    [base, present, onISO]
  );
  return rows.map(r => ({
    date: r.date,
    from: r.from,
    to: r.to,
    rate: Number(r.rate),
  }));
}

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'reports:read');
  if (isResponse(capCheck)) return capCheck;

  const url = new URL(req.url);

  // Get company base currency
  const company = await pool.query(
    `select base_currency from company where id=$1`,
    [auth.company_id]
  );
  const baseCurrency = company.rows[0]?.base_currency || 'MYR';

  const currency = url.searchParams.get('currency') ?? baseCurrency;
  const present = url.searchParams.get('present'); // e.g. "USD"
  const asOf = (
    url.searchParams.get('as_of') ?? new Date().toISOString()
  ).slice(0, 10);

  const sql = `
    SELECT
      jl.account_code,
      jl.currency,
      jl.base_currency,
      jl.base_amount,
      SUM(CASE WHEN jl.dc = 'D' THEN 
        CASE 
          WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
          ELSE jl.amount::numeric 
        END
        ELSE 0 END) AS debit,
      SUM(CASE WHEN jl.dc = 'C' THEN 
        CASE 
          WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
          ELSE jl.amount::numeric 
        END
        ELSE 0 END) AS credit
    FROM journal_line jl
    JOIN journal j ON j.id = jl.journal_id
    WHERE j.company_id = $1
    GROUP BY jl.account_code, jl.currency, jl.base_currency, jl.base_amount
    ORDER BY jl.account_code;
  `;

  const { rows } = await pool.query(sql, [auth.company_id, currency]);

  // control totals
  let debit = 0,
    credit = 0;
  const mapped = rows.map(r => {
    const d = Number(r.debit ?? 0);
    const c = Number(r.credit ?? 0);
    debit += d;
    credit += c;
    return {
      account_code: r.account_code as string,
      debit: d.toFixed(2),
      credit: c.toFixed(2),
      currency: currency,
    };
  });

  // Optional presentation currency conversion
  let rate = null;
  let presentCurrency = currency;
  let convertedRows = mapped;

  if (present && present !== currency) {
    const quotes = await getPresentQuotes(currency, present, asOf);
    if (quotes.length) {
      rate = quotes[0]?.rate;
      presentCurrency = present;

      // Convert all amounts
      convertedRows = mapped.map(r => ({
        ...r,
        debit:
          convertToPresent(
            Number(r.debit),
            currency,
            present,
            quotes,
            asOf
          )?.toFixed(2) ?? r.debit,
        credit:
          convertToPresent(
            Number(r.credit),
            currency,
            present,
            quotes,
            asOf
          )?.toFixed(2) ?? r.credit,
        currency: present,
      }));

      // Convert control totals
      debit = convertToPresent(debit, currency, present, quotes, asOf) ?? debit;
      credit =
        convertToPresent(credit, currency, present, quotes, asOf) ?? credit;
    }
  }

  return Response.json(
    {
      company_id: auth.company_id,
      currency: presentCurrency,
      base_currency: baseCurrency,
      present_currency: rate ? present : currency,
      rate_used: rate,
      rows: convertedRows,
      control: { debit: debit.toFixed(2), credit: credit.toFixed(2) },
      equationOK: Math.abs(debit - credit) < 0.01, // Allow for rounding differences
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
});

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
