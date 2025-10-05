import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ok } from "@/api/_kit";

// GET /api/ops/healthz - OpsCC health and metrics
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:observability:read");

    const authCtx = auth as AuthCtx;

    try {
        // Get rule health metrics
        const ruleHealth = await db.execute(sql`
            SELECT 
                COUNT(*) as total_rules,
                COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_rules,
                COUNT(CASE WHEN enabled = false THEN 1 END) as disabled_rules,
                COUNT(CASE WHEN rs.last_fired_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recently_fired,
                COUNT(CASE WHEN rs.last_error_at > NOW() - INTERVAL '1 hour' THEN 1 END) as error_rules
            FROM ops_rule r
            LEFT JOIN ops_rule_stat rs ON r.id = rs.rule_id
            WHERE r.company_id = ${authCtx.company_id}
        `);

        // Get signal metrics
        const signalMetrics = await db.execute(sql`
            SELECT 
                COUNT(*) as total_signals,
                COUNT(CASE WHEN ts > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_signals,
                COUNT(CASE WHEN ts > NOW() - INTERVAL '24 hours' THEN 1 END) as daily_signals,
                COUNT(DISTINCT source) as active_sources,
                COUNT(DISTINCT kind) as active_kinds
            FROM ops_signal
            WHERE company_id = ${authCtx.company_id}
        `);

        // Get fire metrics
        const fireMetrics = await db.execute(sql`
            SELECT 
                COUNT(*) as total_fires,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_fires,
                COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_fires,
                COUNT(CASE WHEN status = 'EXECUTING' THEN 1 END) as executing_fires,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_fires,
                COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_fires,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_fires
            FROM ops_fire
            WHERE company_id = ${authCtx.company_id}
        `);

        // Get action SLO metrics
        const actionSLO = await db.execute(sql`
            SELECT 
                action_code,
                COUNT(*) as total_executions,
                COUNT(CASE WHEN status = 'OK' THEN 1 END) as successful_executions,
                AVG(duration_ms) as avg_duration_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms
            FROM ops_fire_step
            WHERE executed_at > NOW() - INTERVAL '7 days'
            GROUP BY action_code
            ORDER BY total_executions DESC
            LIMIT 10
        `);

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            company_id: authCtx.company_id,
            metrics: {
                rules: ruleHealth.rows[0] || {},
                signals: signalMetrics.rows[0] || {},
                fires: fireMetrics.rows[0] || {},
                action_slo: actionSLO.rows || []
            }
        };

        return ok(health);
    } catch (error) {
        return ok({
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    company_id: authCtx.company_id,
                    error: error instanceof Error ? error.message : String(error)
                }, 500);
    }
});
