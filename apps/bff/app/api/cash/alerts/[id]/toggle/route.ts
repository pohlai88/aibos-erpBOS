import { ok, forbidden } from "../../../../../lib/http";
import { requireAuth, requireCapability } from "../../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../../lib/route-utils";
import { pool } from "../../../../../lib/db";

export const POST = withRouteErrors(async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;
        await requireCapability(auth, "cash:manage");

        const resolvedParams = await params;
        const body = await req.json().catch(() => ({}));
        const enabled = !!body.enabled;

        await pool.query(
            `UPDATE cash_alert_rule 
       SET is_active = $1 
       WHERE company_id = $2 AND id = $3`,
            [enabled, auth.company_id, resolvedParams.id]
        );
        return ok({ id: resolvedParams.id, enabled });
    } catch (error) {
        console.error("Error toggling cash alert rule:", error);
        return forbidden("Failed to toggle cash alert rule");
    }
});
