import { NextRequest, NextResponse } from "next/server";
import { SlbMeasurer } from "@/services/lease/slb-measurer";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { SlbMeasureReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const slbMeasurer = new SlbMeasurer();

// POST /api/slb/:id/measure - Measure SLB transaction
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:slb");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = SlbMeasureReq.parse({
            ...body,
            slbId: params.id
        });

        const result = await slbMeasurer.measureSlbTransaction(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid measurement data");
        }

        console.error("Error measuring SLB transaction:", error);
        return serverError("Failed to measure SLB transaction");
    } });
