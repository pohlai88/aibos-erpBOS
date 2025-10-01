import { pool } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/auth";
import { ok } from "../../../../lib/http";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    const resolvedParams = await params;
    await pool.query(`update api_key set enabled='false' where id=$1 and user_id=$2 and company_id=$3`, [resolvedParams.id, auth.user_id, auth.company_id]);
    return ok({ ok: true });
}
