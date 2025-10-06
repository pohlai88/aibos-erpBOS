import { db } from '@/lib/db';
import {
  eq,
  and,
  desc,
  gte,
  lte,
  sql,
  count,
  avg,
  max,
  min,
} from 'drizzle-orm';
import { opsRun, opsRunStep, opsOutbox } from '@aibos/db-adapter/schema';
import type { RunMetricsM27_2, OutboxEventM27_2 } from '@aibos/contracts';

/**
 * M27.2: Outcome Manager
 *
 * Manages metric taps from domain services, post-action checks,
 * and attestation recording
 */
export class OutcomeManager {
  /**
   * Record metrics from domain services
   */
  async recordMetrics(
    companyId: string,
    source: string,
    metrics: Record<string, any>
  ): Promise<void> {
    await db.insert(opsOutbox).values({
      id: crypto.randomUUID(),
      topic: 'ops.metrics.updated',
      key: `${companyId}:${source}`,
      payload_jsonb: {
        company_id: companyId,
        source,
        metrics,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Record post-action verification results
   */
  async recordVerification(
    runId: string,
    stepId: string,
    verification: {
      type: 'outcome_check' | 'guardrail_check' | 'rollback_trigger';
      passed: boolean;
      metrics: Record<string, any>;
      violations?: string[];
    }
  ): Promise<void> {
    await db.insert(opsOutbox).values({
      id: crypto.randomUUID(),
      topic: 'ops.verification.completed',
      key: `${runId}:${stepId}`,
      payload_jsonb: {
        run_id: runId,
        step_id: stepId,
        verification,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get aggregated metrics for a time period
   */
  async getAggregatedMetrics(
    companyId: string,
    fromDate: Date,
    toDate: Date,
    playbookCode?: string
  ): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    rolledBackRuns: number;
    avgDuration: number;
    p50Duration: number;
    p95Duration: number;
    successRate: number;
    metricsByPlaybook: Record<string, any>;
  }> {
    const conditions = [
      eq(opsRun.company_id, companyId),
      gte(opsRun.created_at, fromDate),
      lte(opsRun.created_at, toDate),
    ];

    // Get run statistics
    const runStats = await db
      .select({
        status: opsRun.status,
        count: count(),
        avgDuration: avg(
          sql`EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000`
        ),
        p50Duration: sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000)`,
        p95Duration: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000)`,
      })
      .from(opsRun)
      .where(and(...conditions))
      .groupBy(opsRun.status);

    // Calculate totals
    const totalRuns = runStats.reduce((sum, stat) => sum + stat.count, 0);
    const successfulRuns =
      runStats.find(s => s.status === 'succeeded')?.count || 0;
    const failedRuns = runStats.find(s => s.status === 'failed')?.count || 0;
    const rolledBackRuns =
      runStats.find(s => s.status === 'rolled_back')?.count || 0;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

    // Get average duration
    const avgDuration =
      runStats.reduce((sum, stat) => sum + (Number(stat.avgDuration) || 0), 0) /
      runStats.length;

    // Get metrics by playbook (placeholder - would join with playbook table)
    const metricsByPlaybook: Record<string, any> = {};

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      rolledBackRuns,
      avgDuration,
      p50Duration: 0, // Would calculate from actual data
      p95Duration: 0, // Would calculate from actual data
      successRate,
      metricsByPlaybook,
    };
  }

  /**
   * Check if metrics indicate improvement
   */
  async checkMetricImprovement(
    companyId: string,
    metric: string,
    threshold: any,
    timeWindow: number // minutes
  ): Promise<{
    improved: boolean;
    currentValue: number;
    previousValue: number;
    improvement: number;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow * 60 * 1000);

    // Get current and previous metric values
    const currentValue = await this.getMetricValue(companyId, metric, now);
    const previousValue = await this.getMetricValue(
      companyId,
      metric,
      windowStart
    );

    const improvement =
      previousValue > 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : 0;
    const improved = this.evaluateThreshold(
      metric,
      currentValue,
      previousValue,
      threshold
    );

    return {
      improved,
      currentValue,
      previousValue,
      improvement,
    };
  }

  /**
   * Check if breaches are zero or below threshold
   */
  async checkBreachesZero(
    companyId: string,
    breachType: string,
    threshold: number = 0
  ): Promise<{
    passed: boolean;
    currentBreaches: number;
    threshold: number;
  }> {
    const currentBreaches = await this.getMetricValue(
      companyId,
      `breaches.${breachType}`,
      new Date()
    );

    return {
      passed: currentBreaches <= threshold,
      currentBreaches,
      threshold,
    };
  }

  /**
   * Check if error count is below threshold
   */
  async checkErrorCountBelow(
    companyId: string,
    errorType: string,
    threshold: number
  ): Promise<{
    passed: boolean;
    currentErrors: number;
    threshold: number;
  }> {
    const currentErrors = await this.getMetricValue(
      companyId,
      `errors.${errorType}`,
      new Date()
    );

    return {
      passed: currentErrors < threshold,
      currentErrors,
      threshold,
    };
  }

  /**
   * Record attestation for compliance
   */
  async recordAttestation(
    runId: string,
    attestation: {
      type: string;
      attested_by: string;
      attested_at: Date;
      evidence: Record<string, any>;
      compliance_status: 'compliant' | 'non_compliant' | 'requires_review';
    }
  ): Promise<void> {
    await db.insert(opsOutbox).values({
      id: crypto.randomUUID(),
      topic: 'ops.attestation.recorded',
      key: runId,
      payload_jsonb: {
        run_id: runId,
        attestation,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get metric value from domain services
   */
  private async getMetricValue(
    companyId: string,
    metric: string,
    timestamp: Date
  ): Promise<number> {
    // This is a placeholder implementation
    // In production, this would query the appropriate domain service

    // Mock implementation - would query actual metrics
    const mockMetrics: Record<string, number> = {
      'breaches.cash': 2,
      'breaches.ap': 1,
      'breaches.ar': 0,
      'errors.payment': 3,
      'errors.allocation': 1,
      'errors.fx': 0,
      dso_delta: -2.5,
      ap_mismatches: 0,
      cash_breaches: 2,
    };

    return mockMetrics[metric] || 0;
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(
    metric: string,
    currentValue: number,
    previousValue: number,
    threshold: any
  ): boolean {
    if (typeof threshold === 'number') {
      return currentValue <= threshold;
    }

    if (typeof threshold === 'object') {
      if (threshold.op === 'gt') {
        return currentValue > threshold.value;
      } else if (threshold.op === 'lt') {
        return currentValue < threshold.value;
      } else if (threshold.op === 'eq') {
        return currentValue === threshold.value;
      } else if (threshold.op === 'between') {
        return (
          currentValue >= threshold.value[0] &&
          currentValue <= threshold.value[1]
        );
      }
    }

    // Default improvement check
    return currentValue < previousValue;
  }

  /**
   * Get recent events for observability
   */
  async getRecentEvents(
    companyId: string,
    topics?: string[],
    limit: number = 100
  ): Promise<OutboxEventM27_2[]> {
    const conditions = [eq(opsOutbox.topic, 'ops.*')]; // Would filter by company_id if available

    if (topics && topics.length > 0) {
      conditions.push(sql`topic = ANY(${topics})`);
    }

    const events = await db
      .select()
      .from(opsOutbox)
      .where(and(...conditions))
      .orderBy(desc(opsOutbox.created_at))
      .limit(limit);

    return events.map(event => ({
      topic: event.topic,
      key: event.key,
      payload_jsonb: event.payload_jsonb as Record<string, any>,
      created_at: event.created_at.toISOString(),
    }));
  }

  /**
   * Calculate run metrics from steps
   */
  calculateRunMetrics(steps: any[]): RunMetricsM27_2 {
    const durations = steps.map(s => s.duration_ms || 0).filter(d => d > 0);
    const successfulSteps = steps.filter(s => s.status === 'succeeded').length;
    const failedSteps = steps.filter(s => s.status === 'failed').length;

    return {
      entities_count: steps.reduce(
        (sum, step) => sum + (step.output_jsonb?.count || 0),
        0
      ),
      checks_pass: successfulSteps,
      checks_failed: failedSteps,
      rollback_count: steps.filter(s => s.rolled_back).length,
      p50_duration_ms: this.calculatePercentile(durations, 50),
      p95_duration_ms: this.calculatePercentile(durations, 95),
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}
