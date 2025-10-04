import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { RuleVersionUpsert, VersionHistoryQuery } from "@aibos/contracts";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Rule Versioning API Routes
 */

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");
        
        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }
        
        const body = await request.json();
        const data = RuleVersionUpsert.parse(body);
        
        const version = await playbookStudio.createRuleVersion(companyId, userId, data);
        
        return NextResponse.json(version);
    } catch (error) {
        console.error("Error creating rule version:", error);
        return NextResponse.json(
            { error: "Failed to create rule version" },
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
        
        const ruleId = searchParams.get("rule_id");
        if (!ruleId) {
            return NextResponse.json({ error: "rule_id is required" }, { status: 400 });
        }
        
        const query = VersionHistoryQuery.parse({
            rule_id: ruleId,
            limit: parseInt(searchParams.get("limit") || "20"),
            offset: parseInt(searchParams.get("offset") || "0")
        });
        
        const versions = await playbookStudio.getRuleVersionHistory(companyId, ruleId, query);
        
        return NextResponse.json(versions);
    } catch (error) {
        console.error("Error getting rule version history:", error);
        return NextResponse.json(
            { error: "Failed to get rule version history" },
            { status: 500 }
        );
    }
}
