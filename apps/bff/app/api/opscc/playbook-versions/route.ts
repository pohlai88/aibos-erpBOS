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
import { withRouteErrors, ok } from "@/api/_kit";

const playbookStudio = new PlaybookStudioService();
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const data = PlaybookVersionUpsert.parse(body);

        const version = await playbookStudio.createPlaybookVersion(companyId, userId, data);

        return ok(version);
    } catch (error) {
        console.error("Error creating playbook version:", error);
        return ok({ error: "Failed to create playbook version" }, 500);
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        const playbookId = searchParams.get("playbook_id");
        if (!playbookId) {
            return ok({ error: "playbook_id is required" }, 400);
        }

        const query = VersionHistoryQuery.parse({
            playbook_id: playbookId,
            limit: parseInt(searchParams.get("limit") || "20"),
            offset: parseInt(searchParams.get("offset") || "0")
        });

        const versions = await playbookStudio.getPlaybookVersionHistory(companyId, playbookId, query);

        return ok(versions);
    } catch (error) {
        console.error("Error getting playbook version history:", error);
        return ok({ error: "Failed to get playbook version history" }, 500);
    } });
