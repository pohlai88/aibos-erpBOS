import { NextRequest } from "next/server";
import { WorkbenchQuery } from "@aibos/contracts";
import { ArCreditManagementService } from "@/services/ar/credit-management";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Collections Workbench Route (M24.1) --------------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:collect:workbench");
        if (cap instanceof Response) return cap;

        const url = new URL(req.url);
        const query: any = {};

        if (url.searchParams.get('bucket')) {
            query.bucket = url.searchParams.get('bucket');
        }
        if (url.searchParams.get('on_hold')) {
            query.on_hold = url.searchParams.get('on_hold') === 'true';
        }
        if (url.searchParams.get('min_exposure')) {
            query.min_exposure = Number(url.searchParams.get('min_exposure'));
        }
        if (url.searchParams.get('max_rows')) {
            query.max_rows = Number(url.searchParams.get('max_rows'));
        }

        const parsedQuery = WorkbenchQuery.parse(query);
        const service = new ArCreditManagementService();
        const customers = await service.getWorkbenchList(auth.company_id, parsedQuery);

        return ok({
                    customers,
                    total: customers.length,
                    query: parsedQuery
                }, 200);
    } catch (error) {
        console.error('Error fetching workbench list:', error);
        return ok({ error: 'Failed to fetch workbench list' }, 500);
    } });
