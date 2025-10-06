// M15.2 Phase 1: Basic Monitoring & Metrics Collection
// Production-ready monitoring with structured logging

export interface MetricsData {
  timestamp: string;
  operation: string;
  company_id?: string;
  duration_ms: number;
  success: boolean;
  error_code?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  average_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  error_rate: number;
}

export class MetricsCollector {
  private metrics: MetricsData[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics in memory

  record(operation: string, data: Partial<MetricsData>): void {
    const metric: MetricsData = {
      timestamp: new Date().toISOString(),
      operation,
      duration_ms: data.duration_ms || 0,
      success: data.success || false,
      ...data,
    };

    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log structured metrics
    console.log(
      JSON.stringify({
        level: metric.success ? 'INFO' : 'ERROR',
        timestamp: metric.timestamp,
        operation: metric.operation,
        company_id: metric.company_id,
        duration_ms: metric.duration_ms,
        success: metric.success,
        error_code: metric.error_code,
        metadata: metric.metadata,
      })
    );
  }

  getPerformanceMetrics(
    operation?: string,
    timeWindowMs?: number
  ): PerformanceMetrics {
    let filteredMetrics = this.metrics;

    // Filter by operation if specified
    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    // Filter by time window if specified
    if (timeWindowMs) {
      const cutoffTime = Date.now() - timeWindowMs;
      filteredMetrics = filteredMetrics.filter(
        m => new Date(m.timestamp).getTime() > cutoffTime
      );
    }

    if (filteredMetrics.length === 0) {
      return {
        total_operations: 0,
        successful_operations: 0,
        failed_operations: 0,
        average_duration_ms: 0,
        p95_duration_ms: 0,
        p99_duration_ms: 0,
        error_rate: 0,
      };
    }

    const durations = filteredMetrics
      .map(m => m.duration_ms)
      .sort((a, b) => a - b);
    const successful = filteredMetrics.filter(m => m.success).length;
    const failed = filteredMetrics.filter(m => !m.success).length;

    return {
      total_operations: filteredMetrics.length,
      successful_operations: successful,
      failed_operations: failed,
      average_duration_ms:
        durations.reduce((a, b) => a + b, 0) / durations.length,
      p95_duration_ms: this.percentile(durations, 0.95),
      p99_duration_ms: this.percentile(durations, 0.99),
      error_rate: failed / filteredMetrics.length,
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  getRecentErrors(count: number = 10): MetricsData[] {
    return this.metrics
      .filter(m => !m.success)
      .slice(-count)
      .reverse();
  }

  getCompanyMetrics(
    companyId: string,
    timeWindowMs?: number
  ): PerformanceMetrics {
    let filteredMetrics = this.metrics.filter(m => m.company_id === companyId);

    if (timeWindowMs) {
      const cutoffTime = Date.now() - timeWindowMs;
      filteredMetrics = filteredMetrics.filter(
        m => new Date(m.timestamp).getTime() > cutoffTime
      );
    }

    return this.getPerformanceMetrics(undefined, undefined);
  }

  clear(): void {
    this.metrics = [];
  }

  exportMetrics(): MetricsData[] {
    return [...this.metrics];
  }
}

export class PerformanceMonitor {
  private metricsCollector = new MetricsCollector();
  private startTimes = new Map<string, number>();

  startTimer(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }

  endTimer(
    operationId: string,
    operation: string,
    success: boolean,
    companyId?: string,
    errorCode?: string,
    metadata?: Record<string, any>
  ): void {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      console.warn(`⚠️ No start time found for operation ${operationId}`);
      return;
    }

    const duration = Date.now() - startTime;
    this.metricsCollector.record(operation, {
      duration_ms: duration,
      success,
      ...(companyId && { company_id: companyId }),
      ...(errorCode && { error_code: errorCode }),
      ...(metadata && { metadata }),
    });

    this.startTimes.delete(operationId);
  }

  getMetrics(): MetricsCollector {
    return this.metricsCollector;
  }

  // Convenience method for async operations
  async monitor<T>(
    operation: string,
    fn: () => Promise<T>,
    companyId?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = `${operation}_${Date.now()}_${Math.random()}`;
    this.startTimer(operationId);

    try {
      const result = await fn();
      this.endTimer(
        operationId,
        operation,
        true,
        companyId,
        undefined,
        metadata
      );
      return result;
    } catch (error) {
      const errorCode =
        error instanceof Error ? error.constructor.name : 'UnknownError';
      this.endTimer(operationId, operation, false, companyId, errorCode, {
        ...metadata,
        error_message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Health check utilities
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: 'pass' | 'fail';
    memory: 'pass' | 'fail';
    metrics: 'pass' | 'fail';
  };
  metrics: PerformanceMetrics;
  timestamp: string;
}

export class HealthChecker {
  constructor(private metricsCollector: MetricsCollector) {}

  async checkHealth(): Promise<HealthStatus> {
    const checks = {
      database: ((await this.checkDatabase()) ? 'pass' : 'fail') as
        | 'pass'
        | 'fail',
      memory: (this.checkMemory() ? 'pass' : 'fail') as 'pass' | 'fail',
      metrics: (this.checkMetrics() ? 'pass' : 'fail') as 'pass' | 'fail',
    };

    const metrics = this.metricsCollector.getPerformanceMetrics(
      'cash_alerts',
      300000
    ); // Last 5 minutes

    const failedChecks = Object.values(checks).filter(
      status => status === 'fail'
    ).length;
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (failedChecks === 0) {
      status = 'healthy';
    } else if (failedChecks === 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      metrics,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // Simple database connectivity check
      const { pool } = await import('../../lib/db');
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private checkMemory(): boolean {
    const memUsage = process.memoryUsage();
    const maxMemoryMB = 1024; // 1GB limit
    const currentMemoryMB = memUsage.heapUsed / 1024 / 1024;

    return currentMemoryMB < maxMemoryMB;
  }

  private checkMetrics(): boolean {
    const recentMetrics = this.metricsCollector.getPerformanceMetrics(
      'cash_alerts',
      300000
    );
    return recentMetrics.error_rate < 0.1; // Less than 10% error rate
  }
}
