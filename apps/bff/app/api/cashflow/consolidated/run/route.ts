// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { CfRunIndirectReq, CfRunDirectReq } from "@aibos/contracts";
import { runConsolidatedCashFlow } from "@/services/cashflow/cashflow";
import { requireAuth } from "@/lib/auth";

// --- Consolidated Cash Flow Run Routes (M22) ----------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;
        
        const json = await req.json();
        const groupCode = json.group_code;
        const scope = json.scope; // 'INDIRECT' or 'DIRECT13'
        
        if (!groupCode) {
            return Response.json({ error: 'Group code is required' }, { status: 400 });
        }
        
        if (!scope || !['INDIRECT', 'DIRECT13'].includes(scope)) {
            return Response.json({ error: 'Scope must be INDIRECT or DIRECT13' }, { status: 400 });
        }
        
        let data;
        if (scope === 'INDIRECT') {
            data = CfRunIndirectReq.parse(json);
        } else {
            data = CfRunDirectReq.parse(json);
        }
        
        const result = await runConsolidatedCashFlow(auth.company_id, groupCode, data, auth.user_id);
        
        return Response.json({ 
            result,
            message: data.dry_run ? 'Consolidated dry run completed successfully' : 'Consolidated cash flow run completed successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error running consolidated cash flow:', error);
        return Response.json({ error: 'Failed to run consolidated cash flow' }, { status: 500 });
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
