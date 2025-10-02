import { NextRequest } from "next/server";
import { CfRunIndirectReq } from "@aibos/contracts";
import { runIndirectCashFlow } from "@/services/cashflow/cashflow";
import { requireAuth } from "@/lib/auth";

// --- Indirect Cash Flow Run Routes (M22) -------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = CfRunIndirectReq.parse(json);

        const result = await runIndirectCashFlow(auth.company_id, data, auth.user_id);

        return Response.json({
            result,
            message: data.dry_run ? 'Dry run completed successfully' : 'Indirect cash flow run completed successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error running indirect cash flow:', error);
        return Response.json({ error: 'Failed to run indirect cash flow' }, { status: 500 });
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
