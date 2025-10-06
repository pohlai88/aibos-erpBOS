import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ITGCUARService } from '@/services/itgc/uar';
import { CampaignDecideItem } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'itgc:campaigns');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = CampaignDecideItem.parse(body);

  const uarService = new ITGCUARService();
  const result = await uarService.decideItems(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({
    success: true,
    data: result,
  });
});
