// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import {
    ConsolRatePolicyUpsert,
    ConsolRateOverrideUpsert,
    ConsolCtaPolicyUpsert,
    ConsolNciMapUpsert,
    ConsolLedgerOptionUpsert
} from "@aibos/contracts";
import {
    upsertRatePolicy,
    getRatePolicies,
    upsertRateOverride,
    getRateOverrides,
    upsertCtaPolicy,
    getCtaPolicy,
    upsertNciMap,
    getNciMap,
    upsertLedgerOption,
    getLedgerOption,
    getDefaultRatePolicies
} from "@/services/consol/policy";
import { requireAuth } from "@/lib/auth";

// --- Rate Policy Routes (M21.1) ----------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const policies = await getRatePolicies(auth.company_id);

        return Response.json({ policies }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching rate policies:', error);
        return Response.json({ error: 'Failed to fetch rate policies' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = ConsolRatePolicyUpsert.parse(json);

        const policy = await upsertRatePolicy(auth.company_id, data, auth.user_id);

        return Response.json({ policy }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting rate policy:', error);
        return Response.json({ error: 'Failed to upsert rate policy' }, { status: 500 });
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
