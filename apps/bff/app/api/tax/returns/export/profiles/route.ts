import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  TaxExportProfileUpsert,
  TaxExportProfileUpsertType,
} from '@aibos/contracts';
import { pool } from '@/lib/db';

// GET /api/tax/returns/export/profiles - List export profiles
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const partnerCode = url.searchParams.get('partner_code');
  const version = url.searchParams.get('version');

  let query = `SELECT partner_code, version, format, is_default, updated_at, updated_by 
                 FROM tax_export_profile 
                 WHERE company_id = $1`;
  const params = [auth.company_id];

  if (partnerCode) {
    query += ` AND partner_code = $${params.length + 1}`;
    params.push(partnerCode);
  }

  if (version) {
    query += ` AND version = $${params.length + 1}`;
    params.push(version);
  }

  query += ` ORDER BY partner_code, version, format`;

  const { rows } = await pool.query(query, params);
  return ok(rows);
});

// POST /api/tax/returns/export/profiles - Upsert export profile
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'tax:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = TaxExportProfileUpsert.parse(json);

  // If setting as default, unset other defaults for this partner/version
  if (input.is_default) {
    await pool.query(
      `UPDATE tax_export_profile 
             SET is_default = false 
             WHERE company_id = $1 AND partner_code = $2 AND version = $3`,
      [auth.company_id, input.partner_code, input.version]
    );
  }

  // Upsert the profile
  await pool.query(
    `INSERT INTO tax_export_profile (company_id, partner_code, version, format, is_default, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (company_id, partner_code, version, format)
         DO UPDATE SET is_default = $5, updated_at = now(), updated_by = $6`,
    [
      auth.company_id,
      input.partner_code,
      input.version,
      input.format,
      input.is_default,
      auth.user_id,
    ]
  );

  return ok({ success: true });
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
