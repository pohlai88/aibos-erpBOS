import { NextRequest, NextResponse } from "next/server";
import { RevArtifactsService } from "@/services/revenue/policy";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { ExportReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const artifactsService = new RevArtifactsService();

// POST /api/rev/export - Export recognition artifacts
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:export");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = ExportReq.parse(body);

        const result = await artifactsService.exportRun(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid export data");
        }
        console.error("Error exporting artifacts:", error);
        return serverError("Failed to export artifacts");
    } });
