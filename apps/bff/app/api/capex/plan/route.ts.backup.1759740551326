// M16: Capex Plan API Route
// Handles capex plan creation and management

import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '../../../lib/http';
import { CapexPlanUpsert } from '@aibos/contracts';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { upsertPlan } from '../../../services/capex/plan';
import { withRouteErrors } from '@/api/_kit';

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'capex:manage');
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = CapexPlanUpsert.parse(await req.json());
    const result = await upsertPlan(
      auth.company_id,
      auth.user_id ?? 'unknown',
      input
    );
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Invalid capex plan data: ${error.message}`);
    }
    return badRequest('Invalid capex plan data');
  }
});
