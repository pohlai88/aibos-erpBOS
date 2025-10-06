import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ControlsAdminService } from '@/services/controls/admin';
import { ControlsRunnerService } from '@/services/controls/runner';
import { ControlsExceptionsService } from '@/services/controls/exceptions';
import {
  ControlUpsert,
  ControlQuery,
  AssignmentUpsert,
  AssignmentQuery,
  ControlRunRequest,
  ControlRunQuery,
  ExceptionUpdate,
  ExceptionQuery,
  ControlWaive,
  EvidenceAdd,
  EvidenceQuery,
} from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:report');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = ControlQuery.parse({
    domain: (searchParams.get('domain') as any) || undefined,
    frequency: (searchParams.get('frequency') as any) || undefined,
    severity: (searchParams.get('severity') as any) || undefined,
    status: (searchParams.get('status') as any) || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new ControlsAdminService();
  const controls = await service.queryControls(authCtx.company_id, query);

  return ok({ controls });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:manage');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const validatedData = ControlUpsert.parse(body);

  const service = new ControlsAdminService();
  const control = await service.upsertControl(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ control });
});
