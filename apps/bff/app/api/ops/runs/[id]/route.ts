import { NextRequest, NextResponse } from "next/server";
import { ExecutionService } from "@/services";
import { withRouteErrors, ok } from "@/api/_kit";

const executionService = new ExecutionService();
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const companyId = request.headers.get("x-company-id");

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        // Get run details with steps
        const result = await executionService.listRuns(companyId, {
            limit: 1,
            offset: 0
        });

        const run = result.runs.find(r => r.id === params.id);
        if (!run) {
            return ok({ error: "Run not found" }, 404);
        }

        return ok(run);
    } catch (error) {
        console.error("Error getting run details:", error);
        return ok({ error: "Failed to get run details" }, 500);
    } });
