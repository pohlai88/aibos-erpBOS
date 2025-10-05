import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { VisualEditorSave, VisualEditorLoad } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookStudio = new PlaybookStudioService();
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const data = VisualEditorSave.parse(body);

        const result = await playbookStudio.saveFromVisualEditor(companyId, userId, data);

        return ok(result);
    } catch (error) {
        console.error("Error saving from visual editor:", error);
        return ok({ error: "Failed to save from visual editor" }, 500);
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        const playbookId = searchParams.get("playbook_id");
        const ruleId = searchParams.get("rule_id");
        const versionNo = searchParams.get("version_no");

        if (!playbookId && !ruleId) {
            return ok({ error: "Either playbook_id or rule_id is required" }, 400);
        }

        const query = VisualEditorLoad.parse({
            playbook_id: playbookId || undefined,
            rule_id: ruleId || undefined,
            version_no: versionNo ? parseInt(versionNo) : undefined
        });

        const definition = await playbookStudio.loadForVisualEditor(companyId, query);

        return ok(definition);
    } catch (error) {
        console.error("Error loading for visual editor:", error);
        return ok({ error: "Failed to load for visual editor" }, 500);
    } });
