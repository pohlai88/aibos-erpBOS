import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ControlsAdminService } from '@/services/controls/admin';
import { ControlsRunnerService } from '@/services/controls/runner';
import { ControlsExceptionsService } from '@/services/controls/exceptions';
import { CertificationsService } from '@/services/controls/certs';
import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and } from 'drizzle-orm';
import {
  ctrlControl,
  ctrlAssignment,
  ctrlRun,
  ctrlResult,
  ctrlException,
  ctrlEvidence,
  certStatement,
  certSignoff,
  closeRun,
} from '@aibos/db-adapter/schema';

describe('M26.1 Auto-Controls & Certifications', () => {
  const companyId = 'test-company-' + ulid();
  const userId = 'test-user-' + ulid();
  const runId = 'test-run-' + ulid();

  let adminService: ControlsAdminService;
  let runnerService: ControlsRunnerService;
  let exceptionsService: ControlsExceptionsService;
  let certsService: CertificationsService;

  beforeEach(async () => {
    adminService = new ControlsAdminService();
    runnerService = new ControlsRunnerService();
    exceptionsService = new ControlsExceptionsService();
    certsService = new CertificationsService();

    // Create test close run
    await db.insert(closeRun).values({
      id: runId,
      companyId,
      year: 2025,
      month: 1,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      owner: 'ops',
      createdBy: userId,
      updatedBy: userId,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(certSignoff);
    await db.delete(certStatement);
    await db.delete(ctrlEvidence);
    await db.delete(ctrlException);
    await db.delete(ctrlResult);
    await db.delete(ctrlRun);
    await db.delete(ctrlAssignment);
    await db.delete(ctrlControl);
    await db.delete(closeRun);
  });

  describe('ControlsAdminService', () => {
    it('should create and query controls', async () => {
      const controlData = {
        code: 'TEST_CONTROL',
        name: 'Test Control',
        purpose: 'Test purpose',
        domain: 'CLOSE' as const,
        frequency: 'PER_RUN' as const,
        severity: 'HIGH' as const,
        auto_kind: 'SCRIPT' as const,
        auto_config: { script: 'JE_CONTINUITY', year: 2025, month: 1 },
        evidence_required: true,
        status: 'ACTIVE' as const,
      };

      const control = await adminService.upsertControl(
        companyId,
        userId,
        controlData
      );

      expect(control.code).toBe('TEST_CONTROL');
      expect(control.name).toBe('Test Control');
      expect(control.domain).toBe('CLOSE');
      expect(control.severity).toBe('HIGH');

      const controls = await adminService.queryControls(companyId, {
        domain: 'CLOSE',
        limit: 10,
        offset: 0,
      });

      expect(controls.length).toBe(1);
      expect(controls[0]?.code).toBe('TEST_CONTROL');
    });

    it('should create and query assignments', async () => {
      // First create a control
      const control = await adminService.upsertControl(companyId, userId, {
        code: 'TEST_CONTROL',
        name: 'Test Control',
        purpose: 'Test purpose',
        domain: 'CLOSE' as const,
        frequency: 'PER_RUN' as const,
        severity: 'HIGH' as const,
        auto_kind: 'SCRIPT' as const,
        evidence_required: true,
      });

      const assignmentData = {
        control_id: control.id,
        run_id: runId,
        owner: 'ops',
        approver: 'controller',
        sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        active: true,
      };

      const assignment = await adminService.upsertAssignment(
        companyId,
        userId,
        assignmentData
      );

      expect(assignment.control_id).toBe(control.id);
      expect(assignment.run_id).toBe(runId);
      expect(assignment.owner).toBe('ops');
      expect(assignment.approver).toBe('controller');

      const assignments = await adminService.queryAssignments(companyId, {
        run_id: runId,
        limit: 10,
        offset: 0,
      });

      expect(assignments.length).toBe(1);
      expect(assignments[0]?.control_id).toBe(control.id);
    });
  });

  describe('ControlsRunnerService', () => {
    it('should execute control runs and handle results', async () => {
      // Create a control
      const control = await adminService.upsertControl(companyId, userId, {
        code: 'JE_CONTINUITY',
        name: 'Journal Entry Continuity',
        purpose: 'Check for gaps in JE sequence',
        domain: 'CLOSE' as const,
        frequency: 'PER_RUN' as const,
        severity: 'HIGH' as const,
        auto_kind: 'SCRIPT' as const,
        auto_config: { script: 'JE_CONTINUITY', year: 2025, month: 1 },
        evidence_required: true,
      });

      const runData = {
        control_id: control.id,
        run_id: runId,
        scheduled_at: new Date().toISOString(),
      };

      const run = await runnerService.executeControlRun(
        companyId,
        userId,
        runData
      );

      expect(run.control_id).toBe(control.id);
      expect(run.run_id).toBe(runId);
      expect(['PASS', 'FAIL', 'WAIVED']).toContain(run.status);

      const runs = await runnerService.queryControlRuns(companyId, {
        control_id: control.id,
        limit: 10,
        offset: 0,
      });

      expect(runs.length).toBe(1);
      expect(runs[0]?.id).toBe(run.id);
    });

    it('should add evidence to control runs', async () => {
      // Create a control and run
      const control = await adminService.upsertControl(companyId, userId, {
        code: 'TEST_CONTROL',
        name: 'Test Control',
        purpose: 'Test purpose',
        domain: 'CLOSE' as const,
        frequency: 'PER_RUN' as const,
        severity: 'HIGH' as const,
        auto_kind: 'SCRIPT' as const,
        auto_config: { script: 'JE_CONTINUITY', year: 2025, month: 1 },
        evidence_required: true,
      });

      const run = await runnerService.executeControlRun(companyId, userId, {
        control_id: control.id,
        run_id: runId,
      });

      const evidenceData = {
        ctrl_run_id: run.id,
        kind: 'NOTE' as const,
        uri_or_note: 'Test evidence note',
      };

      const evidence = await runnerService.addEvidence(
        companyId,
        userId,
        evidenceData
      );

      expect(evidence.ctrl_run_id).toBe(run.id);
      expect(evidence.kind).toBe('NOTE');
      expect(evidence.uri_or_note).toBe('Test evidence note');
    });
  });

  describe('ControlsExceptionsService', () => {
    it('should manage exception remediation', async () => {
      // Create a control and run that fails
      const control = await adminService.upsertControl(companyId, userId, {
        code: 'TEST_CONTROL',
        name: 'Test Control',
        purpose: 'Test purpose',
        domain: 'CLOSE' as const,
        frequency: 'PER_RUN' as const,
        severity: 'HIGH' as const,
        auto_kind: 'SCRIPT' as const,
        auto_config: { script: 'JE_CONTINUITY', year: 2025, month: 1 },
        evidence_required: true,
      });

      const run = await runnerService.executeControlRun(companyId, userId, {
        control_id: control.id,
        run_id: runId,
      });

      // Get exceptions from the run
      const exceptions = await exceptionsService.queryExceptions(companyId, {
        ctrl_run_id: run.id,
        limit: 10,
        offset: 0,
      });

      if (exceptions.length > 0) {
        const exception = exceptions[0];

        const updateData = {
          id: exception!.id,
          remediation_state: 'IN_PROGRESS' as const,
          assignee: 'test-user',
          resolution_note: 'Working on resolution',
        };

        const updatedException = await exceptionsService.updateException(
          companyId,
          userId,
          updateData
        );

        expect(updatedException.remediation_state).toBe('IN_PROGRESS');
        expect(updatedException.assignee).toBe('test-user');
        expect(updatedException.resolution_note).toBe('Working on resolution');
      }
    });

    it('should provide open exceptions summary', async () => {
      const summary =
        await exceptionsService.getOpenExceptionsSummary(companyId);

      expect(summary).toHaveProperty('total_open');
      expect(summary).toHaveProperty('material_open');
      expect(summary).toHaveProperty('sla_breaches');
      expect(summary).toHaveProperty('by_remediation_state');
      expect(summary).toHaveProperty('by_severity');
    });
  });

  describe('CertificationsService', () => {
    it('should manage certification templates', async () => {
      const templateData = {
        code: 'MANAGER_STD',
        text: 'I certify that the financial statements are accurate and complete.',
        level: 'ENTITY' as const,
        active: true,
      };

      const template = await certsService.upsertCertTemplate(
        companyId,
        userId,
        templateData
      );

      expect(template.code).toBe('MANAGER_STD');
      expect(template.text).toBe(
        'I certify that the financial statements are accurate and complete.'
      );
      expect(template.level).toBe('ENTITY');
      expect(template.active).toBe(true);

      const templates = await certsService.queryCertTemplates(companyId, {
        level: 'ENTITY',
        limit: 10,
        offset: 0,
      });

      expect(templates.length).toBe(1);
      expect(templates[0]?.code).toBe('MANAGER_STD');
    });

    it('should handle certification sign-offs', async () => {
      // Create a certification template
      const template = await certsService.upsertCertTemplate(
        companyId,
        userId,
        {
          code: 'MANAGER_STD',
          text: 'I certify that the financial statements are accurate and complete.',
          level: 'ENTITY' as const,
          active: true,
        }
      );

      // Generate snapshot
      const snapshot = await certsService.generateCertificationSnapshot(
        companyId,
        runId,
        'ENTITY'
      );

      const signoffData = {
        run_id: runId,
        level: 'ENTITY' as const,
        statement_id: template.id,
        signer_role: 'MANAGER' as const,
        signer_name: 'Jane Manager',
        snapshot_uri: snapshot.snapshot_uri,
        checksum: snapshot.checksum,
      };

      const signoff = await certsService.signCertification(
        companyId,
        userId,
        signoffData
      );

      expect(signoff.run_id).toBe(runId);
      expect(signoff.level).toBe('ENTITY');
      expect(signoff.signer_role).toBe('MANAGER');
      expect(signoff.signer_name).toBe('Jane Manager');
      expect(signoff.statement_id).toBe(template.id);

      const signoffs = await certsService.queryCertSignoffs(companyId, {
        run_id: runId,
        limit: 10,
        offset: 0,
      });

      expect(signoffs.length).toBe(1);
      expect(signoffs[0]?.id).toBe(signoff.id);
    });

    it('should provide certification status', async () => {
      const status = await certsService.getCertificationStatus(
        companyId,
        runId
      );

      expect(status.run_id).toBe(runId);
      expect(status).toHaveProperty('entity_level');
      expect(status).toHaveProperty('consolidated_level');
      expect(status).toHaveProperty('all_required_signed');
      expect(status.all_required_signed).toBe(false); // No sign-offs yet
    });
  });

  describe('Auto-Control Library', () => {
    it('should execute JE continuity check', async () => {
      const { jeContinuity } = await import('@/services/controls/auto');

      const result = await jeContinuity(companyId, 2025, 1);

      expect(['PASS', 'FAIL', 'WAIVED']).toContain(result.status);
      expect(result).toHaveProperty('detail');
      expect(result).toHaveProperty('exceptions');
      expect(Array.isArray(result.exceptions)).toBe(true);
    });

    it('should execute subledger tie-out check', async () => {
      const { subledgerTieout } = await import('@/services/controls/auto');

      const result = await subledgerTieout(companyId, 2025, 1, 'AP', 1000);

      expect(['PASS', 'FAIL', 'WAIVED']).toContain(result.status);
      expect(result.detail).toHaveProperty('domain', 'AP');
      expect(result.detail).toHaveProperty('materiality_threshold', 1000);
    });

    it('should execute bank reconciliation check', async () => {
      const { bankReconDiff } = await import('@/services/controls/auto');

      const result = await bankReconDiff(companyId, 2025, 1, 500);

      expect(['PASS', 'FAIL', 'WAIVED']).toContain(result.status);
      expect(result.detail).toHaveProperty('materiality_threshold', 500);
    });
  });
});
