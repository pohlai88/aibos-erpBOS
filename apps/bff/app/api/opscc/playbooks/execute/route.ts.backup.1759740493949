import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { PlaybooksService } from '@/services/opscc';
import { PlaybookExecuteReq } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// GET /api/opscc/playbooks/execute - Get playbook actions
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'opscc:view');

  const service = new PlaybooksService();
  const actions = await service.getPlaybookActions();

  return ok({ actions });
});

// POST /api/opscc/playbooks/execute - Execute playbook action
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  // Note: Capability check will be done per-action based on required_capability

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = PlaybookExecuteReq.parse(body);

  const service = new PlaybooksService();

  // Get the action to check required capability
  const action = await service.getPlaybookAction(validatedData.action_id);
  if (!action) {
    return ok({ error: 'Action not found' }, 404);
  }

  // Check required capability
  await requireCapability(auth, action.required_capability as any);

  const result = await service.executePlaybook(
    authCtx.company_id,
    validatedData
  );

  return ok({ result });
});
