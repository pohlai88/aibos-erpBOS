import { NextRequest, NextResponse } from "next/server";
import { ExecutionService } from "@/services";
import { db } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { opsRun } from "@aibos/db-adapter/schema";
import { withRouteErrors, ok } from "@/api/_kit";

const executionService = new ExecutionService();
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        
        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        // Get approved runs that are ready to execute
        const approvedRuns = await db
            .select()
            .from(opsRun)
            .where(
                and(
                    eq(opsRun.company_id, companyId),
                    eq(opsRun.status, 'approved'),
                    // Check cooldown period
                    sql`created_at <= NOW() - INTERVAL '5 minutes'`
                )
            )
            .orderBy(sql`created_at ASC`)
            .limit(10); // Process up to 10 runs at a time

        const executedRuns = [];

        for (const run of approvedRuns) {
            try {
                // Execute the run
                const result = await executionService.executeRun(companyId, run.id);
                executedRuns.push({
                    id: run.id,
                    status: result.status,
                    started_at: result.started_at,
                    ended_at: result.ended_at
                });
            } catch (error) {
                console.error(`Error executing run ${run.id}:`, error);
                executedRuns.push({
                    id: run.id,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return ok({
                    executed_runs: executedRuns.length,
                    runs: executedRuns
                });

    } catch (error) {
        console.error("Error in execute approved:", error);
        return ok({ error: "Failed to execute approved runs" }, 500);
    } });
