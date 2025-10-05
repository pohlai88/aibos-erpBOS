import { NextRequest } from "next/server";
import { PtpResolve } from "@aibos/contracts";
import { ArPtpDisputesService } from "@/services/ar/ptp-disputes";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Promise-to-Pay Resolve Route (M24) ---------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:ptp");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = PtpResolve.parse(json);

        const service = new ArPtpDisputesService();
        await service.resolvePtp(auth.company_id, data, auth.user_id);

        return ok({
                    message: 'Promise-to-Pay resolved successfully'
                }, 200);
    } catch (error) {
        console.error('Error resolving PTP:', error);
        return ok({ error: 'Failed to resolve PTP' }, 500);
    } });
