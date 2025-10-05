// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { ConsolRateOverrideUpsert } from "@aibos/contracts";
import { upsertRateOverride, getRateOverrides } from "@/services/consol/policy";
import { requireAuth } from "@/lib/auth";

// --- Rate Override Routes (M21.1) --------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const overrides = await getRateOverrides(auth.company_id);

        return Response.json({ overrides }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching rate overrides:', error);
        return Response.json({ error: 'Failed to fetch rate overrides' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = ConsolRateOverrideUpsert.parse(json);

        const override = await upsertRateOverride(auth.company_id, data, auth.user_id);

        return Response.json({ override }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting rate override:', error);
        return Response.json({ error: 'Failed to upsert rate override' }, { status: 500 });
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
