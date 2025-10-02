// M15.2 Phase 3: Enterprise Scale Cash Alerts Processor
// High-performance batch processing with database optimization, smart caching, comprehensive observability,
// event-driven architecture, and horizontal scaling considerations.

import { pool } from "../../lib/db";
import { evaluateCashAlerts, dispatchCashNotifications } from "./alerts";
import { ErrorHandler, EvaluationError } from "./error-handling";
import { performanceMonitor, HealthChecker } from "./monitoring";
import { cashAlertsCache } from "./smart-cache";
import { observability } from "./observability";
import { EventDrivenCashAlertsProcessor } from "./event-processor";
import { HorizontalScalingManager } from "./scaling-manager";
import { AdvancedMonitoring } from "./advanced-monitoring";

export interface CompanyConfig {
    id: string;
    timezone: string;
    cash_version_code: string | null;
    is_active: boolean;
}

export interface ProcessingResult {
    company_id: string;
    success: boolean;
    breaches_count: number;
    duration_ms: number;
    error?: string;
    error_code?: string;
    cache_hit?: boolean;
    processed_by_worker?: string;
}

export interface BatchProcessingOptions {
    batchSize: number;
    maxConcurrent: number;
    retryAttempts: number;
    retryDelayMs: number;
    useCache: boolean;
    useMaterializedView: boolean;
    useEventDriven?: boolean; // New option for Phase 3
}

const ENTERPRISE_DEFAULT_OPTIONS: BatchProcessingOptions = {
    batchSize: 50,
    maxConcurrent: 5,
    retryAttempts: 3,
    retryDelayMs: 1000,
    useCache: true,
    useMaterializedView: true,
    useEventDriven: false,
};

export class EnterpriseCashAlertsProcessor {
    private errorHandler = new ErrorHandler();
    private healthChecker = new HealthChecker(performanceMonitor.getMetrics());
    private eventProcessor: EventDrivenCashAlertsProcessor | undefined;
    private scalingManager: HorizontalScalingManager | undefined;
    private advancedMonitoring: AdvancedMonitoring;

    constructor(private options: BatchProcessingOptions = ENTERPRISE_DEFAULT_OPTIONS) {
        if (this.options.useEventDriven) {
            // Assuming Redis URL and other configs are available via environment or a config service
            this.eventProcessor = new EventDrivenCashAlertsProcessor({
                redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
                queue_name: 'cash_alerts_queue',
                worker_count: 5, // Default number of workers
                batch_size: 10,
                poll_interval_ms: 1000,
                max_retries: 5,
                retry_delay_ms: 5000,
            });
            this.scalingManager = new HorizontalScalingManager({
                min_workers: 1,
                max_workers: 10,
                scale_up_threshold: 100,
                scale_down_threshold: 10,
                scale_check_interval_ms: 30000, // Check every 30 seconds
                worker_startup_time_ms: 5000,
                worker_shutdown_time_ms: 10000,
            }, {
                strategy: 'least_connections',
                health_check_interval_ms: 10000,
                unhealthy_threshold: 3,
            });
        }
        this.advancedMonitoring = new AdvancedMonitoring();
    }

