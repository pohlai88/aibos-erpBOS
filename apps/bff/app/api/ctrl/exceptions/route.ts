import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ControlsExceptionsService } from '@/services/controls/exceptions';
import { ExceptionUpdate, ExceptionQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:exceptions');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = ExceptionQuery.parse({
    ctrl_run_id: searchParams.get('ctrl_run_id') || undefined,
    remediation_state:
      (searchParams.get('remediation_state') as any) || undefined,
    material:
      searchParams.get('material') === 'true'
        ? true
        : searchParams.get('material') === 'false'
          ? false
          : undefined,
    assignee: searchParams.get('assignee') || undefined,
    sla_breach:
      searchParams.get('sla_breach') === 'true'
        ? true
        : searchParams.get('sla_breach') === 'false'
          ? false
          : undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new ControlsExceptionsService();
  const exceptions = await service.queryExceptions(authCtx.company_id, query);

  return ok({ exceptions });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:remediate');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const validatedData = ExceptionUpdate.parse(body);

  const service = new ControlsExceptionsService();
  const exception = await service.updateException(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ exception });
});
