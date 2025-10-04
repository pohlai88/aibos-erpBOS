import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { ApprovalRequestCreate, ApprovalDecision } from "@aibos/contracts";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Approval Workflow API Routes
 * 
 * Human-in-the-loop approval workflow with premortem diffs and impact estimates
 */

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = ApprovalRequestCreate.parse(body);

        const result = await playbookStudio.createApprovalRequest(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error creating approval request:", error);
        return NextResponse.json(
            { error: "Failed to create approval request" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = ApprovalDecision.parse(body);

        const result = await playbookStudio.processApprovalDecision(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error processing approval decision:", error);
        return NextResponse.json(
            { error: "Failed to process approval decision" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
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

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error getting approval requests:", error);
        return NextResponse.json(
            { error: "Failed to get approval requests" },
            { status: 500 }
        );
    }
}
