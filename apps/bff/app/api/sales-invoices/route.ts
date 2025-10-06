import { SalesInvoice } from '@aibos/contracts/http/sales/sales-invoice.schema';
import { postSalesInvoice } from '@aibos/services/src/posting';
import { repo, tx, pool } from '../../lib/db';
import { ensurePostingAllowed } from '../../lib/policy';
import {
  requireAuth,
  enforceCompanyMatch,
  requireCapability,
} from '../../lib/auth';
import { withRouteErrors, isResponse } from '../../lib/route-utils';
import { ok } from '@/api/_lib/http';
import { resolveTaxRule, mapTaxAccount } from '../../lib/tax';

export const POST = withRouteErrors(async (req: Request) => {
  const authResult = await requireAuth(req);
  if (isResponse(authResult)) return authResult;

  const capCheck = requireCapability(authResult, 'journals:post');
  if (isResponse(capCheck)) return capCheck;

  const input = SalesInvoice.parse(await req.json());

  const companyMatchResult = enforceCompanyMatch(authResult, input.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  const postingCheck = await ensurePostingAllowed(
    authResult.company_id,
    input.doc_date
  );
  if (isResponse(postingCheck)) return postingCheck;

  // Check for existing journal by idempotency key
  const rule = await import('@aibos/posting-rules').then(m =>
    m.loadRule('sales-invoice')
  );
  const idParts = rule.idempotencyKey.map((k: string) =>
    k === 'doctype'
      ? 'SalesInvoice'
      : k === 'id'
        ? input.id
        : k === 'version'
          ? 'v1'
          : ((input as any)[k] ?? String((input as any)[k]))
  );
  const key = idParts.join(':');

  const existingId = await repo.getIdByKey(key);
  if (existingId) {
    const response = ok({ journal_id: existingId }, 200);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('X-Idempotent-Replay', 'true');
    return response;
  }

  const journal = await postSalesInvoice(
    { ...input, company_id: authResult.company_id },
    {
      repo,
      tx,
      pool,
      resolveTaxRule,
      mapTaxAccount,
    }
  );
  const response = ok({ journal_id: journal.id }, 201);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
});

export const OPTIONS = withRouteErrors(async (req: Request) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
});
