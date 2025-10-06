import crypto from 'node:crypto';
import { pool } from '../../../lib/db';
import {
  requireAuth,
  requireCapability,
  enforceCompanyMatch,
} from '../../../lib/auth';
import { created, unprocessable } from '../../../lib/http';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'periods:manage');
  if (isResponse(capCheck)) return capCheck;

  const b = (await req.json()) as {
    company_id: string;
    items: {
      tax_code_id: string;
      effective_from: string;
      effective_to?: string;
      override_rate?: number;
    }[];
  };
  if (!b?.company_id || !Array.isArray(b.items) || !b.items.length)
    return unprocessable('company_id & items required');

  const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  for (const it of b.items) {
    await pool.query(
      `insert into tax_rule(id,company_id,tax_code_id,effective_from,effective_to,override_rate)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do nothing`,
      [
        crypto.randomUUID(),
        b.company_id,
        it.tax_code_id,
        it.effective_from,
        it.effective_to ?? null,
        it.override_rate ?? null,
      ]
    );
  }
  return created({ count: b.items.length }, '/api/tax/rules');
});
