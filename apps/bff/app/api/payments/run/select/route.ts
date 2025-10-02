import { NextRequest } from "next/server";
import { PayRunSelect } from "@aibos/contracts";
import { selectInvoicesForRun } from "@/services/payments/payments";
import { requireAuth } from "@/lib/auth";

// --- Payment Run Selection Routes (M23) -------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = PayRunSelect.parse(json);

        const run = await selectInvoicesForRun(auth.company_id, data, auth.user_id);

        return Response.json({
            run,
            message: 'Invoices selected for payment run successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error selecting invoices for run:', error);
        return Response.json({ error: 'Failed to select invoices for run' }, { status: 500 });
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
