import { z } from "zod";
import { pool } from "../../../../../lib/db";
import { requireAuth, requireCapability } from "../../../../../lib/auth";
import { ok, badRequest, notFound } from "../../../../../lib/http";
import { withRouteErrors, isResponse } from "../../../../../lib/route-utils";

// Schema for toggling alert rules
const ToggleAlertSchema = z.object({
    isActive: z.boolean(),
});

export const POST = withRouteErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const { id: ruleId } = await params;
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "budgets:manage");
        if (isResponse(capCheck)) return capCheck;

        const body = await req.json();
        const { isActive } = ToggleAlertSchema.parse(body);

        // Check if rule exists
        const ruleResult = await pool.query(
            `SELECT * FROM budget_alert_rule WHERE id = $1 AND company_id = $2`,
            [ruleId, auth.company_id]
        );

        if (ruleResult.rows.length === 0) {
            return notFound("Budget alert rule not found");
        }

        // Update rule status
        await pool.query(
            `UPDATE budget_alert_rule 
       SET is_active = $1
       WHERE id = $2 AND company_id = $3`,
            [isActive, ruleId, auth.company_id]
        );

        return ok({
            message: `Alert rule ${isActive ? 'enabled' : 'disabled'} successfully`,
            ruleId,
            isActive,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return badRequest("Invalid request data", error.errors);
        }
        console.error("Error toggling budget alert rule:", error);
        return badRequest("Failed to toggle budget alert rule");
    }
});
