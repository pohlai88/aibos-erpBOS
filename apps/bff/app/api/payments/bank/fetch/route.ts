import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { FetchRequest } from "@aibos/contracts";
import { fetchBankFiles } from "@/services/payments/bank-connect";

// --- Bank File Fetch Routes ---------------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const capability = await requireCapability(auth, 'pay:dispatch');
        if (capability instanceof Response) return capability;

        const body = await req.json();
        const validatedData = FetchRequest.parse(body);

        const result = await fetchBankFiles(auth.company_id, validatedData);

        return Response.json(result);
    } catch (error) {
        console.error('Error fetching bank files:', error);
        if (error instanceof Error && error.message.includes('validation')) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        return Response.json({ error: 'Failed to fetch bank files' }, { status: 500 });
    }
}
