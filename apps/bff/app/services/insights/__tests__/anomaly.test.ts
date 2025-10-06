import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InsightsAnomalyService } from '@/services/insights/anomaly';
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
  ctrlRun,
  ctrlControl,
  ctrlException,
  fluxRun,
  fluxLine,
} from '@aibos/db-adapter/schema';
import { eq, and } from 'drizzle-orm';

describe('InsightsAnomalyService', () => {
  const companyId = 'test-company';
  const userId = 'test-user';
  let service: InsightsAnomalyService;

  beforeEach(async () => {
    service = new InsightsAnomalyService();
    // Clean up test data
    await db.delete(insReco);
    await db.delete(insAnomaly);
    await db.delete(insBenchBaseline);
    await db.delete(insFactFlux);
    await db.delete(insFactCtrl);
    await db.delete(insFactTask);
    await db.delete(insFactClose);
    await db.delete(fluxLine);
    await db.delete(fluxRun);
    await db.delete(ctrlException);
    await db.delete(ctrlRun);
    await db.delete(ctrlControl);
    await db.delete(closeRun);

    // Create test close run
    await db.insert(closeRun).values({
      id: 'run-1',
      companyId,
      year: 2025,
      month: 1,
      status: 'PUBLISHED',
      startedAt: new Date('2025-01-01T00:00:00Z'),
      closedAt: new Date('2025-01-05T00:00:00Z'),
      owner: 'ops',
      createdBy: userId,
      updatedBy: userId,
    });

    // Create test close facts
    await db.insert(insFactClose).values({
      id: 'fact-close-1',
      companyId,
      runId: 'run-1',
      year: 2025,
      month: 1,
      daysToClose: '6', // High duration
      onTimeRate: '70', // Low on-time rate
      lateTasks: 5,
      exceptionsOpen: 3,
      exceptionsMaterial: 2,
      certsDone: 1,
      computedAt: new Date('2025-01-05T00:00:00Z'),
    });

    // Create test task facts with breaches
    await db.insert(insFactTask).values([
      {
        id: 'fact-task-1',
        runId: 'run-1',
        taskId: 'task-1',
        code: 'JE_CUTOFF',
        owner: 'accounting',
        startedAt: null,
        finishedAt: new Date('2025-01-02T00:00:00Z'),
        slaDueAt: new Date('2025-01-01T18:00:00Z'),
        status: 'DONE',
        ageHours: '30',
        breached: true,
      },
      {
        id: 'fact-task-2',
        runId: 'run-1',
        taskId: 'task-2',
        code: 'JE_CUTOFF', // Same code for repeated pattern
        owner: 'accounting',
        startedAt: null,
        finishedAt: new Date('2025-01-02T00:00:00Z'),
        slaDueAt: new Date('2025-01-01T18:00:00Z'),
        status: 'DONE',
        ageHours: '30',
        breached: true,
      },
      {
        id: 'fact-task-3',
        runId: 'run-1',
        taskId: 'task-3',
        code: 'JE_CUTOFF', // Third occurrence
        owner: 'accounting',
        startedAt: null,
        finishedAt: new Date('2025-01-02T00:00:00Z'),
        slaDueAt: new Date('2025-01-01T18:00:00Z'),
        status: 'DONE',
        ageHours: '30',
        breached: true,
      },
    ]);

    // Create test control with failures
    await db.insert(ctrlControl).values({
      id: 'ctrl-1',
      companyId,
      code: 'BANK_REC_CTRL',
      name: 'Bank Reconciliation Control',
      purpose: 'Verify bank reconciliation accuracy',
      domain: 'CLOSE',
      frequency: 'PER_RUN',
      severity: 'HIGH',
      autoKind: 'SQL',
      autoConfig: { query: 'SELECT * FROM bank_recon' },
      evidenceRequired: true,
      status: 'ACTIVE',
      createdBy: userId,
      updatedBy: userId,
    });

    await db.insert(ctrlRun).values({
      id: 'ctrl-run-1',
      companyId,
      controlId: 'ctrl-1',
      runId: 'run-1',
      scheduledAt: new Date('2025-01-01T00:00:00Z'),
      startedAt: new Date('2025-01-01T01:00:00Z'),
      finishedAt: new Date('2025-01-01T01:30:00Z'),
      status: 'FAIL',
      notes: 'Control failed',
      createdBy: userId,
    });

    await db.insert(ctrlRun).values({
      id: 'ctrl-run-2',
      companyId,
      controlId: 'ctrl-1',
      runId: 'run-1',
      scheduledAt: new Date('2025-01-01T00:00:00Z'),
      startedAt: new Date('2025-01-01T01:00:00Z'),
      finishedAt: new Date('2025-01-01T01:30:00Z'),
      status: 'FAIL',
      notes: 'Control failed again',
      createdBy: userId,
    });

    // Create test control facts
    await db.insert(insFactCtrl).values([
      {
        id: 'fact-ctrl-1',
        ctrlRunId: 'ctrl-run-1',
        controlCode: 'BANK_REC_CTRL',
        status: 'FAIL',
        severity: 'HIGH',
        exceptionsCount: 2,
        waived: 0,
        evidenceCount: 1,
        durationMs: 1800000,
        materialFail: true,
      },
      {
        id: 'fact-ctrl-2',
        ctrlRunId: 'ctrl-run-2',
        controlCode: 'BANK_REC_CTRL',
        status: 'FAIL',
        severity: 'HIGH',
        exceptionsCount: 3,
        waived: 1,
        evidenceCount: 0,
        durationMs: 2100000,
        materialFail: true,
      },
    ]);

    // Create test flux run
    await db.insert(fluxRun).values({
      id: 'flux-run-1',
      companyId,
      runId: 'run-1',
      baseYear: 2024,
      baseMonth: 12,
      cmpYear: 2025,
      cmpMonth: 1,
      presentCcy: 'USD',
      status: 'COMPLETED',
      createdBy: userId,
    });

    // Create test flux facts with low comment coverage
    await db.insert(insFactFlux).values({
      id: 'fact-flux-1',
      fluxRunId: 'flux-run-1',
      scope: '2024',
      presentCcy: 'USD',
      material: 10,
      commentMissing: 8, // 80% missing comments
      topDeltaAbs: '50000',
      topDeltaPct: '0.2',
    });

    // Create baseline for duration anomaly
    await db.insert(insBenchBaseline).values({
      id: 'baseline-1',
      companyId,
      entityGroup: 'SELF',
      metric: 'DAYS_TO_CLOSE',
      granularity: 'MONTH',
      value: '4',
      p50: '3',
      p75: '4',
      p90: '5',
      windowStart: new Date('2024-10-01T00:00:00Z'),
      windowEnd: new Date('2024-12-31T23:59:59Z'),
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(insReco);
    await db.delete(insAnomaly);
    await db.delete(insBenchBaseline);
    await db.delete(insFactFlux);
    await db.delete(insFactCtrl);
    await db.delete(insFactTask);
    await db.delete(insFactClose);
    await db.delete(fluxLine);
    await db.delete(fluxRun);
    await db.delete(ctrlException);
    await db.delete(ctrlRun);
    await db.delete(ctrlControl);
    await db.delete(closeRun);
  });

  it('should detect task anomalies correctly', async () => {
    const result = await service.scanAnomalies(companyId, 'run-1');

    expect(result.success).toBe(true);
    expect(result.anomalies_detected).toBeGreaterThan(0);
    expect(result.recommendations_generated).toBeGreaterThan(0);

    // Check that task anomaly was created
    const anomalies = await db
      .select()
      .from(insAnomaly)
      .where(
        and(eq(insAnomaly.companyId, companyId), eq(insAnomaly.kind, 'TASK'))
      );

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.kind).toBe('TASK');
    expect((anomalies[0]?.signal as any)?.taskCode).toBe('JE_CUTOFF');
    expect((anomalies[0]?.signal as any)?.occurrenceCount).toBe(3);
    expect((anomalies[0]?.signal as any)?.pattern).toBe('repeated_late');
    expect(parseFloat(anomalies[0]?.score || '0')).toBeGreaterThan(0);
  });

  it('should detect control anomalies correctly', async () => {
    const result = await service.scanAnomalies(companyId, 'run-1');

    expect(result.success).toBe(true);

    // Check that control anomaly was created
    const anomalies = await db
      .select()
      .from(insAnomaly)
      .where(
        and(eq(insAnomaly.companyId, companyId), eq(insAnomaly.kind, 'CONTROL'))
      );

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.kind).toBe('CONTROL');
    expect((anomalies[0]?.signal as any)?.controlCode).toBe('BANK_REC_CTRL');
    expect((anomalies[0]?.signal as any)?.failureCount).toBe(2);
    expect((anomalies[0]?.signal as any)?.materialFailCount).toBe(2);
    expect((anomalies[0]?.signal as any)?.pattern).toBe('recurring_failure');
  });

  it('should detect flux anomalies correctly', async () => {
    const result = await service.scanAnomalies(companyId, 'run-1');

    expect(result.success).toBe(true);

    // Check that flux anomaly was created
    const anomalies = await db
      .select()
      .from(insAnomaly)
      .where(
        and(eq(insAnomaly.companyId, companyId), eq(insAnomaly.kind, 'FLUX'))
      );

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.kind).toBe('FLUX');
    expect((anomalies[0]?.signal as any)?.coverage).toBeLessThan(0.5);
    expect((anomalies[0]?.signal as any)?.pattern).toBe('low_comment_coverage');
  });

  it('should detect duration anomalies correctly', async () => {
    const result = await service.scanAnomalies(companyId, 'run-1');

    expect(result.success).toBe(true);

    // Check that duration anomaly was created
    const anomalies = await db
      .select()
      .from(insAnomaly)
      .where(
        and(
          eq(insAnomaly.companyId, companyId),
          eq(insAnomaly.kind, 'DURATION')
        )
      );

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.kind).toBe('DURATION');
    expect((anomalies[0]?.signal as any)?.currentDays).toBe(6);
    expect((anomalies[0]?.signal as any)?.p90Baseline).toBe(5);
    expect((anomalies[0]?.signal as any)?.deviation).toBe(1);
    expect((anomalies[0]?.signal as any)?.pattern).toBe('duration_spike');
  });

  it('should generate recommendations correctly', async () => {
    const result = await service.scanAnomalies(companyId, 'run-1');

    expect(result.success).toBe(true);
    expect(result.recommendations_generated).toBeGreaterThan(0);

    // Check that recommendations were created
    const recommendations = await db
      .select()
      .from(insReco)
      .where(eq(insReco.companyId, companyId));

    expect(recommendations.length).toBeGreaterThan(0);

    const taskReco = recommendations.find(
      r => r.recoCode === 'TASK_SLA_OPTIMIZATION'
    );
    expect(taskReco).toBeDefined();
    expect(taskReco?.title).toBe('Optimize Task SLA Timing');
    expect(taskReco?.effort).toBe('LOW');
    expect(taskReco?.status).toBe('OPEN');

    const controlReco = recommendations.find(
      r => r.recoCode === 'CONTROL_PRECHECK'
    );
    expect(controlReco).toBeDefined();
    expect(controlReco?.title).toBe('Add Control Precheck');
    expect(controlReco?.effort).toBe('MEDIUM');

    const fluxReco = recommendations.find(
      r => r.recoCode === 'FLUX_COMMENT_TEMPLATE'
    );
    expect(fluxReco).toBeDefined();
    expect(fluxReco?.title).toBe('Implement Flux Comment Templates');
    expect(fluxReco?.effort).toBe('LOW');
  });

  it('should action recommendations correctly', async () => {
    // First scan to create recommendations
    await service.scanAnomalies(companyId, 'run-1');

    // Get a recommendation
    const recommendations = await db
      .select()
      .from(insReco)
      .where(eq(insReco.companyId, companyId))
      .limit(1);

    expect(recommendations).toHaveLength(1);

    const recoId = recommendations[0]?.id;
    expect(recoId).toBeDefined();

    if (!recoId) {
      throw new Error('Recommendation ID not found');
    }

    // Action the recommendation
    await service.actionRecommendation(companyId, userId, {
      id: recoId,
      status: 'PLANNED',
      note: 'Will implement next sprint',
    });

    // Check that recommendation was updated
    const updatedReco = await db
      .select()
      .from(insReco)
      .where(eq(insReco.id, recoId))
      .limit(1);

    expect(updatedReco[0]?.status).toBe('PLANNED');
    expect(updatedReco[0]?.updatedBy).toBe(userId);
  });

  it('should get open anomalies correctly', async () => {
    // First scan to create anomalies
    await service.scanAnomalies(companyId, 'run-1');

    const anomalies = await service.getOpenAnomalies(companyId);

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies.every(a => a.closedAt === null)).toBe(true);
    expect(anomalies.every(a => a.companyId === companyId)).toBe(true);
  });

  it('should get recommendations by status correctly', async () => {
    // First scan to create recommendations
    await service.scanAnomalies(companyId, 'run-1');

    const openRecos = await service.getRecommendations(companyId, 'OPEN');
    expect(openRecos.length).toBeGreaterThan(0);
    expect(openRecos.every(r => r.status === 'OPEN')).toBe(true);

    const allRecos = await service.getRecommendations(companyId);
    expect(allRecos.length).toBeGreaterThan(0);
  });

  it('should determine severity correctly', async () => {
    // Access private method through type assertion
    const serviceAny = service as any;

    expect(serviceAny.determineSeverity(0.8)).toBe('HIGH');
    expect(serviceAny.determineSeverity(0.5)).toBe('MEDIUM');
    expect(serviceAny.determineSeverity(0.2)).toBe('LOW');
  });

  it('should calculate anomaly scores correctly', async () => {
    // Access private methods through type assertion
    const serviceAny = service as any;

    expect(serviceAny.calculateTaskAnomalyScore(3)).toBe(0.9);
    expect(serviceAny.calculateControlAnomalyScore(2, 1)).toBe(0.7);
    expect(serviceAny.calculateFluxAnomalyScore(0.3)).toBe(0.7);
    expect(serviceAny.calculateDurationAnomalyScore(6, 5)).toBe(0.2);
  });
});
