import { PurchaseInvoice } from '@aibos/contracts/http/purchase/purchase-invoice.schema';
import { postPurchaseInvoice } from '@aibos/services/src/posting-pi';
import { repo, tx, pool } from '../../lib/db';
import { ok, created } from '../../lib/http';
import { ensurePostingAllowed } from '../../lib/policy';
import {
  requireAuth,
  enforceCompanyMatch,
  requireCapability,
} from '../../lib/auth';
import { withRouteErrors, isResponse } from '../../lib/route-utils';
import { resolveTaxRule, mapTaxAccount } from '../../lib/tax';

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'journals:post');
  if (isResponse(capCheck)) return capCheck;

  const input = PurchaseInvoice.parse(await req.json());

  const companyMatchResult = enforceCompanyMatch(auth, input.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  const postingCheck = await ensurePostingAllowed(
    auth.company_id,
    input.doc_date
  );
  if (isResponse(postingCheck)) return postingCheck;

  // derive idempotency key like the service does (PurchaseInvoice:<id>:v1)
  const idemKey = `PurchaseInvoice:${input.id}:v1`;

  // quick existence probe
  const existing = await repo.getIdByKey(idemKey as any);
  if (existing) {
    return ok(
      { journal_id: existing },
      {
        'X-Idempotent-Replay': 'true',
        Location: `/api/journals/${existing}`,
      }
    );
  }

  const journal = await postPurchaseInvoice(
    { ...input, company_id: auth.company_id },
    {
      repo,
      tx,
      pool,
      resolveTaxRule,
      mapTaxAccount,
    }
  );
  return created({ journal_id: journal.id }, `/api/journals/${journal.id}`);
});

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
