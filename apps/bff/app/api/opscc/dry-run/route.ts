import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Dry-Run Sandbox API Routes
 * 
 * Execute playbooks safely in sandbox environment
 */

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");
        
        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }
        
        const body = await request.json();
        const { playbook_id, version_no, payload = {} } = body;
        
        if (!playbook_id) {
            return NextResponse.json({ error: "playbook_id is required" }, { status: 400 });
        }
        
        const result = await playbookStudio.executeDryRun(
            companyId, 
            userId, 
            playbook_id, 
            version_no, 
            payload
        );
        
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error executing dry run:", error);
        return NextResponse.json(
            { error: "Failed to execute dry run" },
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
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        
        if (!playbookId) {
            return NextResponse.json({ error: "playbook_id is required" }, { status: 400 });
        }
        
        const result = await playbookStudio.getDryRunHistory(companyId, playbookId, {
            limit,
            offset
        });
        
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error getting dry run history:", error);
        return NextResponse.json(
            { error: "Failed to get dry run history" },
            { status: 500 }
        );
    }
}
