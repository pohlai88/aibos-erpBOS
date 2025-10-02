import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, forbidden, unprocessable } from "@/lib/http";
import { withRouteErrors, isResponse } from "@/lib/route-utils";
import {
    upsertEntity,
    upsertGroup,
    upsertOwnership,
    getEntities,
    getGroups,
    getOwnershipTree
} from "@/services/consol/entities";
import {
    EntityUpsert,
    GroupUpsert,
    OwnershipUpsert
} from "@aibos/contracts";

// GET /api/consol/entities - List entities
export const GET = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "consol:read");
    if (forbiddenCheck) return forbiddenCheck;

    const entities = await getEntities(auth.company_id);
    return ok(entities);
});

// POST /api/consol/entities - Create or update entity
export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "consol:manage");
    if (forbiddenCheck) return forbiddenCheck;

    const json = await req.json();
    const input = EntityUpsert.parse(json);

    const result = await upsertEntity(auth.company_id, input);
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
