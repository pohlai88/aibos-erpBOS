import { pool } from "../../../lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const company_id = url.searchParams.get("company_id") ?? "COMP-1";
  const currency = url.searchParams.get("currency") ?? "MYR";

  const sql = `
    SELECT
      jl.account_code,
      jl.currency,
      SUM(CASE WHEN jl.dc = 'D' THEN jl.amount::numeric ELSE 0 END) AS debit,
      SUM(CASE WHEN jl.dc = 'C' THEN jl.amount::numeric ELSE 0 END) AS credit
    FROM journal_line jl
    JOIN journal j ON j.id = jl.journal_id
    WHERE j.company_id = $1 AND j.currency = $2
    GROUP BY jl.account_code, jl.currency
    ORDER BY jl.account_code;
  `;

  const { rows } = await pool.query(sql, [company_id, currency]);

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
      currency: r.currency as string
    };
  });

  return Response.json({
    company_id,
    currency,
    rows: mapped,
    control: { debit: debit.toFixed(2), credit: credit.toFixed(2) }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

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