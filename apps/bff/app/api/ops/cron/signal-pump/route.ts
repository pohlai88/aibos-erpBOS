import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
    opsRule,
    opsPlaybook,
    opsPlaybookVersion,
    opsRun,
    opsSignal
} from "@aibos/db-adapter/schema";

/**
 * M27.2: Cron Signal Pump API Route
 * 
 * POST /api/ops/cron/signal-pump - Convert eligible alerts/signals into proposed runs
 * Runs every 5 minutes to process signals and create queued runs
 */

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        
        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
        }

        // Get enabled rules
        const rules = await db
            .select()
            .from(opsRule)
            .where(
                and(
                    eq(opsRule.company_id, companyId),
                    eq(opsRule.enabled, true)
                )
            );

        const processedRuns: any[] = [];

        for (const rule of rules) {
            // Get recent signals that match rule criteria
            const signals = await db
                .select()
                .from(opsSignal)
                .where(
                    and(
                        eq(opsSignal.company_id, companyId),
                        // Add rule-specific filtering based on where_jsonb
                        sql`ts >= NOW() - INTERVAL '3600 seconds'`
                    )
                )
                .orderBy(desc(opsSignal.ts))
                .limit(100);

            if (signals.length === 0) {
                continue;
            }

            // For now, skip rules without playbook association
            // In M27.2, rules and playbooks are separate entities
            // This would need to be implemented based on business logic
            continue;
        }

        return NextResponse.json({
            processed_runs: processedRuns.length,
            runs: processedRuns.map(run => ({
                id: run.id,
                rule_id: run.rule_id,
                trigger: run.trigger,
                status: run.status
            }))
        });

    } catch (error) {
        console.error("Error in signal pump:", error);
        return NextResponse.json(
            { error: "Failed to process signals" },
            { status: 500 }
        );
    }
}
