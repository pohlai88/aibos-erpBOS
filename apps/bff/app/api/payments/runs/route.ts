import { NextRequest } from "next/server";
import { getPayRuns } from "@/services/payments/bank-ingest";
import { requireAuth } from "@/lib/auth";

// --- Payment Runs Query Routes (M23) -----------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const year = url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined;
        const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined;

        const runs = await getPayRuns(
            auth.company_id,
            status || undefined,
            year,
            month
        );

        return Response.json({ runs }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching payment runs:', error);
        return Response.json({ error: 'Failed to fetch payment runs' }, { status: 500 });
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
