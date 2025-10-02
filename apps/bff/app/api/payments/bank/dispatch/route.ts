import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { DispatchRequest } from "@aibos/contracts";
import { dispatchPaymentRun } from "@/services/payments/bank-connect";

// --- Payment Dispatch Routes --------------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const capability = await requireCapability(auth, 'pay:dispatch');
        if (capability instanceof Response) return capability;

        const body = await req.json();
        const validatedData = DispatchRequest.parse(body);

        const outbox = await dispatchPaymentRun(auth.company_id, validatedData);

        return Response.json(outbox, { status: 201 });
    } catch (error) {
        console.error('Error dispatching payment run:', error);
        if (error instanceof Error && error.message.includes('validation')) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        return Response.json({ error: 'Failed to dispatch payment run' }, { status: 500 });
    }
}
