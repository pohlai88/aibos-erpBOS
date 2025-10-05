import { NextRequest, NextResponse } from "next/server";
import { LeaseDisclosureService } from "@/services/lease/remeasure";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { ImpairmentOnerousDisclosureReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const disclosureService = new LeaseDisclosureService();

// GET /api/leases/disclosures/impair-onerous - Get impairment and onerous disclosures
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:disclose");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const year = parseInt(url.searchParams.get("year") || "0");
        const month = parseInt(url.searchParams.get("month") || "0");

        if (!year || !month) {
            return badRequest("year and month are required");
        }

        const queryParams = { year, month };
        const validatedQuery = ImpairmentOnerousDisclosureReq.parse(queryParams);

        // This would need to be implemented in the LeaseDisclosureService
        // const disclosures = await disclosureService.getImpairmentOnerousDisclosures(
        //     auth.company_id,
        //     validatedQuery
        // );

        // Placeholder response
        const disclosures = {
            impairment_summary: {
                total_loss: 0,
                total_reversal: 0,
                cgu_count: 0,
                method_breakdown: {}
            },
            onerous_summary: {
                total_opening: 0,
                total_charge: 0,
                total_unwind: 0,
                total_utilization: 0,
                total_closing: 0,
                assessment_count: 0
            },
            indicators_summary: {
                total_indicators: 0,
                severity_breakdown: {},
                kind_breakdown: {}
            }
        };

        return ok(disclosures);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error getting disclosures:", error);
        return serverError("Failed to get disclosures");
    } });
