import { z } from 'zod';
import { requireAuth, requireCapability } from '../../../../lib/auth';
import { ok, badRequest } from '../../../../lib/http';
import { withRouteErrors, isResponse } from '../../../../lib/route-utils';
import { evaluateAlerts } from '../../../../services/budgets/alerts';

// Schema for running alerts
const RunAlertsSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
});

export const POST = withRouteErrors(async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, 'budgets:manage');
    if (isResponse(capCheck)) return capCheck;
    const body = await req.json();
    const { year, month } = RunAlertsSchema.parse(body);

    // Run alert evaluation
    const breaches = await evaluateAlerts(auth.company_id, { year, month });

    return ok({
      message: 'Alert evaluation completed',
      period: { year, month },
      breaches: breaches,
      summary: {
        totalBreaches: breaches.length,
        uniqueRules: new Set(breaches.map(b => b.ruleId)).size,
        uniqueAccounts: new Set(breaches.map(b => b.account)).size,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Invalid request data', error.errors);
    }
    console.error('Error running budget alerts:', error);
    return badRequest('Failed to run budget alerts');
  }
});
