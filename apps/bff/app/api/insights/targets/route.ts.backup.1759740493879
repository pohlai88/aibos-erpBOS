import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { InsightsBenchmarksService } from '@/services/insights/benchmarks';
import { TargetUpsert } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// GET /api/insights/targets - Get benchmark targets
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'insights:view');

  const authCtx = auth as AuthCtx;

  const service = new InsightsBenchmarksService();
  const deltas = await service.getBenchmarkDeltas(authCtx.company_id);

  return ok({ targets: deltas });
});

// PUT /api/insights/targets - Upsert benchmark targets
export const PUT = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'insights:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const data = TargetUpsert.parse(body);

  const service = new InsightsBenchmarksService();
  await service.upsertTarget(authCtx.company_id, authCtx.user_id, data);

  return ok({ success: true, message: 'Target updated successfully' });
});
