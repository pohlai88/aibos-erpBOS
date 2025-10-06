import { pool } from '../../../../lib/db';
import { ok, unprocessable } from '../../../../lib/http';
import { requireAuth, requireCapability } from '../../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../../lib/route-utils';

export const PATCH = withRouteErrors(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, 'budgets:manage');
    if (isResponse(capCheck)) return capCheck;

    const { id } = await params;

    // Check if budget exists and belongs to user's company
    const budgetCheck = await pool.query(
      `select id, locked from budget where id = $1 and company_id = $2`,
      [id, auth.company_id]
    );

    if (budgetCheck.rows.length === 0) {
      return unprocessable(`Budget ${id} not found`);
    }

    if (budgetCheck.rows[0].locked) {
      return unprocessable(`Budget ${id} is already locked`);
    }

    // Lock the budget
    await pool.query(
      `update budget set locked = true where id = $1 and company_id = $2`,
      [id, auth.company_id]
    );

    return ok({
      id,
      locked: true,
      message: 'Budget locked successfully',
    });
  }
);
