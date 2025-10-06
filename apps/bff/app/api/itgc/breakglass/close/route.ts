import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ITGCBreakglassService } from '@/services/itgc/breakglass';
import { BreakglassClose } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'itgc:breakglass');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = BreakglassClose.parse(body);

  const breakglassService = new ITGCBreakglassService();
  await breakglassService.closeBreakglass(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({
    success: true,
    message: 'Break-glass access closed successfully',
  });
});
