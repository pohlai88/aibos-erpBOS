import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AttestSlaService } from '@/services/attest';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'attest:export');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  const campaignId = searchParams.get('campaignId');

  const slaService = new AttestSlaService();

  if (campaignId) {
    const summary = await slaService.getSlaSummary(
      campaignId,
      authCtx.company_id
    );
    return ok(summary);
  } else {
    const heatMap = await slaService.getHeatMap(authCtx.company_id);
    return ok(heatMap);
  }
});