    async processDailyAlerts(): Promise<{
        total_companies: number;
        successful: number;
        failed: number;
        total_duration_ms: number;
        results: ProcessingResult[];
        health_status: any;
        cache_stats: any;
        performance_metrics: any;
        advanced_metrics: any;
        scaling_status?: any;
    }> {
        return await observability.traceOperation(
            'process_daily_alerts',
            async () => {
                const startTime = Date.now();
                console.log(`🚀 Starting enterprise cash alerts processing with batch size ${this.options.batchSize}`);

                try {
                    // Health check before processing
                    const healthStatus = await this.healthChecker.checkHealth();
                    if (healthStatus.status === 'unhealthy') {
                        throw new Error('System health check failed - aborting processing');
                    }

                    // 1. Fetch all active companies
                    const companies = await this.getActiveCompanies();
                    console.log(`📊 Found ${companies.length} active companies to process`);

                    if (companies.length === 0) {
                        return {
                            total_companies: 0,
                            successful: 0,
                            failed: 0,
                            total_duration_ms: Date.now() - startTime,
                            results: [],
                            health_status: healthStatus,
                            cache_stats: cashAlertsCache.getCacheStats(),
                            performance_metrics: performanceMonitor.getMetrics().getPerformanceMetrics('cash_alerts'),
                            advanced_metrics: this.advancedMonitoring.getMetrics(),
                        };
                    }

                    let results: ProcessingResult[] = [];
                    let scalingStatus: any;

                    // Phase 1 & 2: Batch processing (event-driven not fully implemented yet)
                    console.log('📦 Using batch processing...');
                    results = await this.processInBatches(companies);

                    // 3. Calculate metrics
                    const successful = results.filter(r => r.success).length;
                    const failed = results.filter(r => !r.success).length;
                    const totalDuration = Date.now() - startTime;

                    // 4. Log summary with structured logging
                    console.log(JSON.stringify({
                        level: 'INFO',
                        event: 'enterprise_cash_alerts_processing_complete',
                        total_companies: companies.length,
                        successful,
                        failed,
                        duration_ms: totalDuration,
                        success_rate: successful / companies.length,
                        batch_size: this.options.batchSize,
                        max_concurrent: this.options.maxConcurrent,
                        cache_enabled: this.options.useCache,
                        materialized_view_enabled: this.options.useMaterializedView,
                        event_driven_enabled: this.options.useEventDriven,
                    }));

                    return {
                        total_companies: companies.length,
                        successful,
                        failed,
                        total_duration_ms: totalDuration,
                        results,
                        health_status: healthStatus,
                        cache_stats: cashAlertsCache.getCacheStats(),
                        performance_metrics: performanceMonitor.getMetrics().getPerformanceMetrics('cash_alerts'),
                        advanced_metrics: this.advancedMonitoring.getMetrics(),
                        scaling_status: scalingStatus,
                    };

                } catch (error) {
                    console.error(JSON.stringify({
                        level: 'ERROR',
                        event: 'enterprise_cash_alerts_processing_failed',
                        error: error instanceof Error ? error.message : String(error),
                        duration_ms: Date.now() - startTime,
                    }));
                    throw error;
                }
            },
            {
                batch_size: this.options.batchSize,
                max_concurrent: this.options.maxConcurrent,
                use_cache: this.options.useCache,
                use_materialized_view: this.options.useMaterializedView,
                use_event_driven: this.options.useEventDriven,
            }
        );
    }

    private async getActiveCompanies(): Promise<CompanyConfig[]> {
        return await this.errorHandler.executeWithErrorHandling(
            async () => {
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
            },
            'database',
            'fetch_active_companies'
        );
    }

