// M15: Cash Forecast Version Management
// apps/bff/app/api/cash/versions/route.ts

import { ok, badRequest, forbidden } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import { z } from 'zod';
import { pool } from '../../../lib/db';

// Define schema locally to avoid import issues
const CashVersionCreate = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  year: z.number().int().min(1900),
  profile_name: z.string().optional(),
});

// Simple ULID generator
function generateId(): string {
  return `cfv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const POST = withRouteErrors(async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, 'cash:manage');
    if (isResponse(capCheck)) return capCheck;

    const body = await req.json();
    const payload = CashVersionCreate.parse(body);

    let profileId: string | null = null;
    if (payload.profile_name) {
      const profileResult = await pool.query(
        `SELECT id FROM wc_profile WHERE company_id = $1 AND name = $2`,
        [auth.company_id, payload.profile_name]
      );
      if (profileResult.rows.length === 0) {
        return badRequest(
          `Unknown working capital profile: ${payload.profile_name}`
        );
      }
      profileId = profileResult.rows[0].id;
    }

    const id = generateId();
    await pool.query(
      `INSERT INTO cash_forecast_version (id, company_id, code, label, year, status, profile_id, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        auth.company_id,
        payload.code,
        payload.label,
        payload.year,
        'draft',
        profileId,
        auth.user_id || 'unknown',
        auth.user_id || 'unknown',
      ]
    );

    return ok({ id });
  } catch (error) {
    console.error('Error creating cash version:', error);
    return badRequest('Failed to create cash forecast version');
  }
});

export const GET = withRouteErrors(async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, 'cash:manage');
    if (isResponse(capCheck)) return capCheck;

    const result = await pool.query(
      `SELECT id, code, label, year, status, profile_id, created_at, updated_at
       FROM cash_forecast_version WHERE company_id = $1 ORDER BY created_at DESC`,
      [auth.company_id]
    );

    return ok({
      versions: result.rows.map(row => ({
        id: row.id,
        code: row.code,
        label: row.label,
        year: row.year,
        status: row.status,
        profile_id: row.profile_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error listing cash versions:', error);
    return badRequest('Failed to list cash forecast versions');
  }
});
