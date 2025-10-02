import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "../../../../lib/db";
import { requireScope, getCompanyFromKey } from "../../../../lib/auth";
import { ok, badRequest, forbidden, notFound } from "../../../../lib/http";

// Schema for toggling alert rules
const ToggleAlertSchema = z.object({
  isActive: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireScope(req, "budgets:manage");
    const ruleId = params.id;
    const body = await req.json();
    const { isActive } = ToggleAlertSchema.parse(body);

    // Check if rule exists
    const ruleResult = await pool.query(
      `SELECT * FROM budget_alert_rule WHERE id = $1 AND company_id = $2`,
      [ruleId, auth.company_id]
    );

    if (ruleResult.rows.length === 0) {
      return notFound({ message: "Budget alert rule not found" });
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
      return badRequest({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Error toggling budget alert rule:", error);
    return badRequest({ message: "Failed to toggle budget alert rule" });
  }
}
