import { NextRequest, NextResponse } from "next/server";
import { RuleService } from "@/services";

const ruleService = new RuleService();

/**
 * M27.2: Rule Toggle API Route
 * 
 * POST /api/ops/rules/[code]/toggle - Enable/disable a rule
 */

export async function POST(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== "boolean") {
            return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
        }

        const result = await ruleService.toggleRule(companyId, params.code, enabled, userId);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error toggling rule:", error);
        return NextResponse.json(
            { error: "Failed to toggle rule" },
            { status: 500 }
        );
    }
}
