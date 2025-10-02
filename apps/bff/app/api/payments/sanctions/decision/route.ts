import { NextRequest } from "next/server";
import { SanctionDecision } from "@aibos/contracts";
import { decideSanctionHit } from "@/services/payments/policy";
import { requireAuth } from "@/lib/auth";

// --- Sanctions Decision Routes (M23.1) ----------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = SanctionDecision.parse(json);

        await decideSanctionHit(auth.company_id, data, auth.user_id);

        return Response.json({
            message: 'Sanctions decision recorded successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error recording sanctions decision:', error);
        return Response.json({ error: 'Failed to record sanctions decision' }, { status: 500 });
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
