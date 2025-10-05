import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { ApprovalRequestCreate, ApprovalDecision } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookStudio = new PlaybookStudioService();
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const data = ApprovalRequestCreate.parse(body);

        const result = await playbookStudio.createApprovalRequest(companyId, userId, data);

        return ok(result);
    } catch (error) {
        console.error("Error creating approval request:", error);
        return ok({ error: "Failed to create approval request" }, 500);
    } });
export const PUT = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const data = ApprovalDecision.parse(body);

        const result = await playbookStudio.processApprovalDecision(companyId, userId, data);

        return ok(result);
    } catch (error) {
        console.error("Error processing approval decision:", error);
        return ok({ error: "Failed to process approval decision" }, 500);
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        const fireId = searchParams.get("fire_id");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        const queryParams: { fire_id?: string; status?: string; limit: number; offset: number } = {
            limit,
            offset
        };

        if (fireId) {
            queryParams.fire_id = fireId;
        }

        if (status) {
            queryParams.status = status;
        }

        const result = await playbookStudio.getApprovalRequests(companyId, queryParams);

        return ok(result);
    } catch (error) {
        console.error("Error getting approval requests:", error);
        return ok({ error: "Failed to get approval requests" }, 500);
    } });
