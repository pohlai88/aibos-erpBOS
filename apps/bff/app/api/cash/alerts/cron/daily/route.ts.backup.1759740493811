// M15.2 Phase 3: Enterprise Cash Alerts Cron Route
// Production-ready cron endpoint with all optimization phases

import { ok, badRequest, forbidden } from '../../../../../lib/http';
import { requireAuth, requireCapability } from '../../../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../../../lib/route-utils';
import { EnterpriseCashAlertsProcessor } from '../../../../../services/cash/optimized-processor';

export const GET = withRouteErrors(async (req: Request) => {
  try {
    // Optional: Add internal token validation for cron security
    const authHeader = req.headers.get('authorization');
    const internalToken = req.headers.get('x-internal-token');

    // For now, allow any authenticated user with cash:manage capability
    // In production, you might want to restrict this to internal services only
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;
    await requireCapability(auth, 'cash:manage');

    console.log(
      `🚀 Starting enterprise cash alerts cron job at ${new Date().toISOString()}`
    );

    // Use enhanced processor architecture
    return await processWithEnhancedProcessor();
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        event: 'enterprise_cash_alerts_cron_failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    );

    return badRequest(
      'Enterprise cash alerts cron failed: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  }
});

async function processWithEnhancedProcessor() {
  console.log('🔄 Using enhanced processor architecture');

  // Initialize processor with optimized settings
  const processor = new EnterpriseCashAlertsProcessor({
    batchSize: 50, // Process 50 companies per batch
    maxConcurrent: 5, // Max 5 concurrent operations per batch
    retryAttempts: 3, // Retry failed operations 3 times
    retryDelayMs: 1000, // Base delay of 1 second between retries
    useCache: true, // Enable smart caching
    useMaterializedView: true, // Use materialized views for performance
  });

  // Process all companies
  const result = await processor.processDailyAlerts();

  // Get detailed metrics
  const detailedMetrics = await processor.getDetailedMetrics();
  const dashboardData = await processor.getDashboardData();

  // Log structured results
  console.log(
    JSON.stringify({
      level: 'INFO',
      event: 'enhanced_cash_alerts_cron_complete',
      timestamp: new Date().toISOString(),
      total_companies: result.total_companies,
      successful: result.successful,
      failed: result.failed,
      duration_ms: result.total_duration_ms,
      success_rate: result.successful / result.total_companies,
      cache_enabled: true,
      materialized_view_enabled: true,
    })
  );

  return ok({
    success: true,
    architecture: 'enhanced_processor',
    timestamp: new Date().toISOString(),
    summary: {
      total_companies: result.total_companies,
      successful: result.successful,
      failed: result.failed,
      duration_ms: result.total_duration_ms,
      success_rate: result.successful / result.total_companies,
    },
    health_status: result.health_status,
    cache_stats: result.cache_stats,
    performance_metrics: result.performance_metrics,
    circuit_breakers: processor.getCircuitBreakerStates(),
    detailed_metrics: detailedMetrics,
    dashboard_data: dashboardData,
  });
}

async function getActiveCompanies() {
  const { pool } = await import('../../../../../lib/db');

  const query = `
    SELECT 
      c.id,
      COALESCE(cs.timezone, 'Asia/Ho_Chi_Minh') as timezone,
      cs.cash_version_code,
      c.is_active
    FROM company c
    LEFT JOIN company_settings cs ON cs.company_id = c.id
    WHERE c.is_active = true
    ORDER BY c.id
  `;

  const result = await pool.query(query);
  return result.rows.map(row => ({
    id: row.id,
    timezone: row.timezone,
    cash_version_code: row.cash_version_code,
    is_active: row.is_active,
  }));
}

// Optional: POST endpoint for manual triggering with custom parameters
export const POST = withRouteErrors(async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;
    await requireCapability(auth, 'cash:manage');

    const body = await req.json().catch(() => ({}));

    // Enhanced processor with custom options
    const processor = new EnterpriseCashAlertsProcessor({
      batchSize: body.batch_size || 50,
      maxConcurrent: body.max_concurrent || 5,
      retryAttempts: body.retry_attempts || 3,
      retryDelayMs: body.retry_delay_ms || 1000,
      useCache: body.use_cache !== false,
      useMaterializedView: body.use_materialized_view !== false,
    });

    console.log(
      `🚀 Manual cash alerts processing triggered with custom options:`,
      body
    );

    const result = await processor.processDailyAlerts();

    return ok({
      success: true,
      architecture: 'enhanced_processor',
      timestamp: new Date().toISOString(),
      options_used: {
        batch_size: body.batch_size || 50,
        max_concurrent: body.max_concurrent || 5,
        retry_attempts: body.retry_attempts || 3,
        retry_delay_ms: body.retry_delay_ms || 1000,
        use_cache: body.use_cache !== false,
        use_materialized_view: body.use_materialized_view !== false,
      },
      summary: {
        total_companies: result.total_companies,
        successful: result.successful,
        failed: result.failed,
        duration_ms: result.total_duration_ms,
        success_rate: result.successful / result.total_companies,
      },
      health_status: result.health_status,
      cache_stats: result.cache_stats,
      performance_metrics: result.performance_metrics,
      circuit_breakers: processor.getCircuitBreakerStates(),
    });
  } catch (error) {
    console.error('Manual cash alerts processing failed:', error);
    return badRequest(
      'Enterprise cash alerts cron failed: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  }
});
