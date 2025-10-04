import { NextRequest, NextResponse } from "next/server";
import { PlaybookService } from "@/services";
import { PlaybookUpsertM27_2, ListPlaybooksQueryM27_2 } from "@aibos/contracts";

const playbookService = new PlaybookService();

/**
 * M27.2: Playbooks API Routes
 * 
 * GET /api/ops/playbooks - List playbooks with filtering
 * POST /api/ops/playbooks - Create or update playbook
 */

export async function GET(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
        }

        const query: ListPlaybooksQueryM27_2 = {
            status: searchParams.get("status") as any,
            limit: parseInt(searchParams.get("limit") || "50"),
            offset: parseInt(searchParams.get("offset") || "0")
        };

        const result = await playbookService.listPlaybooks(companyId, query);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error listing playbooks:", error);
        return NextResponse.json(
            { error: "Failed to list playbooks" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return NextResponse.json({ error: "Missing company or user context" }, { status: 400 });
        }

        const body = await request.json();
        const data = PlaybookUpsertM27_2.parse(body);

        // Validate playbook spec
        const validation = await playbookService.validateSpec(data.spec);
        if (!validation.valid) {
            return NextResponse.json(
                { error: "Invalid playbook spec", details: validation.errors },
                { status: 422 }
            );
        }

        const result = await playbookService.upsertPlaybook(companyId, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error upserting playbook:", error);
        return NextResponse.json(
            { error: "Failed to upsert playbook" },
            { status: 500 }
        );
    }
}