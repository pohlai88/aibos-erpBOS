import { NextRequest } from "next/server";
import { PayeeKycUpsert } from "@aibos/contracts";
import { upsertPayeeKyc, getPayeeKyc } from "@/services/payments/policy";
import { requireAuth } from "@/lib/auth";

// --- KYC Dossier Routes (M23.1) -----------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const supplierId = url.searchParams.get('supplier_id');

        if (!supplierId) {
            return Response.json({ error: 'supplier_id parameter required' }, { status: 400 });
        }

        const kyc = await getPayeeKyc(auth.company_id, supplierId);

        return Response.json({ kyc }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching KYC dossier:', error);
        return Response.json({ error: 'Failed to fetch KYC dossier' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = PayeeKycUpsert.parse(json);

        const kyc = await upsertPayeeKyc(auth.company_id, data, auth.user_id);

        return Response.json({
            kyc,
            message: 'KYC dossier updated successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting KYC dossier:', error);
        return Response.json({ error: 'Failed to upsert KYC dossier' }, { status: 500 });
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
