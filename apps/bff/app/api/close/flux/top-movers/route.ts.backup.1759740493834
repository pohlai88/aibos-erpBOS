import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { FluxEngineService } from '@/services/flux/engine';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:report');

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('run_id');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!runId) {
    return ok({ error: 'run_id is required' }, 400);
  }

  const service = new FluxEngineService();
  const topMovers = await service.getTopMovers(runId, limit);

  return ok({ top_movers: topMovers });
});
