// M01: Core Ledger - Reparent Account API Route
// Handles account reparent operations with strict authentication

import { NextRequest } from 'next/server';
import { ok, badRequest, notFound, serverError } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { pool } from '../../../lib/db';
import { withRouteErrors } from '@/api/_kit';
import { z } from 'zod';

// ===== Validation Schemas =====
const reparentRequestSchema = z.object({
  accountId: z.string(),
  newParentCode: z.string().nullable(),
});

// ===== Helper Functions =====
function mapAccountToResponse(account: any) {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    normalBalance: account.normal_balance,
    parentCode: account.parent_code,
    requireCostCenter: account.require_cost_center === 'true',
    requireProject: account.require_project === 'true',
    class: account.class,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  };
}

// ===== POST /api/accounts/reparent - Perform reparent operation =====
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'gl:write');
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = reparentRequestSchema.parse(await req.json());
    const { accountId, newParentCode } = input;

    // Get the account to reparent
    const accountResult = await pool.query(
      `SELECT * FROM account WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [accountId, auth.company_id]
    );

    if (accountResult.rows.length === 0) {
      return notFound('Account not found');
    }

    const accountToReparent = accountResult.rows[0];

    // Validate parent account if provided
    if (newParentCode) {
      const parentResult = await pool.query(
        `SELECT * FROM account WHERE code = $1 AND company_id = $2 LIMIT 1`,
        [newParentCode, auth.company_id]
      );

      if (parentResult.rows.length === 0) {
        return badRequest('New parent account not found');
      }

      const newParent = parentResult.rows[0];

      // Check account type compatibility
      if (accountToReparent.type !== newParent.type) {
        return badRequest('Account types must match');
      }
    }

    // Perform reparent operation
    const result = await pool.query(
      `UPDATE account 
       SET parent_code = $1, updated_at = NOW() 
       WHERE id = $2 AND company_id = $3
       RETURNING *`,
      [newParentCode, accountId, auth.company_id]
    );

    const updatedAccount = mapAccountToResponse(result.rows[0]);
    return ok(updatedAccount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', error.errors);
    }
    if (error instanceof Error) {
      return serverError(`Failed to reparent account: ${error.message}`);
    }
    return serverError('Failed to reparent account');
  }
});