import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, forbidden, unprocessable } from "@/lib/http";
import { withRouteErrors, isResponse } from "@/lib/route-utils";
import {
    upsertAllocDriverValues,
    getAllocDriverValues
} from "@/services/alloc/rules";
import { AllocDriverUpsert } from "@aibos/contracts";

// GET /api/alloc/drivers - Get driver values
export const GET = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "alloc:read");
    if (forbiddenCheck) return forbiddenCheck;

    const url = new URL(req.url);
    const driverCode = url.searchParams.get("driver_code");
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");

    if (!driverCode || !year || !month) {
        return unprocessable("driver_code, year, and month are required");
    }

    const driverValues = await getAllocDriverValues(
        auth.company_id,
        driverCode,
        parseInt(year),
        parseInt(month)
    );

    return ok({
        driver_code: driverCode,
        year: parseInt(year),
        month: parseInt(month),
        rows: driverValues.map(dv => ({
            cost_center: dv.costCenter,
            project: dv.project,
            value: dv.value
        }))
    });
});

// POST /api/alloc/drivers - Upsert driver values
export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "alloc:manage");
    if (forbiddenCheck) return forbiddenCheck;

    const json = await req.json();
    const input = AllocDriverUpsert.parse(json);

    const result = await upsertAllocDriverValues(auth.company_id, auth.user_id, input);
    return ok(result);
});

// OPTIONS - CORS support
export async function OPTIONS(_req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        }
    });
}
