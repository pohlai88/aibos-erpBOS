import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { RuleVersionUpsert, VersionHistoryQuery } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookStudio = new PlaybookStudioService();
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");
        
        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }
        
        const body = await request.json();
        const data = RuleVersionUpsert.parse(body);
        
        const version = await playbookStudio.createRuleVersion(companyId, userId, data);
        
        return ok(version);
    } catch (error) {
        console.error("Error creating rule version:", error);
        return ok({ error: "Failed to create rule version" }, 500);
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);
        
        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }
        
        const ruleId = searchParams.get("rule_id");
        if (!ruleId) {
            return ok({ error: "rule_id is required" }, 400);
        }
        
        const query = VersionHistoryQuery.parse({
            rule_id: ruleId,
            limit: parseInt(searchParams.get("limit") || "20"),
            offset: parseInt(searchParams.get("offset") || "0")
        });
        
        const versions = await playbookStudio.getRuleVersionHistory(companyId, ruleId, query);
        
        return ok(versions);
    } catch (error) {
        console.error("Error getting rule version history:", error);
        return ok({ error: "Failed to get rule version history" }, 500);
    } });
