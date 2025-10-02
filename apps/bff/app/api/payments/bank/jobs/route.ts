import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { getBankJobLogs } from "@/services/payments/bank-connect";

// --- Bank Job Log Routes ------------------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const capability = await requireCapability(auth, 'pay:dispatch');
        if (capability instanceof Response) return capability;

        const url = new URL(req.url);
        const bankCode = url.searchParams.get('bank_code');
        const kind = url.searchParams.get('kind') as 'DISPATCH' | 'FETCH' | undefined;
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const logs = await getBankJobLogs(auth.company_id, bankCode || undefined, kind, limit);

        return Response.json(logs);
    } catch (error) {
        console.error('Error fetching bank job logs:', error);
        return Response.json({ error: 'Failed to fetch bank job logs' }, { status: 500 });
    }
}
