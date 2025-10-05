// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { PaymentPrefUpsert } from "@aibos/contracts";
import { upsertPaymentPref } from "@/services/payments/payments";
import { requireAuth } from "@/lib/auth";

// --- Payment Preferences Routes (M23) --------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = PaymentPrefUpsert.parse(json);

        const pref = await upsertPaymentPref(auth.company_id, data, auth.user_id);

        return Response.json({ pref }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting payment preference:', error);
        return Response.json({ error: 'Failed to upsert payment preference' }, { status: 500 });
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
