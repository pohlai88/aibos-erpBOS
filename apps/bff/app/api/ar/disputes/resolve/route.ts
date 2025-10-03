import { NextRequest } from "next/server";
import { DisputeResolve } from "@aibos/contracts";
import { ArPtpDisputesService } from "@/services/ar/ptp-disputes";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Disputes Resolve Route (M24) ---------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:dispute");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = DisputeResolve.parse(json);

        const service = new ArPtpDisputesService();
        await service.resolveDispute(auth.company_id, data, auth.user_id);

        return Response.json({
            message: 'Dispute resolved successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error resolving dispute:', error);
        return Response.json({ error: 'Failed to resolve dispute' }, { status: 500 });
    }
}
