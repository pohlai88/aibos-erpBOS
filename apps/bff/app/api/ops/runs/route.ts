import { NextRequest, NextResponse } from "next/server";
import { ExecutionService } from "@/services";
import { RunRequestM27_2, ListRunsQueryM27_2 } from "@aibos/contracts";

const executionService = new ExecutionService();

/**
 * M27.2: Runs API Routes
 * 
 * GET /api/ops/runs - List runs with filtering
 * POST /api/ops/runs - Queue a run / dry-run
 */

export async function GET(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
        }

        const query: ListRunsQueryM27_2 = {
            status: searchParams.get("status") as any,
            code: searchParams.get("code") || undefined,
            since: searchParams.get("since") || undefined,
            until: searchParams.get("until") || undefined,
            limit: parseInt(searchParams.get("limit") || "50"),
            offset: parseInt(searchParams.get("offset") || "0")
        };

        const result = await executionService.listRuns(companyId, query);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error listing runs:", error);
        return NextResponse.json(
            { error: "Failed to list runs" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = RunRequestM27_2.parse(body);

        // Plan the run
        const plan = await executionService.planRun(companyId, userId, data);

        // Request approval
        const result = await executionService.requestApproval(companyId, userId, plan);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error queuing run:", error);
        return NextResponse.json(
            { error: "Failed to queue run" },
            { status: 500 }
        );
    }
}
