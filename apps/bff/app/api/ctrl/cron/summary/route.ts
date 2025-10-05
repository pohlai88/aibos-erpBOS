import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:report");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const body = await request.json();
    const { trigger, period } = body;

    try {
        const periodCondition = period === "week"
            ? "created_at >= NOW() - INTERVAL '7 days'"
            : "created_at >= NOW() - INTERVAL '30 days'";

        const summary = await db.execute(sql`
            SELECT 
                COUNT(*) as total_runs,
                COUNT(CASE WHEN status = 'PASS' THEN 1 END) as passed_runs,
                COUNT(CASE WHEN status = 'FAIL' THEN 1 END) as failed_runs,
                COUNT(CASE WHEN status = 'WAIVED' THEN 1 END) as waived_runs,
                AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_execution_time_seconds
            FROM ctrl_run cr
            JOIN ctrl_assignment ca ON cr.assignment_id = ca.id
            WHERE ca.company_id = ${authCtx.company_id}
            AND cr.${sql.raw(periodCondition)}
        `);

        const exceptions = await db.execute(sql`
            SELECT 
                COUNT(*) as total_exceptions,
                COUNT(CASE WHEN remediation_state = 'OPEN' THEN 1 END) as open_exceptions,
                COUNT(CASE WHEN remediation_state = 'IN_PROGRESS' THEN 1 END) as in_progress_exceptions,
                COUNT(CASE WHEN remediation_state = 'RESOLVED' THEN 1 END) as resolved_exceptions,
                COUNT(CASE WHEN material = true THEN 1 END) as material_exceptions
            FROM ctrl_exception ce
            JOIN ctrl_run cr ON ce.ctrl_run_id = cr.id
            JOIN ctrl_assignment ca ON cr.assignment_id = ca.id
            WHERE ca.company_id = ${authCtx.company_id}
            AND ce.${sql.raw(periodCondition)}
        `);

        const result = {
            period,
            summary: summary.rows[0],
            exceptions: exceptions.rows[0],
            generated_at: new Date().toISOString()
        };

        return ok({
                    success: true,
                    trigger,
                    result,
                    timestamp: new Date().toISOString()
                });
    } catch (error) {
        console.error(`Summary report failed for ${trigger}:`, error);
        return ok({
                        success: false,
                        trigger,
                        error: error instanceof Error ? error.message : "Unknown error",
                        timestamp: new Date().toISOString()
                    }, 500);
    }
});
