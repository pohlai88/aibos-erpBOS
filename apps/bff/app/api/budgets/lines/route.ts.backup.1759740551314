import { pool } from '../../../lib/db';
import { ok, created, unprocessable } from '../../../lib/http';
import {
  requireAuth,
  enforceCompanyMatch,
  requireCapability,
} from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import { ensureDimValid } from '../../../lib/dimensions';
import crypto from 'node:crypto';

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'budgets:manage');
  if (isResponse(capCheck)) return capCheck;

  const b = (await req.json()) as {
    budget_id: string;
    company_id: string;
    items: Array<{
      period_month: string;
      account_code: string;
      cost_center_id?: string;
      project_id?: string;
      amount_base: number;
    }>;
  };

  if (!b.budget_id || !b.company_id || !b.items || !Array.isArray(b.items)) {
    return unprocessable('budget_id, company_id, and items array are required');
  }

  const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  // Check if budget exists and is not locked
  const budgetCheck = await pool.query(
    `select id, locked from budget where id = $1 and company_id = $2`,
    [b.budget_id, b.company_id]
  );

  if (budgetCheck.rows.length === 0) {
    return unprocessable(`Budget ${b.budget_id} not found`);
  }

  if (budgetCheck.rows[0].locked) {
    return unprocessable(
      `Budget ${b.budget_id} is locked and cannot be modified`
    );
  }

  let upserted = 0;

  for (const item of b.items) {
    if (
      !item.period_month ||
      !item.account_code ||
      typeof item.amount_base !== 'number'
    ) {
      return unprocessable(
        'Each item must have period_month, account_code, and amount_base'
      );
    }

    // Validate dimensions exist and are active
    await ensureDimValid(item.cost_center_id || null, 'cost_center');
    await ensureDimValid(item.project_id || null, 'project');

    // Check if account exists
    const accountCheck = await pool.query(
      `select id from account where code = $1 and company_id = $2`,
      [item.account_code, b.company_id]
    );

    if (accountCheck.rows.length === 0) {
      return unprocessable(`Account ${item.account_code} not found`);
    }

    // Upsert budget line
    await pool.query(
      `insert into budget_line(id, budget_id, company_id, period_month, account_code, cost_center_id, project_id, amount_base)
             values ($1, $2, $3, $4, $5, $6, $7, $8)
             on conflict (budget_id, period_month, account_code, coalesce(cost_center_id,''), coalesce(project_id,''))
             do update set amount_base = $8`,
      [
        crypto.randomUUID(),
        b.budget_id,
        b.company_id,
        item.period_month,
        item.account_code,
        item.cost_center_id || null,
        item.project_id || null,
        item.amount_base,
      ]
    );

    upserted++;
  }

  return created({ upserted }, `/api/budgets/${b.budget_id}/lines`);
});
