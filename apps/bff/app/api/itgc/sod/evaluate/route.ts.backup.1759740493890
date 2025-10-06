import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ITGCSoDService } from '@/services/itgc/sod';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'itgc:admin');

  const authCtx = auth as AuthCtx;
  const sodService = new ITGCSoDService();
  const result = await sodService.evaluateSoDRules(authCtx.company_id);

  return ok({
    success: true,
    data: result,
  });
});
