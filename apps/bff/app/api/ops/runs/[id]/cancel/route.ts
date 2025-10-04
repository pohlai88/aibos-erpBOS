import { NextRequest, NextResponse } from "next/server";
import { ExecutionService } from "@/services";
import { CancelRunM27_2 } from "@aibos/contracts";

const executionService = new ExecutionService();

/**
 * M27.2: Run Cancel API Route
 * 
 * POST /api/ops/runs/[id]/cancel - Cancel a run
 */

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = CancelRunM27_2.parse({
            run_id: params.id,
            reason: body.reason
        });

        const result = await executionService.cancelRun(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error cancelling run:", error);
        return NextResponse.json(
            { error: "Failed to cancel run" },
            { status: 500 }
        );
    }
}
