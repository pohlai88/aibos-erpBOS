import { NextRequest, NextResponse } from "next/server";
import { LeaseCpiService } from "@/services/lease/cpi";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import {
    LeaseCpiUpsert,
    LeaseCpiQuery
} from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const cpiService = new LeaseCpiService();

// POST /api/leases/cpi - Upsert CPI index values
// GET /api/leases/cpi - Query CPI index values
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:manage");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const data = LeaseCpiUpsert.parse(body);

        const result = await cpiService.upsertCpiIndex(auth.company_id, auth.user_id, data);

        return ok(result);
    } catch (error) {
        console.error("Error upserting CPI index:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const { searchParams } = new URL(request.url);

        const query = LeaseCpiQuery.parse({
            index_code: searchParams.get("index_code") || undefined,
            date_from: searchParams.get("date_from") || undefined,
            date_to: searchParams.get("date_to") || undefined
        });

        const result = await cpiService.queryCpiIndex(auth.company_id, query);

        return ok(result);
    } catch (error) {
        console.error("Error querying CPI index:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    } });
