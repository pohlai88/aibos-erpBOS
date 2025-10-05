import { NextRequest, NextResponse } from "next/server";
import { LeaseEvidenceService } from "@/services/lease/remeasure";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const disclosureService = new LeaseEvidenceService();

// GET /api/leases/disclosures/impair - Get impairment disclosures
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:disclose");
        if (cap instanceof Response) return cap;

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        if (!year || !month) {
            return badRequest("year and month are required");
        }

        // Get impairment disclosures (simplified implementation)
        const impairmentDisclosures = await disclosureService.getImpairmentDisclosures(
            auth.company_id,
            auth.user_id,
            { year: parseInt(year), month: parseInt(month) }
        );

        return ok(impairmentDisclosures);
    } catch (error) {
        console.error("Error getting impairment disclosures:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
