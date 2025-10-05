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
import { withRouteErrors, ok } from "@/api/_kit";

// --- Bank Profile Management Routes --------------------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const bankCode = url.searchParams.get('bank_code');

        if (bankCode) {
            const profile = await getBankProfile(auth.company_id, bankCode);
            if (!profile) {
                return ok({ error: 'Bank profile not found' }, 404);
            }
            return ok(profile);
        } else {
            const profiles = await listBankProfiles(auth.company_id);
            return ok(profiles);
        }
    } catch (error) {
        console.error('Error fetching bank profiles:', error);
        return ok({ error: 'Failed to fetch bank profiles' }, 500);
    } });
export const POST = withRouteErrors(async (req: NextRequest) => { try {
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

        return ok(profile, 201);
    } catch (error) {
        console.error('Error upserting bank profile:', error);
        if (error instanceof Error && error.message.includes('validation')) {
            return ok({ error: error.message }, 400);
        }
        return ok({ error: 'Failed to upsert bank profile' }, 500);
    } });
