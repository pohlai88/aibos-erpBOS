import { pool } from "../../../lib/db";
import { requireAuth, requireCapability, enforceCompanyMatch } from "../../../lib/auth";
import { ok, unprocessable } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, "reports:read");
  if (isResponse(capCheck)) return capCheck;

  const url = new URL(req.url);
  const company_id = url.searchParams.get("company_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!company_id || !from || !to) return unprocessable("company_id, from, to required");

  const companyMatchResult = enforceCompanyMatch(auth, company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  // Using account codes from map to find which lines belong to Output/Input tax
  const maps = await pool.query(
    `select tax_code_id, output_account_code, input_account_code
       from tax_account_map where company_id=$1`,
    [company_id]
  );
  const outAccs = maps.rows.filter((r: any) => r.output_account_code).map((r: any) => r.output_account_code);
  const inAccs = maps.rows.filter((r: any) => r.input_account_code).map((r: any) => r.input_account_code);

  const out = await pool.query(
    `select 'SR' as tax_code_id, sum(case when jl.dc='CR' then jl.base_amount else -jl.base_amount end) as amt
       from journal_line jl
       join journal j on j.id = jl.journal_id
      where j.company_id=$1 and j.posting_date >= $2 and j.posting_date < ($3::date + 1)
        and jl.account_code = any($4)
      group by 1
      order by 1`,
    [company_id, from, to, outAccs]
  );

  const inn = await pool.query(
    `select 'SR' as tax_code_id, sum(case when jl.dc='DR' then jl.base_amount else -jl.base_amount end) as amt
       from journal_line jl
       join journal j on j.id = jl.journal_id
      where j.company_id=$1 and j.posting_date >= $2 and j.posting_date < ($3::date + 1)
        and jl.account_code = any($4)
      group by 1
      order by 1`,
    [company_id, from, to, inAccs]
  );

  const outRows = out.rows.map((r: any) => ({ tax_code_id: r.tax_code_id, amount: Math.abs(Number(r.amt || 0)) }));
  const inRows = inn.rows.map((r: any) => ({ tax_code_id: r.tax_code_id, amount: Math.abs(Number(r.amt || 0)) }));
  const totalOut = outRows.reduce((s, r) => s + r.amount, 0);
  const totalIn = inRows.reduce((s, r) => s + r.amount, 0);

  return ok({
    company_id, from, to,
    output: outRows,
    input: inRows,
    net_payable: Math.round((totalOut - totalIn) * 100) / 100
  });
});
