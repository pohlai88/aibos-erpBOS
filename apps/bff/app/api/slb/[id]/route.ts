import { NextRequest, NextResponse } from "next/server";
import { SlbAssessor } from "@/services/lease/slb-assessor";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const slbAssessor = new SlbAssessor();

// GET /api/slb/:id - Get SLB transaction detail
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const result = await slbAssessor.getSlbDetail(
            auth.company_id,
            params.id
        );

        if (!result) {
            return badRequest("SLB transaction not found");
        }

        return ok(result);
    } catch (error) {
        console.error("Error getting SLB detail:", error);
        return serverError("Failed to get SLB detail");
    } });
