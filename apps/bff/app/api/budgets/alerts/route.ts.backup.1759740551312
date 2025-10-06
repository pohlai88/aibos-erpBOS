import { z } from 'zod';
import { pool } from '../../../lib/db';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { ok, badRequest } from '../../../lib/http';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

// Schema for creating budget alert rules
const CreateAlertRuleSchema = z.object({
  name: z.string().min(1).max(200),
  accountCode: z.string().optional(),
  costCenter: z.string().optional(),
  project: z.string().optional(),
  periodScope: z.enum(['month', 'qtr', 'ytd']),
  thresholdPct: z.number().min(0.1).max(1000), // 0.1% to 1000%
  comparator: z.enum(['gt', 'lt', 'gte', 'lte', 'abs_gt', 'abs_gte']),
  delivery: z
    .object({
      email: z.array(z.string().email()).optional(),
      webhook: z.string().url().optional(),
    })
    .refine(data => data.email || data.webhook, {
      message: 'Must specify at least one delivery method (email or webhook)',
    }),
});

export const POST = withRouteErrors(async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, 'budgets:manage');
    if (isResponse(capCheck)) return capCheck;
    const body = await req.json();
    const payload = CreateAlertRuleSchema.parse(body);

    // Create new budget alert rule
    const ruleId = `bar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await pool.query(
      `INSERT INTO budget_alert_rule 
       (id, company_id, name, account_code, cost_center, project, period_scope, threshold_pct, comparator, delivery, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        ruleId,
        auth.company_id,
        payload.name,
        payload.accountCode || null,
        payload.costCenter || null,
        payload.project || null,
        payload.periodScope,
        payload.thresholdPct,
        payload.comparator,
        JSON.stringify(payload.delivery),
        auth.user_id,
      ]
    );

    return ok({
      rule: result.rows[0],
      message: 'Budget alert rule created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Invalid request data', error.errors);
    }
    console.error('Error creating budget alert rule:', error);
    return badRequest('Failed to create budget alert rule');
  }
});

export const GET = withRouteErrors(async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, 'budgets:read');
    if (isResponse(capCheck)) return capCheck;

    const result = await pool.query(
      `SELECT * FROM budget_alert_rule 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [auth.company_id]
    );

    return ok({
      rules: result.rows,
    });
  } catch (error) {
    console.error('Error fetching budget alert rules:', error);
    return badRequest('Failed to fetch budget alert rules');
  }
});
