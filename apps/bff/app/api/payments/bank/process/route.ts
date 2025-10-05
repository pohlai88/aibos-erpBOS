import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processOutboxQueue, processAckMappings } from "@/services/payments/bank-connect";
import { withRouteErrors, ok } from "@/api/_kit";

// --- Automated Bank Processing Routes -----------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        // This route can be called by cron jobs or webhooks
        // For cron jobs, we might not have auth context, so we'll handle that
        let companyId: string;

        try {
            const auth = await requireAuth(req);
            if (auth instanceof Response) {
                // If auth fails, try to get company from query params for cron jobs
                const url = new URL(req.url);
                companyId = url.searchParams.get('company_id') || '';
                if (!companyId) {
                    return ok({ error: 'Company ID required' }, 400);
                }
            } else {
                companyId = auth.company_id;
            }
        } catch {
            // Fallback for cron jobs
            const url = new URL(req.url);
            companyId = url.searchParams.get('company_id') || '';
            if (!companyId) {
                return ok({ error: 'Company ID required' }, 400);
            }
        }

        const url = new URL(req.url);
        const action = url.searchParams.get('action') || 'all';

        const results: any = {};

        if (action === 'dispatch' || action === 'all') {
            try {
                await processOutboxQueue(companyId);
                results.dispatch = { success: true, message: 'Outbox queue processed' };
            } catch (error) {
                results.dispatch = { success: false, error: String(error) };
            }
        }

        if (action === 'fetch' || action === 'all') {
            try {
                await processAckMappings(companyId);
                results.fetch = { success: true, message: 'Acknowledgment mappings processed' };
            } catch (error) {
                results.fetch = { success: false, error: String(error) };
            }
        }

        return ok(results);
    } catch (error) {
        console.error('Error in automated bank processing:', error);
        return ok({ error: 'Failed to process bank operations' }, 500);
    } });
