import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { CloseSlaService } from '@/services/close/sla';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:board:manage');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  const period = searchParams.get('period');
  if (!period) {
    return ok({ error: 'Period parameter is required' }, 400);
  }

  const slaService = new CloseSlaService();
  const result = await slaService.tickSla(authCtx.company_id, period);

  return ok({
    success: true,
    period,
    result,
  });
});
