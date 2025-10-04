import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { CanaryExecutionRequest } from "@aibos/contracts";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Canary Mode API Routes
 * 
 * Execute playbooks on scoped subsets before global rollout
 */

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = CanaryExecutionRequest.parse(body);

        const result = await playbookStudio.executeCanary(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error executing canary:", error);
        return NextResponse.json(
            { error: "Failed to execute canary" },
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

        const canaryId = searchParams.get("canary_id");
        if (!canaryId) {
            return NextResponse.json({ error: "canary_id is required" }, { status: 400 });
        }

        const result = await playbookStudio.getCanaryStatus(companyId, canaryId);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error getting canary status:", error);
        return NextResponse.json(
            { error: "Failed to get canary status" },
            { status: 500 }
        );
    }
}
