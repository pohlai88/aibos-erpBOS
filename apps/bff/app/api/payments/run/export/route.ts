import { NextRequest } from "next/server";
import { PayRunExport } from "@aibos/contracts";
import { exportPayRun } from "@/services/payments/payments";
import { requireAuth } from "@/lib/auth";

// --- Payment Run Export Routes (M23) -----------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = PayRunExport.parse(json);

        const exportData = await exportPayRun(auth.company_id, data, auth.user_id);

        return Response.json({
            export: exportData,
            message: 'Payment run exported successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error exporting payment run:', error);
        return Response.json({ error: 'Failed to export payment run' }, { status: 500 });
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
