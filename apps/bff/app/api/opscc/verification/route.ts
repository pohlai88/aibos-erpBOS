import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { ActionVerificationRequest } from "@aibos/contracts";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Action Verification API Routes
 * 
 * Post-action verification and rollback hooks for safety
 */

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = ActionVerificationRequest.parse(body);

        const result = await playbookStudio.verifyActionOutcome(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error verifying action outcome:", error);
        return NextResponse.json(
            { error: "Failed to verify action outcome" },
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
        const stepId = searchParams.get("step_id");
        const limit = parseInt(searchParams.get("limit") || "100");
        const offset = parseInt(searchParams.get("offset") || "0");

        const queryParams: { fire_id?: string; step_id?: string; limit: number; offset: number } = {
            limit,
            offset
        };

        if (fireId) {
            queryParams.fire_id = fireId;
        }

        if (stepId) {
            queryParams.step_id = stepId;
        }

        const result = await playbookStudio.getActionVerifications(companyId, queryParams);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error getting action verifications:", error);
        return NextResponse.json(
            { error: "Failed to get action verifications" },
            { status: 500 }
        );
    }
}
