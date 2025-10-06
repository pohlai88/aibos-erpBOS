// M15.2 Phase 2: Comprehensive Observability
// Production-ready observability with metrics, tracing, and alerting

import { performanceMonitor, HealthChecker, HealthStatus } from './monitoring';

export interface ObservabilityConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableAlerting: boolean;
  metricsIntervalMs: number;
  alertThresholds: {
    errorRate: number;
    responseTimeP95: number;
    memoryUsage: number;
  };
}

export interface SystemMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  memory_heap_used: number;
  memory_heap_total: number;
  memory_external: number;
  uptime: number;
  active_handles: number;
  active_requests: number;
}

export interface BusinessMetrics {
  timestamp: string;
  companies_processed: number;
  alerts_evaluated: number;
  breaches_detected: number;
  notifications_sent: number;
  cache_hits: number;
  cache_misses: number;
  error_rate: number;
  avg_processing_time_ms: number;
}

export class ComprehensiveObservability {
  private config: ObservabilityConfig;
  private healthChecker: HealthChecker;
  private metricsInterval?: NodeJS.Timeout;
  private alertingEnabled = false;

  constructor(config: ObservabilityConfig) {
    this.config = config;
    this.healthChecker = new HealthChecker(performanceMonitor.getMetrics());

    if (config.enableMetrics) {
      this.startMetricsCollection();
    }

    if (config.enableAlerting) {
      this.enableAlerting();
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const systemMetrics = await this.collectSystemMetrics();
        const businessMetrics = await this.collectBusinessMetrics();

        // Log structured metrics
        console.log(
          JSON.stringify({
            level: 'INFO',
            event: 'system_metrics',
            ...systemMetrics,
          })
        );

        console.log(
          JSON.stringify({
            level: 'INFO',
            event: 'business_metrics',
            ...businessMetrics,
          })
        );

        // Check for alert conditions
        if (this.config.enableAlerting) {
          await this.checkAlertConditions(systemMetrics, businessMetrics);
        }
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, this.config.metricsIntervalMs);
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      cpu_usage: cpuUsage.user + cpuUsage.system,
      memory_usage: memUsage.rss / 1024 / 1024, // MB
      memory_heap_used: memUsage.heapUsed / 1024 / 1024, // MB
      memory_heap_total: memUsage.heapTotal / 1024 / 1024, // MB
      memory_external: memUsage.external / 1024 / 1024, // MB
      uptime: process.uptime(),
      active_handles: (process as any)._getActiveHandles?.()?.length || 0,
      active_requests: (process as any)._getActiveRequests?.()?.length || 0,
    };
  }

  private async collectBusinessMetrics(): Promise<BusinessMetrics> {
    const performanceMetrics = performanceMonitor
      .getMetrics()
      .getPerformanceMetrics('cash_alerts', 300000); // Last 5 minutes

    return {
      timestamp: new Date().toISOString(),
      companies_processed: performanceMetrics.total_operations,
      alerts_evaluated: performanceMetrics.total_operations,
      breaches_detected: 0, // Would need to track this separately
      notifications_sent: 0, // Would need to track this separately
      cache_hits: 0, // Would need to track this separately
      cache_misses: 0, // Would need to track this separately
      error_rate: performanceMetrics.error_rate,
      avg_processing_time_ms: performanceMetrics.average_duration_ms,
    };
  }

  private async checkAlertConditions(
    systemMetrics: SystemMetrics,
    businessMetrics: BusinessMetrics
  ): Promise<void> {
    const alerts: string[] = [];

    // Check error rate
    if (businessMetrics.error_rate > this.config.alertThresholds.errorRate) {
      alerts.push(
        `High error rate: ${(businessMetrics.error_rate * 100).toFixed(2)}%`
      );
    }

    // Check response time
    if (
      businessMetrics.avg_processing_time_ms >
      this.config.alertThresholds.responseTimeP95
    ) {
      alerts.push(
        `High response time: ${businessMetrics.avg_processing_time_ms.toFixed(2)}ms`
      );
    }

    // Check memory usage
    if (systemMetrics.memory_usage > this.config.alertThresholds.memoryUsage) {
      alerts.push(
        `High memory usage: ${systemMetrics.memory_usage.toFixed(2)}MB`
      );
    }

    // Send alerts if any conditions are met
    if (alerts.length > 0) {
      await this.sendAlert(alerts, systemMetrics, businessMetrics);
    }
  }

  private async sendAlert(
    alerts: string[],
    systemMetrics: SystemMetrics,
    businessMetrics: BusinessMetrics
  ): Promise<void> {
    const alertMessage = {
      level: 'WARN',
      event: 'system_alert',
      timestamp: new Date().toISOString(),
      alerts,
      system_metrics: systemMetrics,
      business_metrics: businessMetrics,
    };

    console.log(JSON.stringify(alertMessage));

    // In a real implementation, you would send this to your alerting system
    // (e.g., PagerDuty, Slack, email, etc.)
    console.log('🚨 ALERT:', alerts.join(', '));
  }

  private enableAlerting(): void {
    this.alertingEnabled = true;
    console.log('🔔 Alerting enabled for cash alerts system');
  }

  async getSystemHealth(): Promise<HealthStatus> {
    return await this.healthChecker.checkHealth();
  }

  async getDetailedMetrics(): Promise<{
    system: SystemMetrics;
    business: BusinessMetrics;
    performance: any;
    health: HealthStatus;
  }> {
    const systemMetrics = await this.collectSystemMetrics();
    const businessMetrics = await this.collectBusinessMetrics();
    const performanceMetrics = performanceMonitor
      .getMetrics()
      .getPerformanceMetrics('cash_alerts');
    const healthStatus = await this.getSystemHealth();

    return {
      system: systemMetrics,
      business: businessMetrics,
      performance: performanceMetrics,
      health: healthStatus,
    };
  }

  // Tracing functionality
  async traceOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const traceId = this.generateTraceId();
    const startTime = Date.now();

    console.log(
      JSON.stringify({
        level: 'INFO',
        event: 'operation_start',
        trace_id: traceId,
        operation: operationName,
        timestamp: new Date().toISOString(),
        metadata,
      })
    );

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      console.log(
        JSON.stringify({
          level: 'INFO',
          event: 'operation_complete',
          trace_id: traceId,
          operation: operationName,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          success: true,
        })
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.log(
        JSON.stringify({
          level: 'ERROR',
          event: 'operation_failed',
          trace_id: traceId,
          operation: operationName,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      );

      throw error;
    }
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // Dashboard data
  async getDashboardData(): Promise<{
    health_status: HealthStatus;
    recent_metrics: {
      system: SystemMetrics;
      business: BusinessMetrics;
    };
    performance_summary: any;
    error_summary: any[];
  }> {
    const healthStatus = await this.getSystemHealth();
    const systemMetrics = await this.collectSystemMetrics();
    const businessMetrics = await this.collectBusinessMetrics();
    const performanceMetrics = performanceMonitor
      .getMetrics()
      .getPerformanceMetrics('cash_alerts');
    const recentErrors = performanceMonitor.getMetrics().getRecentErrors(10);

    return {
      health_status: healthStatus,
      recent_metrics: {
        system: systemMetrics,
        business: businessMetrics,
      },
      performance_summary: performanceMetrics,
      error_summary: recentErrors,
    };
  }

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}

// Global observability instance
export const observability = new ComprehensiveObservability({
  enableMetrics: true,
  enableTracing: true,
  enableAlerting: true,
  metricsIntervalMs: 60000, // 1 minute
  alertThresholds: {
    errorRate: 0.1, // 10%
    responseTimeP95: 5000, // 5 seconds
    memoryUsage: 1024, // 1GB
  },
});
