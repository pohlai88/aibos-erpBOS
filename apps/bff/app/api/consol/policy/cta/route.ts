import { NextRequest } from "next/server";
import { ConsolCtaPolicyUpsert } from "@aibos/contracts";
import { upsertCtaPolicy, getCtaPolicy } from "@/services/consol/policy";
import { requireAuth } from "@/lib/auth";

// --- CTA Policy Routes (M21.1) -----------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const policy = await getCtaPolicy(auth.company_id);

        return Response.json({ policy }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching CTA policy:', error);
        return Response.json({ error: 'Failed to fetch CTA policy' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = ConsolCtaPolicyUpsert.parse(json);

        const policy = await upsertCtaPolicy(auth.company_id, data, auth.user_id);

        return Response.json({ policy }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting CTA policy:', error);
        return Response.json({ error: 'Failed to upsert CTA policy' }, { status: 500 });
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
