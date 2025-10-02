import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "../../../../lib/db";
import { requireScope, getCompanyFromKey } from "../../../../lib/auth";
import { ok, badRequest, forbidden } from "../../../../lib/http";
import { evaluateAlerts } from "../../../../services/budgets/alerts";

// Schema for running alerts
const RunAlertsSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireScope(req, "budgets:manage");
    const body = await req.json();
    const { year, month } = RunAlertsSchema.parse(body);

    // Run alert evaluation
    const breaches = await evaluateAlerts(auth.company_id, { year, month });

    return ok({
      message: "Alert evaluation completed",
      period: { year, month },
      breaches: breaches,
      summary: {
        totalBreaches: breaches.length,
        uniqueRules: new Set(breaches.map(b => b.ruleId)).size,
        uniqueAccounts: new Set(breaches.map(b => b.account)).size,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Error running budget alerts:", error);
    return badRequest({ message: "Failed to run budget alerts" });
  }
}
