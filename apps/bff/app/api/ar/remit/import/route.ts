import { NextRequest } from "next/server";
import { RemitImportReq } from "@aibos/contracts";
import { ArCashApplicationService } from "@/services/ar/cash-application";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Remittance Import Route (M24) ---------------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:remit:import");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = RemitImportReq.parse(json);

        const service = new ArCashApplicationService();
        const result = await service.importRemittance(auth.company_id, data, auth.user_id);

        return ok({
                    result,
                    message: 'Remittance imported successfully'
                }, 200);
    } catch (error) {
        console.error('Error importing remittance:', error);
        return ok({ error: 'Failed to import remittance' }, 500);
    } });
