import { NextRequest, NextResponse } from "next/server";
import { ExecutionService } from "@/services";

const executionService = new ExecutionService();

/**
 * M27.2: Run Detail API Route
 * 
 * GET /api/ops/runs/[id] - Get run details
 */

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const companyId = request.headers.get("x-company-id");

        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
        }

        // Get run details with steps
        const result = await executionService.listRuns(companyId, {
            limit: 1,
            offset: 0
        });

        const run = result.runs.find(r => r.id === params.id);
        if (!run) {
            return NextResponse.json({ error: "Run not found" }, { status: 404 });
        }

        return NextResponse.json(run);
    } catch (error) {
        console.error("Error getting run details:", error);
        return NextResponse.json(
            { error: "Failed to get run details" },
            { status: 500 }
        );
    }
}
