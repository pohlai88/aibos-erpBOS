// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { getMatchProposals } from "@/services/consol/ic-workbench";
import { requireAuth } from "@/lib/auth";

// --- IC Proposals Routes (M21.2) ----------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const groupCode = url.searchParams.get('group_code');
        const year = url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined;
        const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined;

        const proposals = await getMatchProposals(
            auth.company_id,
            groupCode || undefined,
            year,
            month
        );

        return Response.json({ proposals }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching IC proposals:', error);
        return Response.json({ error: 'Failed to fetch IC proposals' }, { status: 500 });
    }
}

export async function OPTIONS(_req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
