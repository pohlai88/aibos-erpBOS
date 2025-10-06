// M25.1 Revenue Recognition Cron Route
// Monthly processing of revenue recognition

import { ok, badRequest, forbidden } from '@/lib/http';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { RevRecognitionService } from '@/services/revenue/recognize';
import { RevEventsService } from '@/services/revenue/events';
import { RevRpoService } from '@/services/revenue/policy';

export const GET = withRouteErrors(async (req: Request) => {
  try {
    // Internal token validation for cron security
    const authHeader = req.headers.get('authorization');
    const internalToken = req.headers.get('x-internal-token');

    // For now, allow any authenticated user with rev:recognize capability
    // In production, you might want to restrict this to internal services only
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;
    await requireCapability(auth, 'rev:recognize');

    console.log(
      `🚀 Starting revenue recognition monthly cron job at ${new Date().toISOString()}`
    );

    return await processMonthlyRevenueRecognition();
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        event: 'revenue_recognition_monthly_cron_failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    );

    return badRequest(
      'Revenue recognition monthly cron failed: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  }
});

async function processMonthlyRevenueRecognition() {
  console.log('🔄 Processing monthly revenue recognition');

  const recognitionService = new RevRecognitionService();
  const eventsService = new RevEventsService();
  const rpoService = new RevRpoService();

  // Calculate previous month for recognition
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = previousMonth.getFullYear();
  const month = previousMonth.getMonth() + 1;

  let processedCount = 0;
  let errorCount = 0;

  try {
    // 1. Process unprocessed events first
    console.log('📋 Processing unprocessed events');
    const eventResults = await eventsService.processEvents('system'); // Would need company context
    console.log(
      `Processed ${eventResults.processed} events, ${eventResults.errors} errors`
    );

    // 2. Run recognition for previous month (dry run first)
    console.log(
      `💰 Running recognition for ${year}-${month.toString().padStart(2, '0')}`
    );

    // Dry run first
    const dryRunResult = await recognitionService.runRecognition(
      'system', // Would need company context
      'system',
      {
        year,
        month,
        dry_run: true,
      }
    );

    console.log(
      `Dry run completed: ${dryRunResult.lines_created} lines, ${dryRunResult.total_amount} total amount`
    );

    // If dry run successful, run actual recognition
    if (dryRunResult.lines_created > 0) {
      const actualResult = await recognitionService.runRecognition(
        'system', // Would need company context
        'system',
        {
          year,
          month,
          dry_run: false,
        }
      );

      console.log(
        `Recognition completed: ${actualResult.lines_created} lines posted`
      );
      processedCount++;
    }

    // 3. Generate RPO snapshot for month-end
    console.log('📊 Generating RPO snapshot');
    const snapshotResult = await rpoService.createSnapshot(
      'system', // Would need company context
      'system',
      {
        as_of_date: `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
        currency: 'USD', // Would need company currency
      }
    );

    console.log(`RPO snapshot created: ${snapshotResult.total_rpo} total RPO`);

    return ok({
      success: true,
      message: 'Monthly revenue recognition completed',
      stats: {
        year,
        month,
        events_processed: eventResults.processed,
        events_errors: eventResults.errors,
        recognition_lines: dryRunResult.lines_created,
        recognition_amount: dryRunResult.total_amount,
        rpo_total: snapshotResult.total_rpo,
        processed_count: processedCount,
        error_count: errorCount,
      },
    });
  } catch (error) {
    console.error(`Error in monthly revenue recognition:`, error);
    errorCount++;

    return badRequest(
      `Monthly revenue recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
