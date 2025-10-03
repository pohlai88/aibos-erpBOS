import { NextRequest } from "next/server";
import { PtpResolve } from "@aibos/contracts";
import { ArPtpDisputesService } from "@/services/ar/ptp-disputes";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Promise-to-Pay Resolve Route (M24) ---------------------------------------

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:ptp");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = PtpResolve.parse(json);

        const service = new ArPtpDisputesService();
        await service.resolvePtp(auth.company_id, data, auth.user_id);

        return Response.json({
            message: 'Promise-to-Pay resolved successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error resolving PTP:', error);
        return Response.json({ error: 'Failed to resolve PTP' }, { status: 500 });
    }
}
