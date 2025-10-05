import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok } from "@/lib/http";
import { withRouteErrors, isResponse } from "@/lib/route-utils";
import { runTaxReturn } from "@/services/tax_return/templates";
import { TaxReturnRunRequest } from "@aibos/contracts";

// POST /api/tax/returns/run - Run tax return (dry-run or commit)
export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, "tax:manage");
    if (forbiddenCheck) return forbiddenCheck;

    const json = await req.json();
    const input = TaxReturnRunRequest.parse(json);

    const result = await runTaxReturn(auth.company_id, input, auth.user_id);
    return ok(result);
});

// OPTIONS - CORS support
export async function OPTIONS(_req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        }
    });
}
