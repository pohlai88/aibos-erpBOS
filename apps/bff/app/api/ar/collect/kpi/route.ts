import { NextRequest } from "next/server";
import { ArCreditManagementService } from "@/services/ar/credit-management";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Collections KPI Route (M24.1) --------------------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:collect:workbench");
        if (cap instanceof Response) return cap;

        const url = new URL(req.url);
        const asOfDate = url.searchParams.get('as_of_date') || new Date().toISOString().split('T')[0]!;

        const service = new ArCreditManagementService();
        const snapshot = await service.generateKpiSnapshot(auth.company_id, asOfDate);

        return ok({
                    snapshot
                }, 200);
    } catch (error) {
        console.error('Error generating KPI snapshot:', error);
        return ok({ error: 'Failed to generate KPI snapshot' }, 500);
    } });
