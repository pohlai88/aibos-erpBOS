// M15.2 Phase 3: Event-Driven Architecture
// Redis-based event queue for horizontal scaling

// import { Redis } from 'ioredis'; // Commented out for now - would need ioredis package
import { pool } from "../../lib/db";
import { evaluateCashAlerts, dispatchCashNotifications } from "./alerts";
import { ErrorHandler } from "./error-handling";
import { observability } from "./observability";

export interface CashAlertEvent {
    id: string;
    company_id: string;
    timezone: string;
    scenario_code: string;
    year: number;
    month: number;
    scheduled_at: string;
    priority: 'high' | 'medium' | 'low';
    retry_count: number;
    max_retries: number;
}

export interface EventProcessorConfig {
    redis_url: string;
    queue_name: string;
    worker_count: number;
    batch_size: number;
    poll_interval_ms: number;
    max_retries: number;
    retry_delay_ms: number;
}

export class EventDrivenCashAlertsProcessor {
    private redis: any; // Using any for now - would be Redis type with ioredis package
    private config: EventProcessorConfig;
    private errorHandler = new ErrorHandler();
    private isProcessing = false;
    private workers: Promise<void>[] = [];

    constructor(config: EventProcessorConfig) {
        this.config = config;
        // this.redis = new Redis(config.redis_url); // Would need ioredis package
        this.redis = null; // Placeholder for now
    }

    // Producer: Queue individual company evaluations
    async queueCompanyAlerts(companies: Array<{
        id: string;
        timezone: string;
        cash_version_code: string | null;
    }>): Promise<{ queued: number; failed: number }> {
        let queued = 0;
        let failed = 0;

        for (const company of companies) {
            try {
                const scenarioCode = company.cash_version_code || await this.getLastApprovedCashVersion(company.id);

                const event: CashAlertEvent = {
                    id: `cash_alert_${company.id}_${Date.now()}`,
                    company_id: company.id,
                    timezone: company.timezone,
                    scenario_code: scenarioCode!,
                    year: this.getLocalYear(company.timezone),
                    month: this.getLocalMonth(company.timezone),
                    scheduled_at: new Date().toISOString(),
                    priority: 'medium',
                    retry_count: 0,
                    max_retries: this.config.max_retries,
                };

                if (!event.scenario_code) {
                    console.warn(`⚠️ No cash version configured for company ${company.id}, skipping`);
                    failed++;
                    continue;
                }

                // Add to Redis queue with priority
                await this.redis.lpush(this.config.queue_name, JSON.stringify(event));
                queued++;

                console.log(`📤 Queued cash alert for company ${company.id}`);

            } catch (error) {
                console.error(`❌ Failed to queue company ${company.id}:`, error);
                failed++;
            }
        }

        return { queued, failed };
    }

    // Consumer: Process events from queue
    async startWorkers(): Promise<void> {
        if (this.isProcessing) {
            console.log('⚠️ Workers already running');
            return;
        }

        this.isProcessing = true;
        console.log(`🚀 Starting ${this.config.worker_count} event workers`);

        // Start multiple workers
        for (let i = 0; i < this.config.worker_count; i++) {
            const workerPromise = this.runWorker(`worker-${i}`);
            this.workers.push(workerPromise);
        }

        // Wait for all workers to complete (they run indefinitely)
        await Promise.all(this.workers);
    }

    async stopWorkers(): Promise<void> {
        console.log('🛑 Stopping event workers...');
        this.isProcessing = false;

        // Workers will stop on next poll when isProcessing is false
        await Promise.allSettled(this.workers);
        this.workers = [];
    }

    private async runWorker(workerId: string): Promise<void> {
        console.log(`👷 Worker ${workerId} started`);

        while (this.isProcessing) {
            try {
                // Poll for events
                const events = await this.pollEvents();

                if (events.length > 0) {
                    console.log(`📥 Worker ${workerId} processing ${events.length} events`);

                    // Process events in parallel
                    const promises = events.map(event => this.processEvent(event, workerId));
                    await Promise.allSettled(promises);
                } else {
                    // No events, wait before next poll
                    await this.sleep(this.config.poll_interval_ms);
                }

            } catch (error) {
                console.error(`❌ Worker ${workerId} error:`, error);
                await this.sleep(this.config.poll_interval_ms);
            }
        }

        console.log(`👷 Worker ${workerId} stopped`);
    }

    private async pollEvents(): Promise<CashAlertEvent[]> {
        const events: CashAlertEvent[] = [];

        // Use blocking pop to get events
        const result = await this.redis.brpop(this.config.queue_name, 1);

        if (result) {
            try {
                const event = JSON.parse(result[1]) as CashAlertEvent;
                events.push(event);
            } catch (error) {
                console.error('❌ Failed to parse event:', error);
            }
        }

        return events;
    }

