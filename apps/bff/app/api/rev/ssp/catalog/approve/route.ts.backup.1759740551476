import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { RevSspAdminService } from '@/services/revenue/ssp-admin';
import { SspChangeDecision } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'rev:ssp');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const changeId = searchParams.get('change_id');
  if (!changeId) {
    throw new Error('change_id parameter is required');
  }

  const body = await request.json();
  const data = SspChangeDecision.parse(body);

  const service = new RevSspAdminService();
  const change = await service.decideSspChange(
    authCtx.company_id,
    changeId,
    authCtx.user_id,
    data
  );

  return ok({ change });
});
