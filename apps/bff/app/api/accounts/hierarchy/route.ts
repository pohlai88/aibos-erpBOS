// M01: Core Ledger - Account Hierarchy API Route
// Handles account hierarchy tree operations with strict authentication

import { NextRequest } from 'next/server';
import { ok, serverError } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { pool } from '../../../lib/db';
import { withRouteErrors } from '@/api/_kit';

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

function buildHierarchyTree(accounts: any[]) {
  const accountMap = new Map();
  const rootNodes: any[] = [];

  // Create nodes
  accounts.forEach(account => {
    accountMap.set(account.code, {
      ...mapAccountToResponse(account),
      children: []
    });
  });

  // Build tree structure
  accounts.forEach(account => {
    const node = accountMap.get(account.code);
    
    if (account.parent_code) {
      const parent = accountMap.get(account.parent_code);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

// ===== GET /api/accounts/hierarchy - Get account hierarchy tree =====
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'gl:read');
  if (capCheck instanceof Response) return capCheck;

  try {
    // Get all accounts for the company
    const result = await pool.query(
      `SELECT * FROM account WHERE company_id = $1 ORDER BY code ASC`,
      [auth.company_id]
    );

    const accounts = result.rows;

    // Build hierarchy tree
    const hierarchy = buildHierarchyTree(accounts);
    const flatAccounts = accounts.map(mapAccountToResponse);

    return ok({
      accounts: flatAccounts,
      hierarchy: hierarchy,
      total: flatAccounts.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      return serverError(`Failed to fetch account hierarchy: ${error.message}`);
    }
    return serverError('Failed to fetch account hierarchy');
  }
});
