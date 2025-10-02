import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import {
    BankProfileUpsert,
    DispatchRequest,
    FetchRequest,
    ReasonNormUpsert
} from "@aibos/contracts";
import {
    upsertBankProfile,
    getBankProfile,
    listBankProfiles,
    dispatchPaymentRun,
    fetchBankFiles,
    upsertReasonNorm,
    getBankJobLogs,
    processOutboxQueue,
    processAckMappings
} from "@/services/payments/bank-connect";

// --- Bank Profile Management Routes --------------------------------------------
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const bankCode = url.searchParams.get('bank_code');

        if (bankCode) {
            const profile = await getBankProfile(auth.company_id, bankCode);
            if (!profile) {
                return Response.json({ error: 'Bank profile not found' }, { status: 404 });
            }
            return Response.json(profile);
        } else {
            const profiles = await listBankProfiles(auth.company_id);
            return Response.json(profiles);
        }
    } catch (error) {
        console.error('Error fetching bank profiles:', error);
        return Response.json({ error: 'Failed to fetch bank profiles' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const capability = await requireCapability(auth, 'pay:bank_profile');
        if (capability instanceof Response) return capability;

        const body = await req.json();
        const validatedData = BankProfileUpsert.parse(body);

        const profile = await upsertBankProfile(
            auth.company_id,
            validatedData,
            auth.user_id
        );

        return Response.json(profile, { status: 201 });
    } catch (error) {
        console.error('Error upserting bank profile:', error);
        if (error instanceof Error && error.message.includes('validation')) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        return Response.json({ error: 'Failed to upsert bank profile' }, { status: 500 });
    }
}
