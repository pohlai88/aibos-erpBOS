import { NextRequest, NextResponse } from "next/server";
import { LeaseRestorationService } from "@/services/lease/restoration";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseRestorationPostReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const restorationService = new LeaseRestorationService();

// POST /api/leases/restoration/:id/post/:year/:month - Post restoration provision movements
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string; year: string; month: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:restoration");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = LeaseRestorationPostReq.parse({
            ...body,
            restoration_id: params.id,
            year: parseInt(params.year),
            month: parseInt(params.month)
        });

        const result = await restorationService.postRestoration(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid post data");
        }
        console.error("Error posting restoration:", error);
        return serverError("Failed to post restoration");
    } });
