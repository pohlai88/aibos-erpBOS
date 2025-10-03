import { NextRequest } from "next/server";
import { ArCreditManagementService } from "@/services/ar/credit-management";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Collections KPI Route (M24.1) --------------------------------------------

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:collect:workbench");
        if (cap instanceof Response) return cap;

        const url = new URL(req.url);
        const asOfDate = url.searchParams.get('as_of_date') || new Date().toISOString().split('T')[0]!;

        const service = new ArCreditManagementService();
        const snapshot = await service.generateKpiSnapshot(auth.company_id, asOfDate);

        return Response.json({
            snapshot
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error generating KPI snapshot:', error);
        return Response.json({ error: 'Failed to generate KPI snapshot' }, { status: 500 });
    }
}
