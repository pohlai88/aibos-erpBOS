import { pool } from '../../../lib/db';
import { ok, created, unprocessable } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const url = new URL(req.url);
  const activeOnly = url.searchParams.get('active') === 'true';

  let sql = `select id, name, active, created_at from dim_project`;
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

    await pool.query(
      `insert into dim_project(id, name, active)
             values ($1, $2, $3)
             on conflict (id) do update set 
               name = $2, 
               active = $3`,
      [item.id, item.name, item.active !== false]
    );

    results.push({ id: item.id });
  }

  return created({ items: results }, `/api/dim/projects`);
});
