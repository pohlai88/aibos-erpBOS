import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { pool } from "../../../lib/db";

function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const GET = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;
        await requireCapability(auth, "cash:manage");

        const result = await pool.query(
            `SELECT id, name, type, threshold_num, filter_cc, filter_project, delivery, is_active, created_at, created_by
       FROM cash_alert_rule 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
            [auth.company_id]
        );
        return ok(result.rows);
    } catch (error) {
        console.error("Error listing cash alert rules:", error);
        return badRequest("Failed to list cash alert rules");
    }
});

export const POST = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;
        await requireCapability(auth, "cash:manage");

        const body = await req.json().catch(() => null);
        if (!body?.name || !body?.type || !body?.threshold_num || !body?.delivery) {
            return badRequest("Missing required fields (name, type, threshold_num, delivery)");
        }

        const id = generateId();
        await pool.query(
            `INSERT INTO cash_alert_rule (id, company_id, name, type, threshold_num, filter_cc, filter_project, delivery, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                id,
                auth.company_id,
                body.name,
                body.type,
                body.threshold_num,
                body.filter_cc ?? null,
                body.filter_project ?? null,
                JSON.stringify(body.delivery),
                true,
                auth.user_id
            ]
        );
        return ok({ id });
    } catch (error) {
        console.error("Error creating cash alert rule:", error);
        return badRequest("Failed to create cash alert rule");
    }
});
