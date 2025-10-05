import { NextRequest, NextResponse } from "next/server";
import { RevModificationService } from "@/services/rb/modifications";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { VCPolicyUpsert } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const modificationService = new RevModificationService();

// POST /api/rev/vc/policy - Upsert VC policy
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:vc");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = VCPolicyUpsert.parse(body);

        const result = await modificationService.upsertVCPolicy(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        console.error("Error upserting VC policy:", error);
        return serverError("Failed to upsert VC policy");
    } });
