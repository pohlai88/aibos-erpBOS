import { NextRequest } from "next/server";
import { SupplierBankUpsert, PaymentPrefUpsert } from "@aibos/contracts";
import {
    upsertSupplierBank,
    getSupplierBanks,
    upsertPaymentPref
} from "@/services/payments/payments";
import { requireAuth } from "@/lib/auth";

// --- Supplier Banking Routes (M23) -------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const banks = await getSupplierBanks(auth.company_id);

        return Response.json({ banks }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching supplier banks:', error);
        return Response.json({ error: 'Failed to fetch supplier banks' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = SupplierBankUpsert.parse(json);

        const bank = await upsertSupplierBank(auth.company_id, data, auth.user_id);

        return Response.json({ bank }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting supplier bank:', error);
        return Response.json({ error: 'Failed to upsert supplier bank' }, { status: 500 });
    }
}

export async function OPTIONS(_req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
