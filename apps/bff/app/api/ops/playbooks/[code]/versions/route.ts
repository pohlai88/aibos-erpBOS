import { NextRequest, NextResponse } from "next/server";
import { PlaybookService } from "@/services";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookService = new PlaybookService();
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { code: string } }) => { try {
        const companyId = request.headers.get("x-company-id");

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        const result = await playbookService.getPlaybookVersions(companyId, params.code);

        return ok({ versions: result });
    } catch (error) {
        console.error("Error getting playbook versions:", error);
        return ok({ error: "Failed to get playbook versions" }, 500);
    } });
