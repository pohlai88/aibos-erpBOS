import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { InsightsBenchmarksService } from '@/services/insights/benchmarks';
import { BenchSeedReq, TargetUpsert } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/insights/benchmarks/run - Compute benchmark baselines
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'insights:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const entityGroup = body.entity_group || 'SELF';

  const service = new InsightsBenchmarksService();
  const result = await service.computeBenchmarks(
    authCtx.company_id,
    entityGroup
  );

  return ok(result);
});
