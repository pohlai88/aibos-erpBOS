import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { CloseOrchestratorService } from '@/services/close/orchestrator';
import { CloseTaskUpsert, CloseTaskQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:report');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = CloseTaskQuery.parse({
    run_id: searchParams.get('run_id') || undefined,
    status: (searchParams.get('status') as any) || undefined,
    owner: searchParams.get('owner') || undefined,
    sla_breach:
      searchParams.get('sla_breach') === 'true'
        ? true
        : searchParams.get('sla_breach') === 'false'
          ? false
          : undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new CloseOrchestratorService();
  const tasks = await service.queryCloseTasks(authCtx.company_id, query);

  return ok({ tasks });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:run');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = CloseTaskUpsert.parse(body);

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('run_id');
  if (!runId) {
    return ok({ error: 'run_id is required' }, 400);
  }

  const service = new CloseOrchestratorService();
  const task = await service.upsertCloseTask(
    authCtx.company_id,
    runId,
    authCtx.user_id,
    data
  );

  return ok({ task });
});
