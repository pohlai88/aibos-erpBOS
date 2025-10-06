// M01: Core Ledger - Reparent Validation API Route
// Validates account reparent operations with strict authentication

import { NextRequest } from 'next/server';
import { ok, badRequest, serverError } from '../../../../lib/http';
import { requireAuth, requireCapability } from '../../../../lib/auth';
import { pool } from '../../../../lib/db';
import { withRouteErrors } from '@/api/_kit';
import { z } from 'zod';

// ===== Validation Schemas =====
const reparentRequestSchema = z.object({
  accountId: z.string(),
  newParentCode: z.string().nullable(),
});

// ===== Helper Functions =====
async function wouldCreateCircularReference(
  accountCode: string,
  newParentCode: string,
  companyId: string
): Promise<boolean> {
  let currentCode = newParentCode;
  const visited = new Set<string>();

  while (currentCode) {
    if (visited.has(currentCode)) {
      return true; // Circular reference detected
    }

    if (currentCode === accountCode) {
      return true; // Would create circular reference
    }

    visited.add(currentCode);

    const result = await pool.query(
      `SELECT parent_code FROM account WHERE code = $1 AND company_id = $2 LIMIT 1`,
      [currentCode, companyId]
    );

    if (result.rows.length === 0) {
      break;
    }

    currentCode = result.rows[0].parent_code;
  }

  return false;
}

// ===== POST /api/accounts/reparent/validate - Validate reparent operation =====
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
      return ok({
        valid: false,
        message: 'Account not found'
      });
    }

    const accountToReparent = accountResult.rows[0];

    if (newParentCode) {
      // Get the new parent account
      const parentResult = await pool.query(
        `SELECT * FROM account WHERE code = $1 AND company_id = $2 LIMIT 1`,
        [newParentCode, auth.company_id]
      );

      if (parentResult.rows.length === 0) {
        return ok({
          valid: false,
          message: 'New parent account not found'
        });
      }

      const newParent = parentResult.rows[0];

      // Check for circular reference
      if (await wouldCreateCircularReference(accountToReparent.code, newParentCode, auth.company_id)) {
        return ok({
          valid: false,
          message: 'Would create circular reference'
        });
      }

      // Check account type compatibility
      if (accountToReparent.type !== newParent.type) {
        return ok({
          valid: false,
          message: 'Account types must match'
        });
      }

      // Check depth constraint (max 5 levels)
      let depth = 1;
      let currentParent = newParent;
      while (currentParent.parent_code) {
        depth++;
        if (depth > 5) {
          return ok({
            valid: false,
            message: 'Maximum hierarchy depth exceeded'
          });
        }

        const parentResult = await pool.query(
          `SELECT * FROM account WHERE code = $1 AND company_id = $2 LIMIT 1`,
          [currentParent.parent_code, auth.company_id]
        );

        if (parentResult.rows.length === 0) {
          break;
        }

        currentParent = parentResult.rows[0];
      }
    }

    return ok({
      valid: true,
      message: 'Reparent operation is valid'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', error.errors);
    }
    if (error instanceof Error) {
      return serverError(`Failed to validate reparent: ${error.message}`);
    }
    return serverError('Failed to validate reparent operation');
  }
});
