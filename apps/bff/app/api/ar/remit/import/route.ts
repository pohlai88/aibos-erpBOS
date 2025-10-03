import { NextRequest } from "next/server";
import { RemitImportReq } from "@aibos/contracts";
import { ArCashApplicationService } from "@/services/ar/cash-application";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Remittance Import Route (M24) ---------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:remit:import");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = RemitImportReq.parse(json);

        const service = new ArCashApplicationService();
        const result = await service.importRemittance(auth.company_id, data, auth.user_id);

        return Response.json({
            result,
            message: 'Remittance imported successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error importing remittance:', error);
        return Response.json({ error: 'Failed to import remittance' }, { status: 500 });
    }
}
