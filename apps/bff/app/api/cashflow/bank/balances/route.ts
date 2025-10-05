import { NextRequest } from "next/server";
import { getBankBalances, getBankAccounts } from "@/services/cashflow/importers";
import { requireAuth } from "@/lib/auth";

// --- Bank Balances Routes (M22) -----------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const acctCode = url.searchParams.get('acct_code');
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');

        const balances = await getBankBalances(
            auth.company_id,
            acctCode || undefined,
            startDate || undefined,
            endDate || undefined
        );

        const accounts = await getBankAccounts(auth.company_id);

        return Response.json({
            balances,
            accounts
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching bank balances:', error);
        return Response.json({ error: 'Failed to fetch bank balances' }, { status: 500 });
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
