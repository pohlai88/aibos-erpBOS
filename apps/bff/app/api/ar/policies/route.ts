import { NextRequest } from "next/server";
import { DunningPolicyUpsert } from "@aibos/contracts";
import { ArDunningService } from "@/services/ar/dunning";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Dunning Policies Routes (M24) --------------------------------------------

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const service = new ArDunningService();
        const policies = await service.getAllDunningPolicies(auth.company_id);

        return Response.json({ policies }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching AR policies:', error);
        return Response.json({ error: 'Failed to fetch AR policies' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:dunning:policy");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = DunningPolicyUpsert.parse(json);

        const service = new ArDunningService();
        await service.upsertDunningPolicy(auth.company_id, data, auth.user_id);

        return Response.json({
            message: 'Dunning policy updated successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting AR policy:', error);
        return Response.json({ error: 'Failed to upsert AR policy' }, { status: 500 });
    }
}
