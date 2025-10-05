// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { SanctionScreenRequest } from "@aibos/contracts";
import { runSanctionsScreen } from "@/services/payments/policy";
import { requireAuth } from "@/lib/auth";

// --- Sanctions Screening Routes (M23.1) --------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = SanctionScreenRequest.parse(json);

        const result = await runSanctionsScreen(auth.company_id, data, auth.user_id);

        return Response.json({
            screen_id: result.screenId,
            hits: result.hits,
            message: 'Sanctions screening completed successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error running sanctions screen:', error);
        return Response.json({ error: 'Failed to run sanctions screen' }, { status: 500 });
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
