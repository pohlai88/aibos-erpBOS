import { pool } from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';
import { ok } from '../../../lib/http';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

export const GET = withRouteErrors(async (req: Request) => {
  const authResult = await requireAuth(req);
  if (isResponse(authResult)) return authResult;

  const mem = await pool.query(
    `select m.company_id, m.role, c.name
       from membership m join company c on c.id = m.company_id
      where m.user_id=$1`,
    [authResult.user_id]
  );
  return ok({
    user_id: authResult.user_id,
    company_id: authResult.company_id,
    role: authResult.role,
    scopes: authResult.scopes,
    memberships: mem.rows,
  });
});
