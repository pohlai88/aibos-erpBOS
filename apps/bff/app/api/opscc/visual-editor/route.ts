import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { VisualEditorSave, VisualEditorLoad } from "@aibos/contracts";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Visual Editor API Routes
 * 
 * Provides visual rule/playbook editing capabilities with auto-versioning
 */

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = VisualEditorSave.parse(body);

        const result = await playbookStudio.saveFromVisualEditor(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error saving from visual editor:", error);
        return NextResponse.json(
            { error: "Failed to save from visual editor" },
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

        const playbookId = searchParams.get("playbook_id");
        const ruleId = searchParams.get("rule_id");
        const versionNo = searchParams.get("version_no");

        if (!playbookId && !ruleId) {
            return NextResponse.json({ error: "Either playbook_id or rule_id is required" }, { status: 400 });
        }

        const query = VisualEditorLoad.parse({
            playbook_id: playbookId || undefined,
            rule_id: ruleId || undefined,
            version_no: versionNo ? parseInt(versionNo) : undefined
        });

        const definition = await playbookStudio.loadForVisualEditor(companyId, query);

        return NextResponse.json(definition);
    } catch (error) {
        console.error("Error loading for visual editor:", error);
        return NextResponse.json(
            { error: "Failed to load for visual editor" },
            { status: 500 }
        );
    }
}
