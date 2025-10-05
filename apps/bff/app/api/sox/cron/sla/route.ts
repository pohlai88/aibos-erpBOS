import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { pool } from "@/lib/db";
import { logLine } from "@/lib/log";
import { ok } from "@/api/_kit";

// POST /api/sox/cron/sla - Monitor deficiency SLA
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "sox:admin");

    const authCtx = auth as AuthCtx;
    const client = await pool.connect();

    try {
        // Find deficiencies that are overdue for remediation
        const overdueResult = await client.query(`
            SELECT id, description, severity, remediation_due, rem_owner_id, created_at
            FROM sox_deficiency 
            WHERE company_id = $1 
            AND status IN ('OPEN', 'IN_PROGRESS')
            AND remediation_due < CURRENT_DATE
            ORDER BY remediation_due ASC
        `, [authCtx.company_id]);

        // Find deficiencies approaching due date (within 7 days)
        const approachingResult = await client.query(`
            SELECT id, description, severity, remediation_due, rem_owner_id, created_at
            FROM sox_deficiency 
            WHERE company_id = $1 
            AND status IN ('OPEN', 'IN_PROGRESS')
            AND remediation_due BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
            ORDER BY remediation_due ASC
        `, [authCtx.company_id]);

        // Find deficiencies that have been open for too long (30+ days)
        const agingResult = await client.query(`
            SELECT id, description, severity, status, created_at,
                   EXTRACT(DAYS FROM (CURRENT_DATE - created_at::DATE)) as age_days
            FROM sox_deficiency 
            WHERE company_id = $1 
            AND status IN ('OPEN', 'IN_PROGRESS')
            AND created_at < CURRENT_DATE - INTERVAL '30 days'
            ORDER BY created_at ASC
        `, [authCtx.company_id]);

        const result = {
            overdue_deficiencies: overdueResult.rows.length,
            approaching_due: approachingResult.rows.length,
            aging_deficiencies: agingResult.rows.length,
            overdue_details: overdueResult.rows,
            approaching_details: approachingResult.rows,
            aging_details: agingResult.rows
        };

        logLine({ level: "info", msg: `SOX SLA check completed for company ${authCtx.company_id}: ${result.overdue_deficiencies} overdue, ${result.approaching_due} approaching, ${result.aging_deficiencies} aging` });

        return ok({ result });
    } catch (error) {
        logLine({ level: "error", msg: `SOX SLA monitoring failed: ${error}` });
        throw error;
    } finally {
        client.release();
    }
});
