import { NextRequest, NextResponse } from "next/server";
import { LeaseDisclosureService } from "@/services/lease/remeasure";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseDisclosureReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const disclosureService = new LeaseDisclosureService();

// GET /api/leases/disclosures - Generate MFRS 16 disclosures
// POST /api/leases/disclosures - Generate and store disclosures
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:disclose");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const year = url.searchParams.get('year');
        const month = url.searchParams.get('month');

        if (!year || !month) {
            return badRequest("Year and month parameters are required");
        }

        const validatedData = LeaseDisclosureReq.parse({
            year: parseInt(year),
            month: parseInt(month)
        });

        const disclosures = await disclosureService.generateDisclosures(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(disclosures);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error generating disclosures:", error);
        return serverError("Failed to generate disclosures");
    } });
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:disclose");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = LeaseDisclosureReq.parse(body);

        const disclosures = await disclosureService.generateDisclosures(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        // Store disclosures in database
        const disclosureId = await disclosureService.storeDisclosures(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok({
            disclosure_id: disclosureId,
            disclosures
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid disclosure data");
        }
        console.error("Error storing disclosures:", error);
        return serverError("Failed to store disclosures");
    } });
