import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InsightsHarvestService } from '@/services/insights/harvest';
import { db } from '@/lib/db';
import {
  insFactClose,
  insFactTask,
  insFactCtrl,
  insFactFlux,
  insFactCert,
  closeRun,
  closeTask,
  ctrlRun,
  ctrlControl,
  ctrlException,
  ctrlEvidence,
  fluxRun,
  fluxLine,
  fluxComment,
  certSignoff,
} from '@aibos/db-adapter/schema';
import { eq, and } from 'drizzle-orm';

describe('InsightsHarvestService', () => {
  const companyId = 'test-company';
  const userId = 'test-user';
  let service: InsightsHarvestService;

  beforeEach(async () => {
    service = new InsightsHarvestService();
    // Clean up test data
    await db.delete(insFactCert);
    await db.delete(insFactFlux);
    await db.delete(insFactCtrl);
    await db.delete(insFactTask);
    await db.delete(insFactClose);
    await db.delete(certSignoff);
    await db.delete(fluxComment);
    await db.delete(fluxLine);
    await db.delete(fluxRun);
    await db.delete(ctrlEvidence);
    await db.delete(ctrlException);
    await db.delete(ctrlRun);
    await db.delete(ctrlControl);
    await db.delete(closeTask);
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

    // Create test tasks
    await db.insert(closeTask).values([
      {
        id: 'task-1',
        runId: 'run-1',
        code: 'JE_CUTOFF',
        title: 'Journal Entry Cutoff',
        owner: 'accounting',
        slaDueAt: new Date('2025-01-02T00:00:00Z'),
        status: 'DONE',
        priority: 1,
        tags: ['critical'],
        evidenceRequired: true,
        approver: 'manager',
        updatedBy: userId,
      },
      {
        id: 'task-2',
        runId: 'run-1',
        code: 'BANK_REC',
        title: 'Bank Reconciliation',
        owner: 'accounting',
        slaDueAt: new Date('2025-01-03T00:00:00Z'),
        status: 'DONE',
        priority: 2,
        tags: ['important'],
        evidenceRequired: false,
        updatedBy: userId,
      },
    ]);

    // Create test control
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

    // Create test control run
    await db.insert(ctrlRun).values({
      id: 'ctrl-run-1',
      companyId,
      controlId: 'ctrl-1',
      runId: 'run-1',
      scheduledAt: new Date('2025-01-01T00:00:00Z'),
      startedAt: new Date('2025-01-01T01:00:00Z'),
      finishedAt: new Date('2025-01-01T01:30:00Z'),
      status: 'PASS',
      notes: 'Control passed successfully',
      createdBy: userId,
    });

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

    // Create test flux lines
    await db.insert(fluxLine).values([
      {
        id: 'flux-line-1',
        runId: 'flux-run-1',
        accountCode: '4000',
        dimKey: 'CC-OPS',
        baseAmount: '100000',
        cmpAmount: '110000',
        delta: '10000',
        deltaPct: '0.1',
        requiresComment: true,
        material: true,
      },
      {
        id: 'flux-line-2',
        runId: 'flux-run-1',
        accountCode: '5000',
        dimKey: 'CC-OPS',
        baseAmount: '50000',
        cmpAmount: '45000',
        delta: '-5000',
        deltaPct: '-0.1',
        requiresComment: false,
        material: false,
      },
    ]);

    // Create test certification
    await db.insert(certSignoff).values({
      id: 'cert-1',
      companyId,
      runId: 'run-1',
      level: 'ENTITY',
      signerRole: 'MANAGER',
      signerName: 'John Manager',
      signedAt: new Date('2025-01-05T00:00:00Z'),
      statementId: 'stmt-1',
      statementText: 'I certify the financial statements',
      snapshotUri: 'https://example.com/snapshot.pdf',
      checksum: 'abc123',
      createdBy: userId,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(insFactCert);
    await db.delete(insFactFlux);
    await db.delete(insFactCtrl);
    await db.delete(insFactTask);
    await db.delete(insFactClose);
    await db.delete(certSignoff);
    await db.delete(fluxComment);
    await db.delete(fluxLine);
    await db.delete(fluxRun);
    await db.delete(ctrlEvidence);
    await db.delete(ctrlException);
    await db.delete(ctrlRun);
    await db.delete(ctrlControl);
    await db.delete(closeTask);
    await db.delete(closeRun);
  });

  it('should harvest facts idempotently', async () => {
    // First harvest
    const result1 = await service.harvestFacts(companyId, 'run-1');
    expect(result1.success).toBe(true);
    expect(result1.facts_created.close).toBe(1);
    expect(result1.facts_created.task).toBe(2);
    expect(result1.facts_created.ctrl).toBe(1);
    expect(result1.facts_created.flux).toBe(1);
    expect(result1.facts_created.cert).toBe(1);

    // Second harvest should be idempotent
    const result2 = await service.harvestFacts(companyId, 'run-1');
    expect(result2.success).toBe(true);
    expect(result2.facts_created.close).toBe(0); // No new close facts
    expect(result2.facts_created.task).toBe(2); // Tasks still created
    expect(result2.facts_created.ctrl).toBe(1); // Controls still created
    expect(result2.facts_created.flux).toBe(1); // Flux still created
    expect(result2.facts_created.cert).toBe(1); // Certs still created
  });

  it('should compute correct close facts', async () => {
    await service.harvestFacts(companyId, 'run-1');

    const closeFacts = await db
      .select()
      .from(insFactClose)
      .where(eq(insFactClose.runId, 'run-1'));

    expect(closeFacts).toHaveLength(1);
    expect(parseFloat(closeFacts[0]?.daysToClose || '0')).toBe(4); // 4 days from Jan 1 to Jan 5
    expect(parseFloat(closeFacts[0]?.onTimeRate || '0')).toBe(100); // Both tasks completed on time
    expect(closeFacts[0]?.lateTasks).toBe(0);
    expect(closeFacts[0]?.exceptionsOpen).toBe(0);
    expect(closeFacts[0]?.exceptionsMaterial).toBe(0);
    expect(closeFacts[0]?.certsDone).toBe(1);
  });

  it('should compute correct task facts', async () => {
    await service.harvestFacts(companyId, 'run-1');

    const taskFacts = await db
      .select()
      .from(insFactTask)
      .where(eq(insFactTask.runId, 'run-1'));

    expect(taskFacts).toHaveLength(2);

    const jeTask = taskFacts.find(t => t.code === 'JE_CUTOFF');
    expect(jeTask).toBeDefined();
    expect(jeTask?.status).toBe('DONE');
    expect(jeTask?.breached).toBe(false);
    expect(parseFloat(jeTask?.ageHours || '0')).toBeGreaterThan(0);

    const bankTask = taskFacts.find(t => t.code === 'BANK_REC');
    expect(bankTask).toBeDefined();
    expect(bankTask?.status).toBe('DONE');
    expect(bankTask?.breached).toBe(false);
  });

  it('should compute correct control facts', async () => {
    await service.harvestFacts(companyId, 'run-1');

    const ctrlFacts = await db
      .select()
      .from(insFactCtrl)
      .where(eq(insFactCtrl.ctrlRunId, 'ctrl-run-1'));

    expect(ctrlFacts).toHaveLength(1);
    expect(ctrlFacts[0]?.controlCode).toBe('BANK_REC_CTRL');
    expect(ctrlFacts[0]?.status).toBe('PASS');
    expect(ctrlFacts[0]?.severity).toBe('HIGH');
    expect(ctrlFacts[0]?.exceptionsCount).toBe(0);
    expect(ctrlFacts[0]?.waived).toBe(0);
    expect(ctrlFacts[0]?.evidenceCount).toBe(0);
    expect(ctrlFacts[0]?.durationMs).toBe(1800000); // 30 minutes
    expect(ctrlFacts[0]?.materialFail).toBe(false);
  });

  it('should compute correct flux facts', async () => {
    await service.harvestFacts(companyId, 'run-1');

    const fluxFacts = await db
      .select()
      .from(insFactFlux)
      .where(eq(insFactFlux.fluxRunId, 'flux-run-1'));

    expect(fluxFacts).toHaveLength(1);
    expect(fluxFacts[0]?.scope).toBe('2024'); // Base year as scope
    expect(fluxFacts[0]?.presentCcy).toBe('USD');
    expect(fluxFacts[0]?.material).toBe(1); // One material line
    expect(fluxFacts[0]?.commentMissing).toBe(1); // One missing comment
    expect(parseFloat(fluxFacts[0]?.topDeltaAbs || '0')).toBe(10000); // Largest absolute delta
    expect(parseFloat(fluxFacts[0]?.topDeltaPct || '0')).toBe(0.1); // Corresponding percentage
  });

  it('should compute correct certification facts', async () => {
    await service.harvestFacts(companyId, 'run-1');

    const certFacts = await db
      .select()
      .from(insFactCert)
      .where(eq(insFactCert.runId, 'run-1'));

    expect(certFacts).toHaveLength(1);
    expect(certFacts[0]?.level).toBe('ENTITY');
    expect(certFacts[0]?.signerRole).toBe('MANAGER');
    expect(certFacts[0]?.signedAt).toEqual(new Date('2025-01-05T00:00:00Z'));
  });

  it('should handle missing flux and certs gracefully', async () => {
    // Create a run without flux or certs
    await db.insert(closeRun).values({
      id: 'run-empty',
      companyId,
      year: 2025,
      month: 2,
      status: 'PUBLISHED',
      startedAt: new Date('2025-02-01T00:00:00Z'),
      closedAt: new Date('2025-02-03T00:00:00Z'),
      owner: 'ops',
      createdBy: userId,
      updatedBy: userId,
    });

    const result = await service.harvestFacts(companyId, 'run-empty');
    expect(result.success).toBe(true);
    expect(result.facts_created.close).toBe(1);
    expect(result.facts_created.task).toBe(0);
    expect(result.facts_created.ctrl).toBe(0);
    expect(result.facts_created.flux).toBe(0);
    expect(result.facts_created.cert).toBe(0);
  });
});
