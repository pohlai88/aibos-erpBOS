import { NextRequest } from "next/server";
import { ArDunningService } from "@/services/ar/dunning";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Dunning Run Route (M24) --------------------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:dunning:run");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const dryRun = json.dry_run !== false; // Default to true for safety

        const service = new ArDunningService();
        const result = await service.runDunning(auth.company_id, dryRun);

        return ok({
                    result,
                    message: dryRun ? 'Dunning run completed (dry run)' : 'Dunning run completed'
                }, 200);
    } catch (error) {
        console.error('Error running AR dunning:', error);
        return ok({ error: 'Failed to run AR dunning' }, 500);
    } });
