import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, forbidden, unprocessable } from "@/lib/http";
import { withRouteErrors, isResponse } from "@/lib/route-utils";
import {
    runConsolidation,
    getConsolRuns
} from "@/services/consol/consolidation";
import {
    ConsolRunRequest
} from "@aibos/contracts";

// GET /api/consol/runs - List consolidation runs
export const GET = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "consol:read");
    if (forbiddenCheck) return forbiddenCheck;

    const url = new URL(req.url);
    const groupCode = url.searchParams.get("group_code");
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");

    const runs = await getConsolRuns(
        auth.company_id,
        groupCode || undefined,
        year ? parseInt(year) : undefined,
        month ? parseInt(month) : undefined
    );
    return ok(runs);
});

// POST /api/consol/run - Run consolidation
export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "consol:manage");
    if (forbiddenCheck) return forbiddenCheck;

    const json = await req.json();
    const input = ConsolRunRequest.parse(json);

    const result = await runConsolidation(auth.company_id, input, auth.user_id);
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
