import { NextRequest, NextResponse } from "next/server";
import { PlaybookService } from "@/services";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookService = new PlaybookService();
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { code: string } }) => { try {
        const companyId = request.headers.get("x-company-id");
        const userId = request.headers.get("x-user-id");

        if (!companyId || !userId) {
            return ok({ error: "Missing company or user context" }, 400);
        }

        const body = await request.json();
        const { spec, changeSummary } = body;

        if (!spec) {
            return ok({ error: "spec is required" }, 400);
        }

        // Validate playbook spec
        const validation = await playbookService.validateSpec(spec);
        if (!validation.valid) {
            return ok({ error: "Invalid playbook spec", details: validation.errors }, 422);
        }

        const result = await playbookService.publishPlaybookVersion(
            companyId,
            params.code,
            spec,
            userId,
            changeSummary
        );

        return ok(result);
    } catch (error) {
        console.error("Error publishing playbook:", error);
        return ok({ error: "Failed to publish playbook" }, 500);
    } });
