import { NextRequest } from 'next/server';
import { ok, forbidden } from '../../../../lib/http';
import { requireAuth, requireCapability } from '../../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../../lib/route-utils';
import { pool } from '../../../../lib/db';

export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'fx:read');
  if (isResponse(capCheck)) return capCheck;

  const url = new URL(req.url);
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');
  const limit = Number(url.searchParams.get('limit') ?? '50');

  let sql = `
    SELECT 
      r.id,
      r.year,
      r.month,
      r.mode,
      r.created_at,
      r.created_by,
      COUNT(l.id) as line_count,
      SUM(l.delta_base) as total_delta
    FROM fx_reval_run r
    LEFT JOIN fx_reval_line l ON r.id = l.run_id
    WHERE r.company_id = $1
  `;

  const params: any[] = [auth.company_id];
  let paramCount = 1;

  if (year) {
    paramCount++;
    sql += ` AND r.year = $${paramCount}`;
    params.push(Number(year));
  }

  if (month) {
    paramCount++;
    sql += ` AND r.month = $${paramCount}`;
    params.push(Number(month));
  }

  sql += `
    GROUP BY r.id, r.year, r.month, r.mode, r.created_at, r.created_by
    ORDER BY r.created_at DESC
    LIMIT $${paramCount + 1}
  `;

  params.push(limit);

  const { rows } = await pool.query(sql, params);

  return ok(
    rows.map(r => ({
      id: r.id,
      year: r.year,
      month: r.month,
      mode: r.mode,
      created_at: r.created_at,
      created_by: r.created_by,
      line_count: Number(r.line_count || 0),
      total_delta: Number(r.total_delta || 0),
    }))
  );
});