    private async processEvent(event: CashAlertEvent, workerId: string): Promise<void> {
        const startTime = Date.now();

        try {
            console.log(`🔄 Worker ${workerId} processing event ${event.id} for company ${event.company_id}`);

            // Evaluate alerts
            const result = await this.errorHandler.executeWithErrorHandling(
                () => evaluateCashAlerts(
                    event.company_id,
                    event.scenario_code,
                    { year: event.year, month: event.month }
                ),
                'database',
                `evaluate_alerts_${event.company_id}`
            );

            // Dispatch notifications
            await this.errorHandler.executeWithErrorHandling(
                () => dispatchCashNotifications(event.company_id, result.breaches),
                'external_api',
                `dispatch_notifications_${event.company_id}`
            );

            const duration = Date.now() - startTime;

            console.log(JSON.stringify({
                level: 'INFO',
                event: 'cash_alert_processed',
                worker_id: workerId,
                event_id: event.id,
                company_id: event.company_id,
                breaches_count: result.breaches.length,
                duration_ms: duration,
                timestamp: new Date().toISOString(),
            }));

        } catch (error) {
            const duration = Date.now() - startTime;

            console.error(JSON.stringify({
                level: 'ERROR',
                event: 'cash_alert_processing_failed',
                worker_id: workerId,
                event_id: event.id,
                company_id: event.company_id,
                error: error instanceof Error ? error.message : String(error),
                duration_ms: duration,
                timestamp: new Date().toISOString(),
            }));

            // Retry logic
            await this.handleRetry(event, workerId);
        }
    }

    private async handleRetry(event: CashAlertEvent, workerId: string): Promise<void> {
        if (event.retry_count >= event.max_retries) {
            console.error(`❌ Max retries exceeded for event ${event.id}, giving up`);
            return;
        }

        // Increment retry count
        event.retry_count++;

        // Calculate delay with exponential backoff
        const delay = this.config.retry_delay_ms * Math.pow(2, event.retry_count - 1);

        console.log(`🔄 Retrying event ${event.id} (attempt ${event.retry_count}/${event.max_retries}) in ${delay}ms`);

        // Schedule retry
        setTimeout(async () => {
            try {
                await this.redis.lpush(this.config.queue_name, JSON.stringify(event));
            } catch (error) {
                console.error(`❌ Failed to requeue event ${event.id}:`, error);
            }
        }, delay);
    }

    // Queue management
    async getQueueStats(): Promise<{
        queue_length: number;
        workers_running: number;
        is_processing: boolean;
    }> {
        const queueLength = await this.redis.llen(this.config.queue_name);

        return {
            queue_length: queueLength,
            workers_running: this.workers.length,
            is_processing: this.isProcessing,
        };
    }

    async clearQueue(): Promise<void> {
        await this.redis.del(this.config.queue_name);
        console.log('🧹 Queue cleared');
    }

    // Health check
    async healthCheck(): Promise<{
        redis_connected: boolean;
        queue_accessible: boolean;
        workers_running: number;
    }> {
        try {
            await this.redis.ping();
            await this.redis.llen(this.config.queue_name);

            return {
                redis_connected: true,
                queue_accessible: true,
                workers_running: this.workers.length,
            };
        } catch (error) {
            return {
                redis_connected: false,
                queue_accessible: false,
                workers_running: 0,
            };
        }
    }

    // Utility methods
    private async getLastApprovedCashVersion(companyId: string): Promise<string | null> {
        try {
            const query = `
        SELECT code 
        FROM cash_forecast_version 
        WHERE company_id = $1 AND status = 'approved'
        ORDER BY updated_at DESC 
        LIMIT 1
      `;

            const result = await pool.query(query, [companyId]);
            return result.rows[0]?.code || null;
        } catch (error) {
            console.error(`❌ Failed to get cash version for company ${companyId}:`, error);
            return null;
        }
    }

    private getLocalYear(timezone: string): number {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
        });

        const parts = Object.fromEntries(
            formatter.formatToParts(now).map(p => [p.type, p.value])
        );

        return Number(parts.year);
    }

    private getLocalMonth(timezone: string): number {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            month: '2-digit',
        });

        const parts = Object.fromEntries(
            formatter.formatToParts(now).map(p => [p.type, p.value])
        );

        return Number(parts.month);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cleanup
    async destroy(): Promise<void> {
        await this.stopWorkers();
        await this.redis.quit();
    }
}

// Global event processor instance
export const eventProcessor = new EventDrivenCashAlertsProcessor({
    redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
    queue_name: 'cash_alerts_queue',
    worker_count: parseInt(process.env.CASH_ALERTS_WORKERS || '3'),
    batch_size: parseInt(process.env.CASH_ALERTS_BATCH_SIZE || '10'),
    poll_interval_ms: parseInt(process.env.CASH_ALERTS_POLL_INTERVAL || '1000'),
    max_retries: parseInt(process.env.CASH_ALERTS_MAX_RETRIES || '3'),
    retry_delay_ms: parseInt(process.env.CASH_ALERTS_RETRY_DELAY || '5000'),
});
