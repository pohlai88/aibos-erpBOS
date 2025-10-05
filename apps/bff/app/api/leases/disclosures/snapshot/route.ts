import { NextRequest, NextResponse } from "next/server";
import { LeaseDisclosureService } from "@/services/lease/remeasure";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseDisclosureSnapshotReq, LeaseDisclosureReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const disclosureService = new LeaseDisclosureService();

// POST /api/leases/disclosures/snapshot - Generate disclosure snapshot
// GET /api/leases/disclosures/snapshot - Get existing disclosure snapshots
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:disclose");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const data = LeaseDisclosureSnapshotReq.parse(body);

        const result = await disclosureService.generateDisclosureSnapshot(auth.company_id, auth.user_id, data);

        return ok(result);
    } catch (error) {
        console.error("Error generating disclosure snapshot:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const { searchParams } = new URL(request.url);

        const year = parseInt(searchParams.get("year") || "0");
        const month = parseInt(searchParams.get("month") || "0");

        if (!year || !month) {
            return badRequest("Year and month parameters are required");
        }

        const data = LeaseDisclosureReq.parse({ year, month });
        const result = await disclosureService.generateDisclosures(auth.company_id, auth.user_id, data);

        return ok(result);
    } catch (error) {
        console.error("Error getting disclosure snapshots:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
