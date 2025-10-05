import { NextRequest } from "next/server";
import { DunningPolicyUpsert } from "@aibos/contracts";
import { ArDunningService } from "@/services/ar/dunning";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Dunning Policies Routes (M24) --------------------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const service = new ArDunningService();
        const policies = await service.getAllDunningPolicies(auth.company_id);

        return ok({ policies }, 200);
    } catch (error) {
        console.error('Error fetching AR policies:', error);
        return ok({ error: 'Failed to fetch AR policies' }, 500);
    } });
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:dunning:policy");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = DunningPolicyUpsert.parse(json);

        const service = new ArDunningService();
        await service.upsertDunningPolicy(auth.company_id, data, auth.user_id);

        return ok({
                    message: 'Dunning policy updated successfully'
                }, 200);
    } catch (error) {
        console.error('Error upserting AR policy:', error);
        return ok({ error: 'Failed to upsert AR policy' }, 500);
    } });
