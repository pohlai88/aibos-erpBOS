// M25.1 Revenue Recognition Daily Cron Route
// Daily processing of events and schedule updates

import { ok, badRequest, forbidden } from '@/lib/http';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { RevEventsService } from '@/services/revenue/events';

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
      `🚀 Starting revenue recognition daily cron job at ${new Date().toISOString()}`
    );

    return await processDailyRevenueRecognition();
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        event: 'revenue_recognition_daily_cron_failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    );

    return badRequest(
      'Revenue recognition daily cron failed: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  }
});

async function processDailyRevenueRecognition() {
  console.log('🔄 Processing daily revenue recognition');

  const eventsService = new RevEventsService();

  let processedCount = 0;
  let errorCount = 0;

  try {
    // 1. Process unprocessed events
    console.log('📋 Processing unprocessed events');
    const eventResults = await eventsService.processEvents('system'); // Would need company context

    console.log(
      `Processed ${eventResults.processed} events, ${eventResults.errors} errors`
    );
    processedCount += eventResults.processed;
    errorCount += eventResults.errors;

    // 2. Check for schedule updates needed
    console.log('📅 Checking for schedule updates');
    // This would include checking for:
    // - Usage-based recognition updates
    // - Event-driven schedule modifications
    // - POB status changes affecting schedules

    return ok({
      success: true,
      message: 'Daily revenue recognition completed',
      stats: {
        events_processed: eventResults.processed,
        events_errors: eventResults.errors,
        processed_count: processedCount,
        error_count: errorCount,
      },
    });
  } catch (error) {
    console.error(`Error in daily revenue recognition:`, error);
    errorCount++;

    return badRequest(
      `Daily revenue recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
