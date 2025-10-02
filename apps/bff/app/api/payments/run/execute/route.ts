import { NextRequest } from "next/server";
import { PayRunExecute } from "@aibos/contracts";
import { executePayRun } from "@/services/payments/payments";
import { requireAuth } from "@/lib/auth";

// --- Payment Run Execution Routes (M23) --------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = PayRunExecute.parse(json);

        const run = await executePayRun(auth.company_id, data, auth.user_id);

        return Response.json({
            run,
            message: 'Payment run executed successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error executing payment run:', error);
        return Response.json({ error: 'Failed to execute payment run' }, { status: 500 });
    }
}

export async function OPTIONS(_req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
