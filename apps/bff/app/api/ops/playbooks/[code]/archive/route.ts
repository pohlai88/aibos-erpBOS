import { NextRequest, NextResponse } from "next/server";
import { PlaybookService } from "@/services";

const playbookService = new PlaybookService();

/**
 * M27.2: Playbook Archive API Route
 * 
 * POST /api/ops/playbooks/[code]/archive - Archive a playbook
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

        const result = await playbookService.archivePlaybook(companyId, params.code, userId);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error archiving playbook:", error);
        return NextResponse.json(
            { error: "Failed to archive playbook" },
            { status: 500 }
        );
    }
}
