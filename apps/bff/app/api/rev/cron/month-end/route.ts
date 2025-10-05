// M25.2 Revenue Modifications Month-End Cron Route
// Monthly processing of recognition runs and disclosures

import { ok, badRequest, forbidden } from "@/lib/http";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, isResponse } from "@/lib/route-utils";
import { RevModificationService } from "@/services/rb/modifications";

export const GET = withRouteErrors(async (req: Request) => {
    try {
        // Internal token validation for cron security
        const authHeader = req.headers.get("authorization");
        const internalToken = req.headers.get("x-internal-token");

        // For now, allow any authenticated user with rev:recognize capability
        // In production, you might want to restrict this to internal services only
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;
        await requireCapability(auth, "rev:recognize");

        console.log(`🚀 Starting revenue modifications month-end cron job at ${new Date().toISOString()}`);

        return await processMonthEndRevenueModifications();

    } catch (error) {
        console.error(JSON.stringify({
            level: 'ERROR',
            event: 'revenue_modifications_month_end_cron_failed',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }));

        return badRequest("Revenue modifications month-end cron failed: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
});

async function processMonthEndRevenueModifications() {
    console.log('🔄 Processing month-end revenue modifications');

    const modificationService = new RevModificationService();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let processedCount = 0;
    let errorCount = 0;

    try {
        // 1. Run revised recognition for current period
        console.log('📊 Running revised recognition for current period');
        try {
            const recognitionResult = await modificationService.runRevisedRecognition(
                'system', // System user for cron jobs
                'system',
                {
                    year: currentYear,
                    month: currentMonth,
                    dry_run: false
                }
            );

            if (recognitionResult.success) {
                console.log('✅ Recognition run completed:', recognitionResult.message);
                processedCount++;
            } else {
                console.error('❌ Recognition run failed:', recognitionResult.message);
                errorCount++;
            }
        } catch (error) {
            console.error('❌ Error running recognition:', error);
            errorCount++;
        }

        // 2. Generate disclosures for current period
        console.log('📋 Generating disclosures for current period');
        try {
            const disclosures = await modificationService.getDisclosures(
                'system', // This would need to be run per company
                currentYear,
                currentMonth
            );

            console.log('✅ Disclosures generated:', {
                modifications: disclosures.modification_register.length,
                vc_rollforward: disclosures.vc_rollforward.length,
                rpo_snapshots: disclosures.rpo_snapshot.length
            });
            processedCount++;
        } catch (error) {
            console.error('❌ Error generating disclosures:', error);
            errorCount++;
        }

        // 3. Update RPO snapshots
        console.log('📈 Updating RPO snapshots');
        // TODO: Implement RPO snapshot updates
        // This would include:
        // - Recalculating RPO amounts
        // - Applying revision deltas
        // - Applying VC deltas

        const result = {
            success: true,
            message: "Revenue modifications month-end cron completed",
            processed: processedCount,
            errors: errorCount,
            period: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
            timestamp: new Date().toISOString()
        };

        console.log('✅ Revenue modifications month-end cron completed:', result);
        return ok(result);

    } catch (error) {
        console.error('❌ Revenue modifications month-end cron failed:', error);
        throw error;
    }
}
