import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { DiscountRunReq } from '@aibos/contracts';
import { optimizeAndCommitDiscountRun } from '@/services/payments/discount';

// POST /api/payments/discount/run - Optimize and commit discount run
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'pay:discount:run');
  if (forbiddenCheck) return forbiddenCheck;

  const body = await req.json();
  const validated = DiscountRunReq.safeParse(body);

  if (!validated.success) {
    return unprocessable(validated.error.message);
  }

  const run = await optimizeAndCommitDiscountRun(
    auth.company_id,
    validated.data,
    auth.user_id
  );

  return ok({ run });
});
