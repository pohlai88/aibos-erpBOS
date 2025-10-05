import { NextRequest, NextResponse } from "next/server";
import { RbUsageService } from "@/services/rb/usage";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { UsageIngest } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const usageService = new RbUsageService();

// POST /api/rb/usage/ingest - Ingest usage events
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:usage:ingest");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = UsageIngest.parse(body);

        const result = await usageService.ingestUsage(
            auth.company_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid usage data");
        }
        console.error("Error ingesting usage:", error);
        return serverError("Failed to ingest usage");
    } });
