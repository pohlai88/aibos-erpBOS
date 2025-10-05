import { NextRequest, NextResponse } from "next/server";
import { SlbAssessor } from "@/services/lease/slb-assessor";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { SlbCreateReq, SlbQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const slbAssessor = new SlbAssessor();

// POST /api/slb - Create SLB transaction
// GET /api/slb - Query SLB transactions
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:slb");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = SlbCreateReq.parse(body);

        const result = await slbAssessor.createSlbTransaction(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid SLB data");
        }

        console.error("Error creating SLB transaction:", error);
        return serverError("Failed to create SLB transaction");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            assetId: url.searchParams.get('asset_id') || undefined,
            status: url.searchParams.get('status') as any || undefined,
            saleDateFrom: url.searchParams.get('sale_date_from') || undefined,
            saleDateTo: url.searchParams.get('sale_date_to') || undefined,
            controlTransferred: url.searchParams.get('control_transferred') === 'true' ? true :
                url.searchParams.get('control_transferred') === 'false' ? false : undefined,
            limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
            offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
        };

        const validatedQuery = SlbQuery.parse(query);
        const result = await slbAssessor.querySlbTransactions(auth.company_id, validatedQuery);
        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error querying SLB transactions:", error);
        return serverError("Failed to query SLB transactions");
    } });
