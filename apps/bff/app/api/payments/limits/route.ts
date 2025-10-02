import { NextRequest } from "next/server";
import { SupplierLimitUpsert } from "@aibos/contracts";
import { upsertSupplierLimit } from "@/services/payments/policy";
import { requireAuth } from "@/lib/auth";

// --- Supplier Limits Routes (M23.1) -------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = SupplierLimitUpsert.parse(json);

        const limit = await upsertSupplierLimit(auth.company_id, data, auth.user_id);

        return Response.json({
            limit,
            message: 'Supplier limits updated successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting supplier limit:', error);
        return Response.json({ error: 'Failed to upsert supplier limit' }, { status: 500 });
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
