import { NextRequest, NextResponse } from "next/server";
import { PlaybookService } from "@/services";

const playbookService = new PlaybookService();

/**
 * M27.2: Playbook Versions API Route
 * 
 * GET /api/ops/playbooks/[code]/versions - Get playbook versions
 */

export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const companyId = request.headers.get("x-company-id");

        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
        }

        const result = await playbookService.getPlaybookVersions(companyId, params.code);

        return NextResponse.json({ versions: result });
    } catch (error) {
        console.error("Error getting playbook versions:", error);
        return NextResponse.json(
            { error: "Failed to get playbook versions" },
            { status: 500 }
        );
    }
}
