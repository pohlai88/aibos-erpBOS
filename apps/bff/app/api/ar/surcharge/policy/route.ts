import { NextRequest } from "next/server";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError, isResponse } from "@/lib/http";
import { z } from "zod";
import { ArSurchargeService } from "@/services/ar/surcharge";

const SurchargePolicySchema = z.object({
    enabled: z.boolean(),
    pct: z.number().min(0).max(1),
    min_fee: z.number().min(0),
    cap_fee: z.number().min(0).optional()
});

const surchargeService = new ArSurchargeService();

// GET /api/ar/surcharge/policy - Get surcharge policy
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const cap = requireCapability(auth, "ar:portal:policy");
        if (isResponse(cap)) return cap;

        const policy = await surchargeService.getPolicy(auth.company_id);
        return ok(policy);
    } catch (err: any) {
        console.error("RouteError", { path: "ar/surcharge/policy", err });
        return serverError("Unexpected error");
    }
}

// PUT /api/ar/surcharge/policy - Update surcharge policy
export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const cap = requireCapability(auth, "ar:portal:policy");
        if (isResponse(cap)) return cap;

        const body = await req.json().catch(() => null);
        if (!body) return badRequest("Invalid JSON body");

        const input = SurchargePolicySchema.safeParse(body);
        if (!input.success) return badRequest(input.error.message);

        const result = await surchargeService.updatePolicy(
            auth.company_id,
            auth.user_id ?? "unknown",
            input.data
        );
        return ok(result);
    } catch (err: any) {
        console.error("RouteError", { path: "ar/surcharge/policy", err });
        return serverError("Unexpected error");
    }
}