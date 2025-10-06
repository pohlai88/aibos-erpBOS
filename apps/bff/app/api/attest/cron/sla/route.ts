import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AttestSlaService } from '@/services/attest';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'attest:campaign');

  const authCtx = auth as AuthCtx;
  const body = await request.json();

  const { campaignId } = body;

  const slaService = new AttestSlaService();
  const result = await slaService.tickSla(campaignId, authCtx.company_id);

  return ok(result);
});
