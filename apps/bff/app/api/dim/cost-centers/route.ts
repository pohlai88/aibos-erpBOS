import { pool } from '../../../lib/db';
import { ok, created, unprocessable } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const url = new URL(req.url);
  const activeOnly = url.searchParams.get('active') === 'true';

  let sql = `select id, name, parent_id, active, created_at from dim_cost_center`;
  const params: any[] = [];

  if (activeOnly) {
    sql += ` where active = true`;
  }

  sql += ` order by name`;

  const { rows } = await pool.query(sql, params);
  return ok({ items: rows });
});

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'periods:manage');
  if (isResponse(capCheck)) return capCheck;

  const b = (await req.json()) as {
    items: Array<{
      id: string;
      name: string;
      parent_id?: string;
      active?: boolean;
    }>;
  };

  if (!b.items || !Array.isArray(b.items)) {
    return unprocessable('items array is required');
  }

  const results = [];
  for (const item of b.items) {
    if (!item.id || !item.name) {
      return unprocessable('id and name are required for each item');
    }

    // Validate parent_id exists if provided
    if (item.parent_id) {
      const parentCheck = await pool.query(
        `select id from dim_cost_center where id = $1`,
        [item.parent_id]
      );
      if (parentCheck.rows.length === 0) {
        return unprocessable(`Parent cost center ${item.parent_id} not found`);
      }
    }

    await pool.query(
      `insert into dim_cost_center(id, name, parent_id, active)
             values ($1, $2, $3, $4)
             on conflict (id) do update set 
               name = $2, 
               parent_id = $3, 
               active = $4`,
      [item.id, item.name, item.parent_id || null, item.active !== false]
    );

    results.push({ id: item.id });
  }

  return created({ items: results }, `/api/dim/cost-centers`);
});
