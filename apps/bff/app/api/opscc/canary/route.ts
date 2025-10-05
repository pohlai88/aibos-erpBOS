import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { CanaryExecutionRequest } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookStudio = new PlaybookStudioService();
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const data = CanaryExecutionRequest.parse(body);

        const result = await playbookStudio.executeCanary(companyId, userId, data);

        return ok(result);
    } catch (error) {
        console.error("Error executing canary:", error);
        return ok({ error: "Failed to execute canary" }, 500);
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        const canaryId = searchParams.get("canary_id");
        if (!canaryId) {
            return ok({ error: "canary_id is required" }, 400);
        }

        const result = await playbookStudio.getCanaryStatus(companyId, canaryId);

        return ok(result);
    } catch (error) {
        console.error("Error getting canary status:", error);
        return ok({ error: "Failed to get canary status" }, 500);
    } });
