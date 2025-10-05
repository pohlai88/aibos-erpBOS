import { pool } from "../../../lib/db";
import { requireAuth, requireCapability, enforceCompanyMatch } from "../../../lib/auth";
import { created, unprocessable } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, "periods:manage");
  if (isResponse(capCheck)) return capCheck;

  const b = await req.json() as { company_id: string, items: { tax_code_id: string, output_account_code?: string, input_account_code?: string }[] };
  if (!b?.company_id || !Array.isArray(b.items) || !b.items.length) return unprocessable("company_id & items required");
  
  const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  for (const it of b.items) {
    await pool.query(
      `insert into tax_account_map(company_id,tax_code_id,output_account_code,input_account_code)
       values ($1,$2,$3,$4)
       on conflict (company_id,tax_code_id) do update set
         output_account_code=excluded.output_account_code, input_account_code=excluded.input_account_code`,
      [b.company_id, it.tax_code_id, it.output_account_code ?? null, it.input_account_code ?? null]
    );
  }
  return created({ count: b.items.length }, "/api/tax/accounts");
});
