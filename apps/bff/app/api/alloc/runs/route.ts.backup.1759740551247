import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { pool } from '@/lib/db';

// GET /api/alloc/runs - Get allocation run history
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'alloc:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');
  const mode = url.searchParams.get('mode');

  let query = `
    SELECT 
      ar.id,
      ar.company_id,
      ar.year,
      ar.month,
      ar.mode,
      ar.created_at,
      ar.created_by,
      COUNT(al.id) as line_count,
      SUM(al.amount_base) as total_amount
    FROM alloc_run ar
    LEFT JOIN alloc_line al ON ar.id = al.run_id
    WHERE ar.company_id = $1
  `;

  const params: any[] = [auth.company_id];
  let paramIndex = 2;

  if (year) {
    query += ` AND ar.year = $${paramIndex}`;
    params.push(parseInt(year));
    paramIndex++;
  }

  if (month) {
    query += ` AND ar.month = $${paramIndex}`;
    params.push(parseInt(month));
    paramIndex++;
  }

  if (mode) {
    query += ` AND ar.mode = $${paramIndex}`;
    params.push(mode);
    paramIndex++;
  }

  query += ` GROUP BY ar.id, ar.company_id, ar.year, ar.month, ar.mode, ar.created_at, ar.created_by ORDER BY ar.created_at DESC LIMIT 50`;

  const { rows } = await pool.query(query, params);

  const runs = rows.map(row => ({
    id: row.id,
    company_id: row.company_id,
    year: row.year,
    month: row.month,
    mode: row.mode,
    created_at: row.created_at,
    created_by: row.created_by,
    line_count: parseInt(row.line_count),
    total_amount: row.total_amount ? Number(row.total_amount) : 0,
  }));

  return ok(runs);
});

// OPTIONS - CORS support
export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
