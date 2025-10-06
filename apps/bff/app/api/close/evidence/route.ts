import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { CloseOrchestratorService } from '@/services/close/orchestrator';
import { CloseEvidenceAdd, CloseEvidenceQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:report');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = CloseEvidenceQuery.parse({
    run_id: searchParams.get('run_id') || undefined,
    task_id: searchParams.get('task_id') || undefined,
    kind: (searchParams.get('kind') as any) || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new CloseOrchestratorService();
  const evidence = await service.queryCloseEvidence(authCtx.company_id, query);

  return ok({ evidence });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:run');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = CloseEvidenceAdd.parse(body);

  const service = new CloseOrchestratorService();
  const evidence = await service.addEvidence(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ evidence });
});