    private async processInBatches(companies: CompanyConfig[]): Promise<ProcessingResult[]> {
        const batches = this.chunkArray(companies, this.options.batchSize);
        const allResults: ProcessingResult[] = [];

        console.log(`📦 Processing ${companies.length} companies in ${batches.length} batches`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            if (!batch) continue;
            console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} companies)`);

            // Process batch with controlled concurrency
            const batchResults = await this.processBatchWithConcurrency(batch);
            allResults.push(...batchResults);

            // Rate limiting between batches
            if (i < batches.length - 1) {
                await this.sleep(100);
            }
        }

        return allResults;
    }

    private async processBatchWithConcurrency(batch: CompanyConfig[]): Promise<ProcessingResult[]> {
        const concurrentBatches = this.chunkArray(batch, this.options.maxConcurrent);
        const results: ProcessingResult[] = [];

        for (const concurrentBatch of concurrentBatches) {
            const promises = concurrentBatch.map(company =>
                this.processCompanyWithRetry(company)
            );

            const batchResults = await Promise.allSettled(promises);

            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error("❌ Batch processing error:", result.reason);
                    // Create error result
                    results.push({
                        company_id: 'unknown',
                        success: false,
                        breaches_count: 0,
                        duration_ms: 0,
                        error: result.reason?.message || 'Unknown error',
                        error_code: 'BATCH_PROCESSING_ERROR',
                        cache_hit: false,
                    });
                }
            }
        }

        return results;
    }

    private async processCompanyWithRetry(company: CompanyConfig): Promise<ProcessingResult> {
        const startTime = Date.now();
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
            try {
                const result = await this.processCompany(company);
                const duration = Date.now() - startTime;

                return {
                    company_id: company.id,
                    success: true,
                    breaches_count: result.breaches.length,
                    duration_ms: duration,
                    cache_hit: result.cache_hit || false,
                };

            } catch (error) {
                lastError = error as Error;
                console.warn(`⚠️ Attempt ${attempt}/${this.options.retryAttempts} failed for company ${company.id}:`, error);

                if (attempt < this.options.retryAttempts) {
                    await this.sleep(this.options.retryDelayMs * attempt); // Exponential backoff
                }
            }
        }

        const duration = Date.now() - startTime;
        return {
            company_id: company.id,
            success: false,
            breaches_count: 0,
            duration_ms: duration,
            error: lastError?.message || 'Max retries exceeded',
            error_code: lastError?.constructor.name || 'RETRY_EXHAUSTED',
            cache_hit: false,
        };
    }

    private async processCompany(company: CompanyConfig): Promise<{ breaches: any[]; cache_hit?: boolean }> {
        return await observability.traceOperation(
            'process_company',
            async () => {
                // Resolve cash version code with caching
                let scenarioCode = company.cash_version_code;
                if (!scenarioCode) {
                    scenarioCode = await this.getLastApprovedCashVersion(company.id);
                    if (!scenarioCode) {
                        throw new EvaluationError(
                            `No cash version configured for company ${company.id}`,
                            company.id,
                            { timezone: company.timezone }
                        );
                    }
                }

                // Get local period
                const period = this.getLocalPeriod(company.timezone);

                // Evaluate alerts with optimization
                const evalResult = await this.evaluateAlertsOptimized(company.id, scenarioCode, period);

                // Dispatch notifications with error handling
                await this.errorHandler.executeWithErrorHandling(
                    () => dispatchCashNotifications(company.id, evalResult.breaches),
                    'external_api',
                    `dispatch_notifications_${company.id}`
                );

                return evalResult;
            },
            {
                company_id: company.id,
                timezone: company.timezone,
                scenario_code: company.cash_version_code || 'auto-resolved',
                period: this.getLocalPeriod(company.timezone)
            }
        );
    }

    private async evaluateAlertsOptimized(
        companyId: string,
        scenarioCode: string,
        period: { year: number; month: number }
    ): Promise<{ breaches: any[]; cache_hit?: boolean }> {
        if (this.options.useMaterializedView) {
            return await this.evaluateAlertsWithMaterializedView(companyId, scenarioCode, period);
        } else if (this.options.useCache) {
            return await this.evaluateAlertsWithCache(companyId, scenarioCode, period);
        } else {
            // Fallback to original method
            const result = await this.errorHandler.executeWithErrorHandling(
                () => evaluateCashAlerts(companyId, scenarioCode, period),
                'database',
                `evaluate_alerts_${companyId}`
            );
            return { breaches: result.breaches, cache_hit: false };
        }
    }

    private async evaluateAlertsWithMaterializedView(
        companyId: string,
        scenarioCode: string,
        period: { year: number; month: number }
    ): Promise<{ breaches: any[]; cache_hit?: boolean }> {
        return await this.errorHandler.executeWithErrorHandling(
            async () => {
                // Use the optimized database function
                const query = `
                    SELECT * FROM evaluate_cash_alerts_fast($1, $2, $3, $4)
                    WHERE breach_detected = true
                `;

                const result = await pool.query(query, [companyId, scenarioCode, period.year, period.month]);

                const breaches = result.rows.map(row => ({
                    rule_id: row.rule_id,
                    name: row.rule_name,
                    type: row.rule_type,
                    cc: row.cost_center,
                    project: row.project,
                    threshold: Number(row.threshold),
                    current_value: Number(row.current_value),
                }));

                return { breaches, cache_hit: false };
            },
            'database',
            `evaluate_alerts_materialized_${companyId}`
        );
    }

    private async evaluateAlertsWithCache(
        companyId: string,
        scenarioCode: string,
        period: { year: number; month: number }
    ): Promise<{ breaches: any[]; cache_hit?: boolean }> {
        // Get company config with caching
        const companyConfig = await cashAlertsCache.getCompanyConfig(companyId);
        if (!companyConfig) {
            throw new EvaluationError(`Company ${companyId} not found`, companyId);
        }

        // Get alert rules with caching
        const alertRules = await cashAlertsCache.getAlertRules(companyId);

        // Get cash metrics with caching
        const cashMetrics = await cashAlertsCache.getCashMetrics(
            companyId,
            scenarioCode,
            period.year,
            period.month
        );

        if (!cashMetrics) {
            throw new EvaluationError(`No cash metrics found for company ${companyId}`, companyId);
        }

        // Evaluate rules against cached metrics
        const breaches = alertRules
            .filter(rule => {
                switch (rule.type) {
                    case 'min_cash':
                        return cashMetrics.cumulative_balance < Number(rule.threshold_num);
                    case 'max_burn':
                        return cashMetrics.avg_burn_rate_3m > Number(rule.threshold_num);
                    case 'runway_months':
                        return cashMetrics.runway_months < Number(rule.threshold_num);
                    default:
                        return false;
                }
            })
            .map(rule => ({
                rule_id: rule.id,
                name: rule.name,
                type: rule.type,
                cc: rule.filter_cc,
                project: rule.filter_project,
                threshold: Number(rule.threshold_num),
                current_value: rule.type === 'min_cash' ? cashMetrics.cumulative_balance :
                    rule.type === 'max_burn' ? cashMetrics.avg_burn_rate_3m :
                        cashMetrics.runway_months,
            }));

        return { breaches, cache_hit: true };
    }

    private async getLastApprovedCashVersion(companyId: string): Promise<string | null> {
        return await this.errorHandler.executeWithErrorHandling(
            async () => {
                const query = `
                    SELECT code
                    FROM cash_forecast_version
                    WHERE company_id = $1 AND status = 'approved'
                    ORDER BY updated_at DESC
                    LIMIT 1
                `;

                const result = await pool.query(query, [companyId]);
                return result.rows[0]?.code || null;
            },
            'database',
            `get_cash_version_${companyId}`
        );
    }

    private getLocalPeriod(timezone: string): { year: number; month: number } {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
        });

        const parts = Object.fromEntries(
            formatter.formatToParts(now).map(p => [p.type, p.value])
        );

        return {
            year: Number(parts.year),
            month: Number(parts.month),
        };
    }

    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Enhanced health and metrics methods
    async getHealthStatus() {
        return await this.healthChecker.checkHealth();
    }

    getPerformanceMetrics() {
        return performanceMonitor.getMetrics().getPerformanceMetrics('cash_alerts');
    }

    getCircuitBreakerStates() {
        return {
            database: this.errorHandler.getCircuitBreakerState('database'),
            external_api: this.errorHandler.getCircuitBreakerState('external_api'),
        };
    }

    getCacheStats() {
        return cashAlertsCache.getCacheStats();
    }

    async getDetailedMetrics() {
        return await observability.getDetailedMetrics();
    }

    async getDashboardData() {
        return await observability.getDashboardData();
    }

    // Cache management
    invalidateCompanyCache(companyId: string) {
        cashAlertsCache.invalidateCompanyCache(companyId);
    }

    clearAllCaches() {
        cashAlertsCache.clearAll();
    }

    // Phase 3 specific methods
    async startEventProcessorAndScalingManager() {
        if (this.eventProcessor && this.scalingManager) {
            await this.eventProcessor.startWorkers();
            await this.scalingManager.start();
            console.log('Event processor and scaling manager started.');
        } else {
            console.warn('Event processor or scaling manager not initialized.');
        }
    }

    async stopEventProcessorAndScalingManager() {
        if (this.eventProcessor && this.scalingManager) {
            await this.eventProcessor.stopWorkers();
            await this.scalingManager.stop();
            console.log('Event processor and scaling manager stopped.');
        } else {
            console.warn('Event processor or scaling manager not initialized.');
        }
    }
}