import { pool } from "../../../lib/db";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, "reports:read");
  if (isResponse(capCheck)) return capCheck;

  const url = new URL(req.url);
  
  // Get company base currency
  const company = await pool.query(`select base_currency from company where id=$1`, [auth.company_id]);
  const baseCurrency = company.rows[0]?.base_currency || "MYR";
  
  const currency = url.searchParams.get("currency") ?? baseCurrency;

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
  let debit = 0, credit = 0;
  const mapped = rows.map(r => {
    const d = Number(r.debit ?? 0);
    const c = Number(r.credit ?? 0);
    debit += d; credit += c;
    return {
      account_code: r.account_code as string,
      debit: d.toFixed(2),
      credit: c.toFixed(2),
      currency: currency
    };
  });

  return Response.json({
    company_id: auth.company_id,
    currency,
    base_currency: baseCurrency,
    rows: mapped,
    control: { debit: debit.toFixed(2), credit: credit.toFixed(2) }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
});

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}