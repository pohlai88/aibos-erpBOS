import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { InsightsBenchmarksService } from '@/services/insights/benchmarks';
import { BenchSeedReq, TargetUpsert } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// GET /api/insights/benchmarks - Get benchmark deltas
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'insights:view');

  const authCtx = auth as AuthCtx;

  const service = new InsightsBenchmarksService();
  const deltas = await service.getBenchmarkDeltas(authCtx.company_id);

  return ok({ deltas });
});

// POST /api/insights/benchmarks - Seed benchmark baselines
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'insights:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const data = BenchSeedReq.parse(body);

  const service = new InsightsBenchmarksService();
  await service.seedBenchmarks(authCtx.company_id, data);

  return ok({ success: true, message: 'Benchmark seeded successfully' });
});
