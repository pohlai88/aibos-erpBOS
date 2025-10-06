import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { KpiFabricService } from '@/services/opscc';
import { OpsccKpiQuery, BoardTypeSchema } from '@aibos/contracts';
import { z } from 'zod';
import { ok } from '@/api/_kit';

// GET /api/opscc/kpi - Get KPI data
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:view');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  const query = OpsccKpiQuery.parse({
    board: searchParams.get('board'),
    present: searchParams.get('present'),
    kpi: searchParams.get('kpi'),
    limit: searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined,
  });

  const service = new KpiFabricService();

  if (query.kpi) {
    // Get specific KPI
    const snapshot = await service.computeKpi(
      authCtx.company_id,
      query.board,
      query.kpi,
      { present: query.present }
    );
    return ok({ snapshot });
  } else {
    // Get all KPIs for board
    const board = await service.computeBoard(authCtx.company_id, query.board, {
      present: query.present,
    });
    return ok({ board });
  }
});

// POST /api/opscc/kpi/refresh - Refresh materialized views
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:admin');

  const authCtx = auth as AuthCtx;
  const service = new KpiFabricService();

  await service.refreshMaterializedViews(authCtx.company_id);

  return ok({ success: true, message: 'Materialized views refreshed' });
});
