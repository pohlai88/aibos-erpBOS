// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { ConsolNciMapUpsert } from "@aibos/contracts";
import { upsertNciMap, getNciMap } from "@/services/consol/policy";
import { requireAuth } from "@/lib/auth";

// --- NCI Map Routes (M21.1) --------------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const nciMap = await getNciMap(auth.company_id);

        return Response.json({ nci_map: nciMap }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching NCI map:', error);
        return Response.json({ error: 'Failed to fetch NCI map' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = ConsolNciMapUpsert.parse(json);

        const nciMap = await upsertNciMap(auth.company_id, data, auth.user_id);

        return Response.json({ nci_map: nciMap }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting NCI map:', error);
        return Response.json({ error: 'Failed to upsert NCI map' }, { status: 500 });
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
