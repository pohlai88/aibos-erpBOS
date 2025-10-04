import { NextRequest, NextResponse } from "next/server";
import { GuardrailService } from "@/services";
import { GuardPolicyUpsert } from "@aibos/contracts";

const guardrailService = new GuardrailService();

/**
 * M27.2: Guardrails API Routes
 * 
 * GET /api/ops/guards - Get guard policies (global & per-playbook scope)
 * PUT /api/ops/guards - Create or update guard policy
 */

export async function GET(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
        }

        const playbookCode = searchParams.get("playbook_code");
        const specGuards = searchParams.get("spec_guards") ? JSON.parse(searchParams.get("spec_guards")!) : undefined;

        const result = await guardrailService.getEffectiveGuards(companyId, playbookCode || undefined, specGuards);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error getting guard policies:", error);
        return NextResponse.json(
            { error: "Failed to get guard policies" },
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
        const data = GuardPolicyUpsert.parse(body);

        const result = await guardrailService.upsertGuardPolicy(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error upserting guard policy:", error);
        return NextResponse.json(
            { error: "Failed to upsert guard policy" },
            { status: 500 }
        );
    }
}
