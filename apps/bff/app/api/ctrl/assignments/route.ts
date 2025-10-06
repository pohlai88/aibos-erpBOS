import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ControlsAdminService } from '@/services/controls/admin';
import { AssignmentUpsert, AssignmentQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:report');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = AssignmentQuery.parse({
    control_id: searchParams.get('control_id') || undefined,
    run_id: searchParams.get('run_id') || undefined,
    task_id: searchParams.get('task_id') || undefined,
    entity_id: searchParams.get('entity_id') || undefined,
    owner: searchParams.get('owner') || undefined,
    approver: searchParams.get('approver') || undefined,
    active:
      searchParams.get('active') === 'true'
        ? true
        : searchParams.get('active') === 'false'
          ? false
          : undefined,
    sla_breach:
      searchParams.get('sla_breach') === 'true'
        ? true
        : searchParams.get('sla_breach') === 'false'
          ? false
          : undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new ControlsAdminService();
  const assignments = await service.queryAssignments(authCtx.company_id, query);

  return ok({ assignments });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:assign');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const validatedData = AssignmentUpsert.parse(body);

  const service = new ControlsAdminService();
  const assignment = await service.upsertAssignment(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ assignment });
});
