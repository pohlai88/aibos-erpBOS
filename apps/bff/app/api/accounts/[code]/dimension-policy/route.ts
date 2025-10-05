import { pool } from "../../../../lib/db";
import { ok, unprocessable, notFound } from "../../../../lib/http";
import { requireAuth, requireCapability } from "../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../lib/route-utils";

export const PATCH = withRouteErrors(async (req: Request, { params }: { params: Promise<{ code: string }> }) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "periods:manage");
    if (isResponse(capCheck)) return capCheck;

    const { code } = await params;
    const b = await req.json() as {
        require_cost_center: boolean;
        require_project: boolean;
    };

    if (typeof b.require_cost_center !== "boolean" || typeof b.require_project !== "boolean") {
        return unprocessable("require_cost_center and require_project must be boolean values");
    }

    // Check if account exists
    const accountCheck = await pool.query(
        `select id from account where code = $1 and company_id = $2`,
        [code, auth.company_id]
    );

    if (accountCheck.rows.length === 0) {
        return notFound(`Account ${code} not found`);
    }

    // Update dimension policy
    await pool.query(
        `update account 
         set require_cost_center = $1, require_project = $2
         where code = $3 and company_id = $4`,
        [b.require_cost_center, b.require_project, code, auth.company_id]
    );

    return ok({
        account_code: code,
        require_cost_center: b.require_cost_center,
        require_project: b.require_project
    });
});
