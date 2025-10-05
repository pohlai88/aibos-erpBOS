import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, forbidden, unprocessable } from "@/lib/http";
import { withRouteErrors, isResponse } from "@/lib/route-utils";
import {
    upsertOwnership,
    getOwnershipTree
} from "@/services/consol/entities";
import {
    OwnershipUpsert
} from "@aibos/contracts";

// GET /api/consol/ownership - List ownership relationships
export const GET = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "consol:read");
    if (forbiddenCheck) return forbiddenCheck;

    const url = new URL(req.url);
    const groupCode = url.searchParams.get("group_code");
    const asOfDate = url.searchParams.get("as_of_date") || new Date().toISOString().split('T')[0];

    if (!groupCode) {
        return unprocessable("group_code parameter is required");
    }

    const ownership = await getOwnershipTree(auth.company_id, groupCode!, asOfDate!);
    return ok(ownership);
});

// POST /api/consol/ownership - Create or update ownership relationship
export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "consol:manage");
    if (forbiddenCheck) return forbiddenCheck;

    const json = await req.json();
    const input = OwnershipUpsert.parse(json);

    const result = await upsertOwnership(auth.company_id, input);
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
