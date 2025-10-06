import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { pool } from '@/lib/db';
import { ConsolAccountMapUpsert } from '@aibos/contracts';

// GET /api/consol/account-map - List account mappings
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:read');
  if (forbiddenCheck) return forbiddenCheck;

  const { rows } = await pool.query(
    `
        SELECT purpose, account
        FROM consol_account_map 
        WHERE company_id = $1
        ORDER BY purpose
    `,
    [auth.company_id]
  );

  return ok(rows);
});

// POST /api/consol/account-map - Create or update account mapping
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'consol:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = ConsolAccountMapUpsert.parse(json);

  await pool.query(
    `
        INSERT INTO consol_account_map (company_id, purpose, account)
        VALUES ($1, $2, $3)
        ON CONFLICT (company_id, purpose) 
        DO UPDATE SET account = $3
    `,
    [auth.company_id, input.purpose, input.account]
  );

  return ok({ purpose: input.purpose, account: input.account });
});

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
