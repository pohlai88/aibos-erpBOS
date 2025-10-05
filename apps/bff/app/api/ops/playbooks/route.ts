import { NextRequest, NextResponse } from "next/server";
import { PlaybookService } from "@/services";
import { PlaybookUpsertM27_2, ListPlaybooksQueryM27_2 } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookService = new PlaybookService();
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        const query: ListPlaybooksQueryM27_2 = {
            status: searchParams.get("status") as any,
            limit: parseInt(searchParams.get("limit") || "50"),
            offset: parseInt(searchParams.get("offset") || "0")
        };

        const result = await playbookService.listPlaybooks(companyId, query);

        return ok(result);
    } catch (error) {
        console.error("Error listing playbooks:", error);
        return ok({ error: "Failed to list playbooks" }, 500);
    } });
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const data = PlaybookUpsertM27_2.parse(body);

        // Validate playbook spec
        const validation = await playbookService.validateSpec(data.spec);
        if (!validation.valid) {
            return ok({ error: "Invalid playbook spec", details: validation.errors }, 422);
        }

        const result = await playbookService.upsertPlaybook(companyId, userId, data);

        return ok(result);
    } catch (error) {
        console.error("Error upserting playbook:", error);
        return ok({ error: "Failed to upsert playbook" }, 500);
    } });
