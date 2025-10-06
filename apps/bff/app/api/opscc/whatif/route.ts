import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { WhatIfService } from '@/services/opscc';
import { WhatIfRunReq, BoardTypeSchema } from '@aibos/contracts';
import { z } from 'zod';
import { ok } from '@/api/_kit';

// GET /api/opscc/whatif - Get saved scenarios
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:view');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);
  const board = searchParams.get('board');
  const scenarioId = searchParams.get('scenario_id');

  const service = new WhatIfService();

  if (scenarioId) {
    const scenario = await service.getScenario(authCtx.company_id, scenarioId);
    if (!scenario) {
      return ok({ error: 'Scenario not found' }, 404);
    }
    return ok({ scenario });
  } else if (board) {
    const boardType = BoardTypeSchema.parse(board);
    const scenarios = await service.getScenarios(authCtx.company_id, boardType);
    return ok({ scenarios });
  } else {
    const scenarios = await service.getScenarios(authCtx.company_id);
    return ok({ scenarios });
  }
});

// POST /api/opscc/whatif - Run what-if simulation
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:whatif:run');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = WhatIfRunReq.parse(body);

  const service = new WhatIfService();
  const result = await service.runSimulation(authCtx.company_id, validatedData);

  return ok({ result });
});

// DELETE /api/opscc/whatif - Delete scenario
export const DELETE = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:whatif:save');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);
  const scenarioId = z.string().parse(searchParams.get('scenario_id'));

  const service = new WhatIfService();
  await service.deleteScenario(authCtx.company_id, scenarioId);

  return ok({ success: true });
});
