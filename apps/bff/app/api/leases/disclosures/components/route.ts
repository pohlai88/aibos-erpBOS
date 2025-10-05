import { NextRequest, NextResponse } from "next/server";
import { LeaseRemeasureService } from "@/services/lease/remeasure";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const disclosureService = new LeaseRemeasureService();

// GET /api/leases/disclosures/components - Get component disclosures
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

        // Get component disclosures (simplified implementation)
        const componentDisclosures = await disclosureService.getComponentDisclosures(
            auth.company_id,
            parseInt(year),
            parseInt(month)
        );

        return ok(componentDisclosures);
    } catch (error) {
        console.error("Error getting component disclosures:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
