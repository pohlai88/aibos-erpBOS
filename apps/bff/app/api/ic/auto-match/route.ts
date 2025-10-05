import { NextRequest } from "next/server";
import { IcAutoMatchRequest } from "@aibos/contracts";
import { generateAutoMatchProposals } from "@/services/consol/ic-workbench";
import { requireAuth } from "@/lib/auth";

// --- IC Auto-Match Routes (M21.2) ---------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = IcAutoMatchRequest.parse(json);

        const proposals = await generateAutoMatchProposals(auth.company_id, data);

        return Response.json({
            proposals,
            summary: {
                total_proposals: proposals.length,
                avg_score: proposals.length > 0 ?
                    proposals.reduce((sum, p) => sum + p.score, 0) / proposals.length : 0
            }
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error generating auto-match proposals:', error);
        return Response.json({ error: 'Failed to generate auto-match proposals' }, { status: 500 });
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
