import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import {
    PlaybookVersionUpsert,
    RuleVersionUpsert,
    VisualEditorSave,
    VisualEditorLoad,
    CanaryExecutionRequest,
    ApprovalRequestCreate,
    ApprovalDecision,
    ActionVerificationRequest,
    ExecutionMetricsQuery,
    BlastRadiusQuery,
    VersionHistoryQuery
} from "@aibos/contracts";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Playbook Studio + Guarded Autonomy API Routes
 * 
 * Provides visual rule/playbook editing with versioning, dry-run sandboxes,
 * blast-radius caps, human-in-the-loop approvals, canary mode, and post-action
 * verification with rollback capabilities.
 */

// === PLAYBOOK VERSIONING ===

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = PlaybookVersionUpsert.parse(body);

        const version = await playbookStudio.createPlaybookVersion(companyId, userId, data);

        return NextResponse.json(version);
    } catch (error) {
        console.error("Error creating playbook version:", error);
        return NextResponse.json(
            { error: "Failed to create playbook version" },
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
        if (!playbookId) {
            return NextResponse.json({ error: "playbook_id is required" }, { status: 400 });
        }

        const query = VersionHistoryQuery.parse({
            playbook_id: playbookId,
            limit: parseInt(searchParams.get("limit") || "20"),
            offset: parseInt(searchParams.get("offset") || "0")
        });

        const versions = await playbookStudio.getPlaybookVersionHistory(companyId, playbookId, query);

        return NextResponse.json(versions);
    } catch (error) {
        console.error("Error getting playbook version history:", error);
        return NextResponse.json(
            { error: "Failed to get playbook version history" },
            { status: 500 }
        );
    }
}
