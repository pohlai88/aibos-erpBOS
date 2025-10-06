// M01: Core Ledger - Individual Account API Route
// Handles account detail, update, and archive operations with strict authentication

import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden, notFound, serverError } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { pool } from '../../../lib/db';
import { withRouteErrors } from '@/api/_kit';
import { z } from 'zod';

// ===== Validation Schemas =====
const updateAccountSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/).optional(),
  name: z.string().min(5).max(255).optional(),
  type: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']).optional(),
  normalBalance: z.enum(['D', 'C']).optional(),
  parentCode: z.string().optional(),
  requireCostCenter: z.boolean().optional(),
  requireProject: z.boolean().optional(),
  class: z.string().optional(),
});

const archiveAccountSchema = z.object({
  reason: z.string().optional(),
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

// ===== GET /api/accounts/[id] - Get account by ID =====
export const GET = withRouteErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'gl:read');
  if (capCheck instanceof Response) return capCheck;

  try {
    const accountId = params.id;

    const result = await pool.query(
      `SELECT * FROM account WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [accountId, auth.company_id]
    );

    if (result.rows.length === 0) {
      return notFound('Account not found');
    }

    const account = mapAccountToResponse(result.rows[0]);
    return ok(account);
  } catch (error) {
    if (error instanceof Error) {
      return serverError(`Failed to fetch account: ${error.message}`);
    }
    return serverError('Failed to fetch account');
  }
});

// ===== PUT /api/accounts/[id] - Update account =====
export const PUT = withRouteErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'gl:write');
  if (capCheck instanceof Response) return capCheck;

  try {
    const accountId = params.id;
    const input = updateAccountSchema.parse(await req.json());

    // Check if account exists
    const existingCheck = await pool.query(
      `SELECT * FROM account WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [accountId, auth.company_id]
    );

    if (existingCheck.rows.length === 0) {
      return notFound('Account not found');
    }

    const existingAccount = existingCheck.rows[0];

    // Check for duplicate code if code is being updated
    if (input.code && input.code !== existingAccount.code) {
      const duplicateCheck = await pool.query(
        `SELECT id FROM account WHERE code = $1 AND company_id = $2 LIMIT 1`,
        [input.code, auth.company_id]
      );

      if (duplicateCheck.rows.length > 0) {
        return badRequest('Account code already exists');
      }
    }

    // Validate parent account if provided
    if (input.parentCode) {
      const parentCheck = await pool.query(
        `SELECT type FROM account WHERE code = $1 AND company_id = $2 LIMIT 1`,
        [input.parentCode, auth.company_id]
      );

      if (parentCheck.rows.length === 0) {
        return badRequest('Parent account not found');
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (input.code !== undefined) {
      updateFields.push(`code = $${paramCount}`);
      updateValues.push(input.code);
      paramCount++;
    }

    if (input.name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(input.name);
      paramCount++;
    }

    if (input.type !== undefined) {
      updateFields.push(`type = $${paramCount}`);
      updateValues.push(input.type);
      paramCount++;
    }

    if (input.normalBalance !== undefined) {
      updateFields.push(`normal_balance = $${paramCount}`);
      updateValues.push(input.normalBalance);
      paramCount++;
    }

    if (input.parentCode !== undefined) {
      updateFields.push(`parent_code = $${paramCount}`);
      updateValues.push(input.parentCode || null);
      paramCount++;
    }

    if (input.requireCostCenter !== undefined) {
      updateFields.push(`require_cost_center = $${paramCount}`);
      updateValues.push(input.requireCostCenter.toString());
      paramCount++;
    }

    if (input.requireProject !== undefined) {
      updateFields.push(`require_project = $${paramCount}`);
      updateValues.push(input.requireProject.toString());
      paramCount++;
    }

    if (input.class !== undefined) {
      updateFields.push(`class = $${paramCount}`);
      updateValues.push(input.class || null);
      paramCount++;
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(accountId, auth.company_id);

    const result = await pool.query(
      `UPDATE account 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} AND company_id = $${paramCount + 1}
       RETURNING *`,
      updateValues
    );

    const updatedAccount = mapAccountToResponse(result.rows[0]);
    return ok(updatedAccount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', error.errors);
    }
    if (error instanceof Error) {
      return serverError(`Failed to update account: ${error.message}`);
    }
    return serverError('Failed to update account');
  }
});

// ===== DELETE /api/accounts/[id] - Archive account (soft delete) =====
export const DELETE = withRouteErrors(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'gl:write');
  if (capCheck instanceof Response) return capCheck;

  try {
    const accountId = params.id;
    const body = await req.json().catch(() => ({}));
    const { reason } = archiveAccountSchema.parse(body);

    // Check if account exists
    const existingCheck = await pool.query(
      `SELECT * FROM account WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [accountId, auth.company_id]
    );

    if (existingCheck.rows.length === 0) {
      return notFound('Account not found');
    }

    const existingAccount = existingCheck.rows[0];

    // Check if account has children
    const childrenCheck = await pool.query(
      `SELECT id FROM account WHERE parent_code = $1 AND company_id = $2 LIMIT 1`,
      [existingAccount.code, auth.company_id]
    );

    if (childrenCheck.rows.length > 0) {
      return badRequest('Cannot archive account with children');
    }

    // Archive account (soft delete by updating name with [ARCHIVED] prefix)
    await pool.query(
      `UPDATE account 
       SET name = $1, updated_at = NOW() 
       WHERE id = $2 AND company_id = $3`,
      [`[ARCHIVED] ${existingAccount.name}`, accountId, auth.company_id]
    );

    return ok({ message: 'Account archived successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', error.errors);
    }
    if (error instanceof Error) {
      return serverError(`Failed to archive account: ${error.message}`);
    }
    return serverError('Failed to archive account');
  }
});
