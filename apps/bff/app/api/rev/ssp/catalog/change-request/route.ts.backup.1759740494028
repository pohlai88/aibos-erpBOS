import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { RevSspAdminService } from '@/services/revenue/ssp-admin';
import { SspChangeRequest } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'rev:ssp');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = SspChangeRequest.parse(body);

  const service = new RevSspAdminService();
  const change = await service.createSspChangeRequest(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ change });
});
