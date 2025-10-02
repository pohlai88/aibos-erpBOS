// M15.2 Phase 3: Horizontal Scaling Manager
// Auto-scaling and load balancing for cash alerts processing

import { EventDrivenCashAlertsProcessor, CashAlertEvent } from "./event-processor";
import { pool } from "../../lib/db";
import { observability } from "./observability";

export interface ScalingConfig {
    min_workers: number;
    max_workers: number;
    scale_up_threshold: number; // Queue length threshold to scale up
    scale_down_threshold: number; // Queue length threshold to scale down
    scale_check_interval_ms: number;
    worker_startup_time_ms: number;
    worker_shutdown_time_ms: number;
}

export interface LoadBalancerConfig {
    strategy: 'round_robin' | 'least_connections' | 'weighted';
    health_check_interval_ms: number;
    unhealthy_threshold: number;
}

export interface WorkerNode {
    id: string;
    status: 'starting' | 'running' | 'stopping' | 'stopped' | 'unhealthy';
    started_at: string;
    processed_events: number;
    failed_events: number;
    last_heartbeat: string;
    cpu_usage?: number;
    memory_usage?: number;
}

export class HorizontalScalingManager {
    private config: ScalingConfig;
    private loadBalancerConfig: LoadBalancerConfig;
    private workers = new Map<string, WorkerNode>();
    private scalingInterval?: NodeJS.Timeout;
    private healthCheckInterval?: NodeJS.Timeout;
    private isRunning = false;

    constructor(
        scalingConfig: ScalingConfig,
        loadBalancerConfig: LoadBalancerConfig
    ) {
        this.config = scalingConfig;
        this.loadBalancerConfig = loadBalancerConfig;
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Scaling manager already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting horizontal scaling manager');

        // Start with minimum workers
        await this.scaleToMinWorkers();

        // Start scaling checks
        this.scalingInterval = setInterval(async () => {
            await this.checkAndScale();
        }, this.config.scale_check_interval_ms);

        // Start health checks
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, this.loadBalancerConfig.health_check_interval_ms);

        console.log('✅ Horizontal scaling manager started');
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping horizontal scaling manager...');
        this.isRunning = false;

        // Stop intervals
        if (this.scalingInterval) {
            clearInterval(this.scalingInterval);
        }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        // Stop all workers
        await this.scaleToMinWorkers();

