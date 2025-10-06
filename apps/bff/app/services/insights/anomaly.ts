import { db } from '@/lib/db';
import {
  insAnomaly,
  insReco,
  insFactClose,
  insFactTask,
  insFactCtrl,
  insFactFlux,
  insBenchBaseline,
  closeRun,
} from '@aibos/db-adapter/schema';
import { eq, and, desc, asc, sql, gte, lte, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import { logLine } from '@/lib/log';
import type {
  InsightsAnomalyScanResponseType,
  RecoActionType,
} from '@aibos/contracts';

export class InsightsAnomalyService {
  /**
   * Scan for anomalies and generate recommendations
   */
  async scanAnomalies(
    companyId: string,
    runId?: string
  ): Promise<InsightsAnomalyScanResponseType> {
    const runs = runId
      ? [{ id: runId }]
      : await db
          .select({ id: closeRun.id })
          .from(closeRun)
          .where(eq(closeRun.companyId, companyId))
          .orderBy(desc(closeRun.createdAt))
          .limit(5); // Last 5 runs

    let anomaliesDetected = 0;
    let recommendationsGenerated = 0;
    let highSeverityCount = 0;

    for (const run of runs) {
      try {
        // Detect different types of anomalies
        const taskAnomalies = await this.detectTaskAnomalies(companyId, run.id);
        const controlAnomalies = await this.detectControlAnomalies(
          companyId,
          run.id
        );
        const fluxAnomalies = await this.detectFluxAnomalies(companyId, run.id);
        const durationAnomalies = await this.detectDurationAnomalies(
          companyId,
          run.id
        );

        anomaliesDetected +=
          taskAnomalies.length +
          controlAnomalies.length +
          fluxAnomalies.length +
          durationAnomalies.length;

        highSeverityCount += [
          ...taskAnomalies,
          ...controlAnomalies,
          ...fluxAnomalies,
          ...durationAnomalies,
        ].filter(a => a.severity === 'HIGH').length;

        // Generate recommendations based on anomalies
        const recommendations = await this.generateRecommendations(
          companyId,
          run.id,
          {
            taskAnomalies,
            controlAnomalies,
            fluxAnomalies,
            durationAnomalies,
          }
        );

        recommendationsGenerated += recommendations.length;
      } catch (error) {
        logLine({
          msg: `Error scanning anomalies for run ${run.id}`,
          error: error instanceof Error ? error.message : String(error),
          runId: run.id,
        });
      }
    }

    logLine({
      msg: `Scanned anomalies for ${runs.length} runs`,
      companyId,
      anomaliesDetected,
      recommendationsGenerated,
      highSeverityCount,
    });

    return {
      success: true,
      message: `Detected ${anomaliesDetected} anomalies and generated ${recommendationsGenerated} recommendations`,
      anomalies_detected: anomaliesDetected,
      recommendations_generated: recommendationsGenerated,
      high_severity_count: highSeverityCount,
    };
  }

  /**
   * Detect task-related anomalies
   */
  private async detectTaskAnomalies(
    companyId: string,
    runId: string
  ): Promise<any[]> {
    const anomalies: any[] = [];

    // Check for repeated late tasks
    const lateTasks = await db
      .select({
        code: insFactTask.code,
        owner: insFactTask.owner,
        count: sql<number>`count(*)`,
      })
      .from(insFactTask)
      .where(and(eq(insFactTask.runId, runId), eq(insFactTask.breached, true)))
      .groupBy(insFactTask.code, insFactTask.owner)
      .having(sql`count(*) >= 3`); // 3+ occurrences

    for (const lateTask of lateTasks) {
      const anomalyId = ulid();
      const score = this.calculateTaskAnomalyScore(lateTask.count);
      const severity = this.determineSeverity(score);

      await db.insert(insAnomaly).values({
        id: anomalyId,
        companyId,
        runId,
        kind: 'TASK',
        signal: {
          taskCode: lateTask.code,
          owner: lateTask.owner,
          occurrenceCount: lateTask.count,
          pattern: 'repeated_late',
        },
        score: score.toString(),
        severity,
      });

      anomalies.push({ id: anomalyId, severity });
    }

    return anomalies;
  }

  /**
   * Detect control-related anomalies
   */
  private async detectControlAnomalies(
    companyId: string,
    runId: string
  ): Promise<any[]> {
    const anomalies: any[] = [];

    // Check for recurring control failures
    const controlFailures = await db
      .select({
        controlCode: insFactCtrl.controlCode,
        count: sql<number>`count(*)`,
        materialFailCount: sql<number>`sum(case when ${insFactCtrl.materialFail} then 1 else 0 end)`,
      })
      .from(insFactCtrl)
      .where(
        and(
          eq(insFactCtrl.status, 'FAIL'),
          sql`${insFactCtrl.ctrlRunId} IN (SELECT id FROM ctrl_run WHERE run_id = ${runId})`
        )
      )
      .groupBy(insFactCtrl.controlCode)
      .having(sql`count(*) >= 2`); // 2+ failures

    for (const failure of controlFailures) {
      const anomalyId = ulid();
      const score = this.calculateControlAnomalyScore(
        failure.count,
        failure.materialFailCount
      );
      const severity = this.determineSeverity(score);

      await db.insert(insAnomaly).values({
        id: anomalyId,
        companyId,
        runId,
        kind: 'CONTROL',
        signal: {
          controlCode: failure.controlCode,
          failureCount: failure.count,
          materialFailCount: failure.materialFailCount,
          pattern: 'recurring_failure',
        },
        score: score.toString(),
        severity,
      });

      anomalies.push({ id: anomalyId, severity });
    }

    return anomalies;
  }

  /**
   * Detect flux-related anomalies
   */
  private async detectFluxAnomalies(
    companyId: string,
    runId: string
  ): Promise<any[]> {
    const anomalies: any[] = [];

    // Check for abnormal flux comment gaps
    const fluxData = await db
      .select()
      .from(insFactFlux)
      .where(
        sql`flux_run_id IN (SELECT id FROM flux_run WHERE run_id = ${runId})`
      );

    for (const flux of fluxData) {
      const commentCoverage =
        flux.material > 0
          ? (flux.material - flux.commentMissing) / flux.material
          : 1;

      if (commentCoverage < 0.5) {
        // Less than 50% coverage
        const anomalyId = ulid();
        const score = this.calculateFluxAnomalyScore(commentCoverage);
        const severity = this.determineSeverity(score);

        await db.insert(insAnomaly).values({
          id: anomalyId,
          companyId,
          runId,
          kind: 'FLUX',
          signal: {
            scope: flux.scope,
            materialCount: flux.material,
            commentMissing: flux.commentMissing,
            coverage: commentCoverage,
            pattern: 'low_comment_coverage',
          },
          score: score.toString(),
          severity,
        });

        anomalies.push({ id: anomalyId, severity });
      }
    }

    return anomalies;
  }

  /**
   * Detect duration-related anomalies
   */
  private async detectDurationAnomalies(
    companyId: string,
    runId: string
  ): Promise<any[]> {
    const anomalies: any[] = [];

    // Get current run duration
    const currentRun = await db
      .select()
      .from(insFactClose)
      .where(eq(insFactClose.runId, runId))
      .limit(1);

    if (currentRun.length === 0) return anomalies;

    const currentDays = parseFloat(currentRun[0]?.daysToClose || '0');

    // Get historical baseline
    const baseline = await db
      .select()
      .from(insBenchBaseline)
      .where(
        and(
          eq(insBenchBaseline.companyId, companyId),
          eq(insBenchBaseline.metric, 'DAYS_TO_CLOSE'),
          eq(insBenchBaseline.entityGroup, 'SELF')
        )
      )
      .orderBy(desc(insBenchBaseline.windowEnd))
      .limit(1);

    if (baseline.length === 0) return anomalies;

    const p90 = parseFloat(baseline[0]?.p90 || '0');

    if (currentDays > p90) {
      const anomalyId = ulid();
      const score = this.calculateDurationAnomalyScore(currentDays, p90);
      const severity = this.determineSeverity(score);

      await db.insert(insAnomaly).values({
        id: anomalyId,
        companyId,
        runId,
        kind: 'DURATION',
        signal: {
          currentDays,
          p90Baseline: p90,
          deviation: currentDays - p90,
          pattern: 'duration_spike',
        },
        score: score.toString(),
        severity,
      });

      anomalies.push({ id: anomalyId, severity });
    }

    return anomalies;
  }

  /**
   * Generate recommendations based on detected anomalies
   */
  private async generateRecommendations(
    companyId: string,
    runId: string,
    anomalies: {
      taskAnomalies: any[];
      controlAnomalies: any[];
      fluxAnomalies: any[];
      durationAnomalies: any[];
    }
  ): Promise<any[]> {
    const recommendations: any[] = [];

    // Generate task recommendations
    for (const anomaly of anomalies.taskAnomalies) {
      const recoId = ulid();
      await db.insert(insReco).values({
        id: recoId,
        companyId,
        runId,
        recoCode: 'TASK_SLA_OPTIMIZATION',
        title: 'Optimize Task SLA Timing',
        detail: {
          anomalyId: anomaly.id,
          recommendation:
            'Consider shifting JE cutoff task earlier by 12 hours',
          rationale: 'Repeated late completion suggests timing issues',
        },
        impactEstimate: '0.5', // 0.5 days improvement
        effort: 'LOW',
        status: 'OPEN',
        createdBy: 'system',
        updatedBy: 'system',
      });
      recommendations.push({ id: recoId });
    }

    // Generate control recommendations
    for (const anomaly of anomalies.controlAnomalies) {
      const recoId = ulid();
      await db.insert(insReco).values({
        id: recoId,
        companyId,
        runId,
        recoCode: 'CONTROL_PRECHECK',
        title: 'Add Control Precheck',
        detail: {
          anomalyId: anomaly.id,
          recommendation: 'Add control precheck to bank reconciliation process',
          rationale: 'Recurring failures indicate process gaps',
        },
        impactEstimate: '0.3', // 0.3 days improvement
        effort: 'MEDIUM',
        status: 'OPEN',
        createdBy: 'system',
        updatedBy: 'system',
      });
      recommendations.push({ id: recoId });
    }

    // Generate flux recommendations
    for (const anomaly of anomalies.fluxAnomalies) {
      const recoId = ulid();
      await db.insert(insReco).values({
        id: recoId,
        companyId,
        runId,
        recoCode: 'FLUX_COMMENT_TEMPLATE',
        title: 'Implement Flux Comment Templates',
        detail: {
          anomalyId: anomaly.id,
          recommendation:
            'Create standardized comment templates for material variances',
          rationale: 'Low comment coverage affects audit readiness',
        },
        impactEstimate: '0.2', // 0.2 days improvement
        effort: 'LOW',
        status: 'OPEN',
        createdBy: 'system',
        updatedBy: 'system',
      });
      recommendations.push({ id: recoId });
    }

    return recommendations;
  }

  /**
   * Action on recommendations
   */
  async actionRecommendation(
    companyId: string,
    userId: string,
    data: RecoActionType
  ): Promise<void> {
    await db
      .update(insReco)
      .set({
        status: data.status,
        actedAt: data.status === 'DONE' ? new Date() : null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(insReco.id, data.id), eq(insReco.companyId, companyId)));

    logLine({
      msg: `Actioned recommendation ${data.id}`,
      companyId,
      recommendationId: data.id,
      status: data.status,
      userId,
    });
  }

  /**
   * Get open anomalies
   */
  async getOpenAnomalies(companyId: string): Promise<any[]> {
    const anomalies = await db
      .select()
      .from(insAnomaly)
      .where(
        and(eq(insAnomaly.companyId, companyId), isNull(insAnomaly.closedAt))
      )
      .orderBy(desc(insAnomaly.score), desc(insAnomaly.openedAt));

    return anomalies;
  }

  /**
   * Get recommendations by status
   */
  async getRecommendations(companyId: string, status?: string): Promise<any[]> {
    const whereConditions = [eq(insReco.companyId, companyId)];

    if (status) {
      whereConditions.push(
        eq(insReco.status, status as 'OPEN' | 'PLANNED' | 'DONE')
      );
    }

    const recommendations = await db
      .select()
      .from(insReco)
      .where(and(...whereConditions))
      .orderBy(desc(insReco.impactEstimate), desc(insReco.createdAt));

    return recommendations;
  }

  // Helper methods for scoring
  private calculateTaskAnomalyScore(occurrenceCount: number): number {
    return Math.min(occurrenceCount * 0.3, 1.0);
  }

  private calculateControlAnomalyScore(
    failureCount: number,
    materialFailCount: number
  ): number {
    const baseScore = failureCount * 0.2;
    const materialPenalty = materialFailCount * 0.3;
    return Math.min(baseScore + materialPenalty, 1.0);
  }

  private calculateFluxAnomalyScore(coverage: number): number {
    return Math.max(0, 1.0 - coverage);
  }

  private calculateDurationAnomalyScore(
    currentDays: number,
    p90: number
  ): number {
    const deviation = (currentDays - p90) / p90;
    return Math.min(deviation, 1.0);
  }

  private determineSeverity(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }
}
