import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { ReasonNormUpsert } from "@aibos/contracts";
import { upsertReasonNorm } from "@/services/payments/bank-connect";

// --- Reason Code Normalization Routes -----------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const capability = await requireCapability(auth, 'pay:bank_profile');
        if (capability instanceof Response) return capability;

        const body = await req.json();
        const validatedData = ReasonNormUpsert.parse(body);

        const reasonNorm = await upsertReasonNorm(validatedData);

        return Response.json(reasonNorm, { status: 201 });
    } catch (error) {
        console.error('Error upserting reason normalization:', error);
        if (error instanceof Error && error.message.includes('validation')) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        return Response.json({ error: 'Failed to upsert reason normalization' }, { status: 500 });
    }
}
