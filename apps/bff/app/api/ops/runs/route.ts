import { NextRequest, NextResponse } from "next/server";
import { ExecutionService } from "@/services";
import { RunRequestM27_2, ListRunsQueryM27_2 } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const executionService = new ExecutionService();
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
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

        return ok(result);
    } catch (error) {
        console.error("Error listing runs:", error);
        return ok({ error: "Failed to list runs" }, 500);
    } });
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const data = RunRequestM27_2.parse(body);

        // Plan the run
        const plan = await executionService.planRun(companyId, userId, data);

        // Request approval
        const result = await executionService.requestApproval(companyId, userId, plan);

        return ok(result);
    } catch (error) {
        console.error("Error queuing run:", error);
        return ok({ error: "Failed to queue run" }, 500);
    } });
