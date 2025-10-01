import { pool } from "../../../lib/db";
import { requireAuth } from "../../../lib/auth";
import { ok } from "../../../lib/http";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  const mem = await pool.query(
    `select m.company_id, m.role, c.name
       from membership m join company c on c.id = m.company_id
      where m.user_id=$1`,
    [auth.user_id]
  );
  return ok({ user_id: auth.user_id, company_id: auth.company_id, role: auth.role, memberships: mem.rows });
}
