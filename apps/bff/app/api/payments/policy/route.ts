import { NextRequest } from "next/server";
import { ApprovalPolicyUpsert, SupplierPolicyAssign, SupplierLimitUpsert } from "@aibos/contracts";
import {
    upsertApprovalPolicy,
    getApprovalPolicies,
    assignSupplierPolicy,
    upsertSupplierLimit
} from "@/services/payments/policy";
import { requireAuth } from "@/lib/auth";

// --- Approval Policy Routes (M23.1) ------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const policies = await getApprovalPolicies(auth.company_id);

        return Response.json({ policies }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching approval policies:', error);
        return Response.json({ error: 'Failed to fetch approval policies' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = ApprovalPolicyUpsert.parse(json);

        const policy = await upsertApprovalPolicy(auth.company_id, data, auth.user_id);

        return Response.json({
            policy,
            message: 'Approval policy updated successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting approval policy:', error);
        return Response.json({ error: 'Failed to upsert approval policy' }, { status: 500 });
    }
}

export async function OPTIONS(_req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
