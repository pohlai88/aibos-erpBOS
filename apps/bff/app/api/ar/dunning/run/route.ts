import { NextRequest } from "next/server";
import { ArDunningService } from "@/services/ar/dunning";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Dunning Run Route (M24) --------------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:dunning:run");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const dryRun = json.dry_run !== false; // Default to true for safety

        const service = new ArDunningService();
        const result = await service.runDunning(auth.company_id, dryRun);

        return Response.json({
            result,
            message: dryRun ? 'Dunning run completed (dry run)' : 'Dunning run completed'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error running AR dunning:', error);
        return Response.json({ error: 'Failed to run AR dunning' }, { status: 500 });
    }
}