        console.log('✅ Horizontal scaling manager stopped');
    }

    private async scaleToMinWorkers(): Promise<void> {
        const currentWorkers = this.workers.size;
        const neededWorkers = this.config.min_workers - currentWorkers;

        if (neededWorkers > 0) {
            console.log(`📈 Scaling up to minimum workers: adding ${neededWorkers} workers`);
            await this.addWorkers(neededWorkers);
        }
    }

    private async checkAndScale(): Promise<void> {
        try {
            const queueStats = await this.getQueueStats();
            const currentWorkers = this.workers.size;
            const healthyWorkers = Array.from(this.workers.values()).filter(w => w.status === 'running').length;

            console.log(`📊 Scaling check: queue=${queueStats.queue_length}, workers=${currentWorkers}, healthy=${healthyWorkers}`);

            // Scale up if queue is too long
            if (queueStats.queue_length > this.config.scale_up_threshold && currentWorkers < this.config.max_workers) {
                const workersToAdd = Math.min(
                    Math.ceil(queueStats.queue_length / 10), // Add 1 worker per 10 queued events
                    this.config.max_workers - currentWorkers
                );

                console.log(`📈 Scaling up: adding ${workersToAdd} workers`);
                await this.addWorkers(workersToAdd);
            }

            // Scale down if queue is short and we have excess workers
            if (queueStats.queue_length < this.config.scale_down_threshold && currentWorkers > this.config.min_workers) {
                const workersToRemove = Math.min(
                    currentWorkers - this.config.min_workers,
                    Math.ceil((this.config.scale_down_threshold - queueStats.queue_length) / 5) // Remove 1 worker per 5 events under threshold
                );

                console.log(`📉 Scaling down: removing ${workersToRemove} workers`);
                await this.removeWorkers(workersToRemove);
            }

        } catch (error) {
            console.error('❌ Scaling check failed:', error);
        }
    }

    private async addWorkers(count: number): Promise<void> {
        for (let i = 0; i < count; i++) {
            const workerId = `worker-${Date.now()}-${i}`;
            await this.startWorker(workerId);
        }
    }

    private async removeWorkers(count: number): Promise<void> {
        const workersToRemove = Array.from(this.workers.entries())
            .filter(([_, worker]) => worker.status === 'running')
            .sort((a, b) => a[1].started_at.localeCompare(b[1].started_at)) // Remove oldest first
            .slice(0, count);

        for (const [workerId, _] of workersToRemove) {
            await this.stopWorker(workerId);
        }
    }

    private async startWorker(workerId: string): Promise<void> {
        const worker: WorkerNode = {
            id: workerId,
            status: 'starting',
            started_at: new Date().toISOString(),
            processed_events: 0,
            failed_events: 0,
            last_heartbeat: new Date().toISOString(),
        };

        this.workers.set(workerId, worker);

        // Simulate worker startup
        setTimeout(() => {
            const w = this.workers.get(workerId);
            if (w) {
                w.status = 'running';
                console.log(`👷 Worker ${workerId} started`);
            }
        }, this.config.worker_startup_time_ms);
    }

    private async stopWorker(workerId: string): Promise<void> {
        const worker = this.workers.get(workerId);
        if (!worker) {
            return;
        }

        worker.status = 'stopping';
        console.log(`🛑 Stopping worker ${workerId}`);

        // Simulate worker shutdown
        setTimeout(() => {
            worker.status = 'stopped';
            this.workers.delete(workerId);
            console.log(`👷 Worker ${workerId} stopped`);
        }, this.config.worker_shutdown_time_ms);
    }

    private async performHealthChecks(): Promise<void> {
        for (const [workerId, worker] of this.workers.entries()) {
            try {
                // Simulate health check
                const isHealthy = await this.checkWorkerHealth(worker);

                if (!isHealthy) {
                    console.warn(`⚠️ Worker ${workerId} is unhealthy`);
                    worker.status = 'unhealthy';

                    // Replace unhealthy worker
                    await this.stopWorker(workerId);
                    await this.startWorker(`replacement-${workerId}-${Date.now()}`);
                } else {
                    worker.last_heartbeat = new Date().toISOString();
                }

            } catch (error) {
                console.error(`❌ Health check failed for worker ${workerId}:`, error);
                worker.status = 'unhealthy';
            }
        }
    }

    private async checkWorkerHealth(worker: WorkerNode): Promise<boolean> {
        // In a real implementation, this would check actual worker health
        // For now, we'll simulate based on worker metrics

        const now = new Date();
        const lastHeartbeat = new Date(worker.last_heartbeat);
        const timeSinceHeartbeat = now.getTime() - lastHeartbeat.getTime();

        // Consider worker unhealthy if no heartbeat for 2 minutes
        if (timeSinceHeartbeat > 2 * 60 * 1000) {
            return false;
        }

        // Consider worker unhealthy if failure rate is too high
        const totalEvents = worker.processed_events + worker.failed_events;
        if (totalEvents > 10 && worker.failed_events / totalEvents > 0.5) {
            return false;
        }

        return true;
    }

    private async getQueueStats(): Promise<{ queue_length: number }> {
        // In a real implementation, this would query the actual queue
        // For now, we'll simulate based on worker activity
        const totalProcessed = Array.from(this.workers.values())
            .reduce((sum, worker) => sum + worker.processed_events, 0);

        // Simulate queue length based on processing rate
        const queueLength = Math.max(0, totalProcessed - (this.workers.size * 10));

        return { queue_length: queueLength };
    }

    // Load balancing
    async distributeEvent(event: CashAlertEvent): Promise<string> {
        const strategy = this.loadBalancerConfig.strategy;
        const healthyWorkers = Array.from(this.workers.values())
            .filter(w => w.status === 'running');

        if (healthyWorkers.length === 0) {
            throw new Error('No healthy workers available');
        }

        let selectedWorker: WorkerNode | undefined;

        switch (strategy) {
            case 'round_robin':
                selectedWorker = this.roundRobinSelection(healthyWorkers);
                break;
            case 'least_connections':
                selectedWorker = this.leastConnectionsSelection(healthyWorkers);
                break;
            case 'weighted':
                selectedWorker = this.weightedSelection(healthyWorkers);
                break;
            default:
                selectedWorker = healthyWorkers[0];
        }

        return selectedWorker?.id || '';
    }

    private roundRobinSelection(workers: WorkerNode[]): WorkerNode | undefined {
        // Simple round-robin selection
        const index = Math.floor(Math.random() * workers.length);
        return workers[index];
    }

    private leastConnectionsSelection(workers: WorkerNode[]): WorkerNode | undefined {
        return workers.reduce((min, worker) =>
            worker.processed_events < min.processed_events ? worker : min
        );
    }

    private weightedSelection(workers: WorkerNode[]): WorkerNode | undefined {
        // Weight based on success rate and current load
        const weights = workers.map(worker => {
            const totalEvents = worker.processed_events + worker.failed_events;
            const successRate = totalEvents > 0 ? worker.processed_events / totalEvents : 1;
            const loadFactor = worker.processed_events / 100; // Normalize load
            return successRate - loadFactor;
        });

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < workers.length; i++) {
            random -= weights[i] || 0;
            if (random <= 0) {
                return workers[i];
            }
        }

        return workers[0];
    }

    // Monitoring and metrics
    getScalingMetrics(): {
        current_workers: number;
        healthy_workers: number;
        unhealthy_workers: number;
        total_processed_events: number;
        total_failed_events: number;
        average_success_rate: number;
    } {
        const workers = Array.from(this.workers.values());
        const healthyWorkers = workers.filter(w => w.status === 'running').length;
        const unhealthyWorkers = workers.filter(w => w.status === 'unhealthy').length;

        const totalProcessed = workers.reduce((sum, w) => sum + w.processed_events, 0);
        const totalFailed = workers.reduce((sum, w) => sum + w.failed_events, 0);
        const totalEvents = totalProcessed + totalFailed;
        const averageSuccessRate = totalEvents > 0 ? totalProcessed / totalEvents : 1;

        return {
            current_workers: workers.length,
            healthy_workers: healthyWorkers,
            unhealthy_workers: unhealthyWorkers,
            total_processed_events: totalProcessed,
            total_failed_events: totalFailed,
            average_success_rate: averageSuccessRate,
        };
    }

    async getDetailedMetrics(): Promise<{
        scaling: any;
        workers: WorkerNode[];
        queue_stats: any;
        system_metrics: any;
    }> {
        const scalingMetrics = this.getScalingMetrics();
        const queueStats = await this.getQueueStats();
        const systemMetrics = await observability.getDetailedMetrics();

        return {
            scaling: scalingMetrics,
            workers: Array.from(this.workers.values()),
            queue_stats: queueStats,
            system_metrics: systemMetrics,
        };
    }

    // Configuration updates
    updateScalingConfig(newConfig: Partial<ScalingConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('📝 Scaling configuration updated');
    }

    updateLoadBalancerConfig(newConfig: Partial<LoadBalancerConfig>): void {
        this.loadBalancerConfig = { ...this.loadBalancerConfig, ...newConfig };
        console.log('📝 Load balancer configuration updated');
    }
}

// Global scaling manager instance
export const scalingManager = new HorizontalScalingManager(
    {
        min_workers: parseInt(process.env.MIN_WORKERS || '2'),
        max_workers: parseInt(process.env.MAX_WORKERS || '10'),
        scale_up_threshold: parseInt(process.env.SCALE_UP_THRESHOLD || '50'),
        scale_down_threshold: parseInt(process.env.SCALE_DOWN_THRESHOLD || '10'),
        scale_check_interval_ms: parseInt(process.env.SCALE_CHECK_INTERVAL || '30000'),
        worker_startup_time_ms: parseInt(process.env.WORKER_STARTUP_TIME || '5000'),
        worker_shutdown_time_ms: parseInt(process.env.WORKER_SHUTDOWN_TIME || '3000'),
    },
    {
        strategy: (process.env.LOAD_BALANCER_STRATEGY as any) || 'least_connections',
        health_check_interval_ms: parseInt(process.env.HEALTH_CHECK_INTERVAL || '10000'),
        unhealthy_threshold: parseInt(process.env.UNHEALTHY_THRESHOLD || '3'),
    }
);
