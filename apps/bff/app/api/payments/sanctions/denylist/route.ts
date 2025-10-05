import { NextRequest } from "next/server";
import { DenylistUpsert, SanctionScreenRequest, SanctionDecision } from "@aibos/contracts";
import {
    upsertDenylist,
    getDenylist,
    runSanctionsScreen,
    decideSanctionHit
} from "@/services/payments/policy";
import { requireAuth } from "@/lib/auth";

// --- Sanctions Denylist Routes (M23.1) ----------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const denylist = await getDenylist(auth.company_id);

        return Response.json({ denylist }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching denylist:', error);
        return Response.json({ error: 'Failed to fetch denylist' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = DenylistUpsert.parse(json);

        await upsertDenylist(auth.company_id, data);

        return Response.json({
            message: 'Denylist entry added successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting denylist:', error);
        return Response.json({ error: 'Failed to upsert denylist' }, { status: 500 });
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
