import { NextRequest, NextResponse } from "next/server";
import { PlaybookService } from "@/services";

const playbookService = new PlaybookService();

/**
 * M27.2: Playbook Publish API Route
 * 
 * POST /api/ops/playbooks/[code]/publish - Publish a new version of a playbook
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
        const { spec, changeSummary } = body;

        if (!spec) {
            return NextResponse.json({ error: "spec is required" }, { status: 400 });
        }

        // Validate playbook spec
        const validation = await playbookService.validateSpec(spec);
        if (!validation.valid) {
            return NextResponse.json(
                { error: "Invalid playbook spec", details: validation.errors },
                { status: 422 }
            );
        }

        const result = await playbookService.publishPlaybookVersion(
            companyId,
            params.code,
            spec,
            userId,
            changeSummary
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error publishing playbook:", error);
        return NextResponse.json(
            { error: "Failed to publish playbook" },
            { status: 500 }
        );
    }
}
