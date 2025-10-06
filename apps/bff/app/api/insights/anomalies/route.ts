import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { InsightsAnomalyService } from '@/services/insights/anomaly';
import { ok } from '@/api/_kit';

// GET /api/insights/anomalies - Get open anomalies
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'insights:view');

  const authCtx = auth as AuthCtx;

  const service = new InsightsAnomalyService();
  const anomalies = await service.getOpenAnomalies(authCtx.company_id);

  return ok({ anomalies });
});

// POST /api/insights/anomalies - Scan for anomalies
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'insights:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const runId = body.run_id;

  const service = new InsightsAnomalyService();
  const result = await service.scanAnomalies(authCtx.company_id, runId);

  return ok(result);
});
