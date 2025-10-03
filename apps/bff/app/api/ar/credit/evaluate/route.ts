import { NextRequest } from "next/server";
import { CreditEvaluateReq } from "@aibos/contracts";
import { ArCreditManagementService } from "@/services/ar/credit-management";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Credit Evaluation Route (M24.1) -------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:credit:policy");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = CreditEvaluateReq.parse(json);

        const service = new ArCreditManagementService();
        const result = await service.evaluateCreditHolds(auth.company_id, data, auth.user_id);

        return Response.json({
            result,
            message: data.dry_run ? 'Credit evaluation completed (dry run)' : 'Credit evaluation completed'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error evaluating credit holds:', error);
        return Response.json({ error: 'Failed to evaluate credit holds' }, { status: 500 });
    }
}
