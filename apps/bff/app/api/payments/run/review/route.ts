// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { RunReview } from "@aibos/contracts";
import { reviewPayRun } from "@/services/payments/policy";
import { requireAuth } from "@/lib/auth";

// --- Payment Run Review Routes (M23.1) ----------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = RunReview.parse(json);

        await reviewPayRun(auth.company_id, data, auth.user_id);

        return Response.json({
            message: data.decision === 'approve' ? 'Payment run reviewed successfully' : 'Payment run rejected'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error reviewing payment run:', error);
        return Response.json({ error: 'Failed to review payment run' }, { status: 500 });
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
