import { NextRequest } from "next/server";
import { CashAppRunReq } from "@aibos/contracts";
import { ArCashApplicationService } from "@/services/ar/cash-application";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Cash Application Run Route (M24) ------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:cashapp:run");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = CashAppRunReq.parse(json);

        const service = new ArCashApplicationService();
        const result = await service.runCashApplication(auth.company_id, data, auth.user_id);

        return Response.json({
            result,
            message: data.dry_run ? 'Cash application completed (dry run)' : 'Cash application completed'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error running cash application:', error);
        return Response.json({ error: 'Failed to run cash application' }, { status: 500 });
    }
}
