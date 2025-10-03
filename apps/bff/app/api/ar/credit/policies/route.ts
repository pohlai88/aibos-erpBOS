import { NextRequest } from "next/server";
import { CreditPolicyUpsert } from "@aibos/contracts";
import { ArCreditManagementService } from "@/services/ar/credit-management";
import { requireAuth, requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { arCreditPolicy } from "@aibos/db-adapter/schema";

// --- AR Credit Policy Management Route (M24.1) -------------------------------------

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:credit:policy");
        if (cap instanceof Response) return cap;

        const policies = await db
            .select()
            .from(arCreditPolicy)
            .where(eq(arCreditPolicy.companyId, auth.company_id));

        return Response.json({
            policies: policies.map(policy => ({
                policy_code: policy.policyCode,
                segment: policy.segment,
                max_limit: Number(policy.maxLimit),
                dso_target: policy.dsoTarget,
                grace_days: policy.graceDays,
                ptp_tolerance: policy.ptpTolerance,
                risk_weight: Number(policy.riskWeight),
                updated_at: policy.updatedAt,
                updated_by: policy.updatedBy
            }))
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching credit policies:', error);
        return Response.json({ error: 'Failed to fetch credit policies' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:credit:policy");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = CreditPolicyUpsert.parse(json);

        await db.insert(arCreditPolicy).values({
            companyId: auth.company_id,
            policyCode: data.policy_code,
            segment: data.segment,
            maxLimit: data.max_limit.toString(),
            dsoTarget: data.dso_target,
            graceDays: data.grace_days,
            ptpTolerance: data.ptp_tolerance,
            riskWeight: data.risk_weight.toString(),
            updatedBy: auth.user_id
        }).onConflictDoUpdate({
            target: [arCreditPolicy.companyId, arCreditPolicy.policyCode],
            set: {
                segment: data.segment,
                maxLimit: data.max_limit.toString(),
                dsoTarget: data.dso_target,
                graceDays: data.grace_days,
                ptpTolerance: data.ptp_tolerance,
                riskWeight: data.risk_weight.toString(),
                updatedAt: new Date(),
                updatedBy: auth.user_id
            }
        });

        return Response.json({
            message: 'Credit policy created/updated successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error creating/updating credit policy:', error);
        return Response.json({ error: 'Failed to create/update credit policy' }, { status: 500 });
    }
}
