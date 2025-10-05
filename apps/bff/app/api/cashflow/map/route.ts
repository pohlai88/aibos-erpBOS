// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { CfMapUpsert, CfScenarioUpsert } from "@aibos/contracts";
import {
    upsertCfMap,
    getCfMaps,
    upsertCfScenario,
    getCfScenarios
} from "@/services/cashflow/cashflow";
import { requireAuth } from "@/lib/auth";

// --- Cash Flow Mapping Routes (M22) -------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const mapCode = url.searchParams.get('map_code');

        const maps = await getCfMaps(auth.company_id, mapCode || undefined);

        return Response.json({ maps }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching cash flow maps:', error);
        return Response.json({ error: 'Failed to fetch cash flow maps' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = CfMapUpsert.parse(json);

        const map = await upsertCfMap(auth.company_id, data, auth.user_id);

        return Response.json({ map }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting cash flow map:', error);
        return Response.json({ error: 'Failed to upsert cash flow map' }, { status: 500 });
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
