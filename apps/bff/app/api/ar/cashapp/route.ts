import { NextRequest } from "next/server";
import { ArCashApplicationService } from "@/services/ar/cash-application";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Cash Application List Route (M24) ----------------------------------------

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:cashapp:run");
        if (cap instanceof Response) return cap;

        const url = new URL(req.url);
        const status = url.searchParams.get('status') as 'matched' | 'partial' | 'unmatched' | 'rejected' | undefined;

        const service = new ArCashApplicationService();
        const matches = await service.getCashAppMatches(auth.company_id, status);

        return Response.json({ matches }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching cash application matches:', error);
        return Response.json({ error: 'Failed to fetch cash application matches' }, { status: 500 });
    }
}
