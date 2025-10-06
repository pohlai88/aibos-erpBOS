// M01: Core Ledger - Accounts API Route
// Handles account CRUD operations with strict authentication and validation

import { NextRequest } from 'next/server';
import { ok, created, badRequest, forbidden, notFound, serverError } from '../../lib/http';
import { requireAuth, requireCapability } from '../../lib/auth';
import { pool } from '../../lib/db';
import { withRouteErrors } from '@/api/_kit';
import { z } from 'zod';

// ===== Validation Schemas =====
const createAccountSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  name: z.string().min(5).max(255),
  type: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
  normalBalance: z.enum(['D', 'C']),
  parentCode: z.string().optional(),
  requireCostCenter: z.boolean().default(false),
  requireProject: z.boolean().default(false),
  class: z.string().optional(),
});

const updateAccountSchema = createAccountSchema.partial();

// ===== Helper Functions =====
function mapAccountToResponse(account: any) {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    normalBalance: account.normalBalance,
    parentCode: account.parent_code,
    requireCostCenter: account.require_cost_center === 'true',
    requireProject: account.require_project === 'true',
    class: account.class,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  };
}

// ===== GET /api/accounts - List accounts with filters =====
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'gl:read');
  if (capCheck instanceof Response) return capCheck;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const parentCode = searchParams.get('parentCode');

    let whereConditions = [`company_id = $1`];
    let params = [auth.company_id];
    let paramCount = 1;

    if (query) {
      paramCount++;
      whereConditions.push(`name ILIKE $${paramCount}`);
      params.push(`%${query}%`);
    }

    if (type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      params.push(type);
    }

    if (parentCode) {
      paramCount++;
      whereConditions.push(`parent_code = $${paramCount}`);
      params.push(parentCode);
    }

    const result = await pool.query(
      `SELECT * FROM account 
       WHERE ${whereConditions.join(' AND ')} 
       ORDER BY code ASC`,
      params
    );

    const accounts = result.rows.map(mapAccountToResponse);

    return ok({
      accounts,
      total: accounts.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      return serverError(`Failed to fetch accounts: ${error.message}`);
    }
    return serverError('Failed to fetch accounts');
  }
});

// ===== POST /api/accounts - Create account =====
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'gl:write');
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = createAccountSchema.parse(await req.json());

    // Check for duplicate code
    const duplicateCheck = await pool.query(
      `SELECT id FROM account WHERE code = $1 AND company_id = $2 LIMIT 1`,
      [input.code, auth.company_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return badRequest('Account code already exists');
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

      // Validate account type compatibility
      if (parentCheck.rows[0].type !== input.type) {
        return badRequest('Account type must match parent account type');
      }
    }

    // Create account
    const result = await pool.query(
      `INSERT INTO account (
        company_id, code, name, type, normal_balance, parent_code, 
        require_cost_center, require_project, class, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        auth.company_id,
        input.code,
        input.name,
        input.type,
        input.normalBalance,
        input.parentCode || null,
        input.requireCostCenter.toString(),
        input.requireProject.toString(),
        input.class || null,
      ]
    );

    const newAccount = mapAccountToResponse(result.rows[0]);
    return created(newAccount, `/api/accounts/${newAccount.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', error.errors);
    }
    if (error instanceof Error) {
      return serverError(`Failed to create account: ${error.message}`);
    }
    return serverError('Failed to create account');
  }
});
