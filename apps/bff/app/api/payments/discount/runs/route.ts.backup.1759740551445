import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { listDiscountRuns, getDiscountRun } from '@/services/payments/discount';

// GET /api/payments/discount/runs - List discount runs
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'pay:discount:run');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const runId = url.searchParams.get('run_id');
  const status = url.searchParams.get('status');

  if (runId) {
    const run = await getDiscountRun(auth.company_id, runId);
    return ok({ run });
  }

  const runs = await listDiscountRuns(auth.company_id, status || undefined);
  return ok({ runs });
});
