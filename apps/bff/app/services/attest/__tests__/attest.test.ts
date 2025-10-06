import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AttestProgramsService } from '@/services/attest/programs';
import { AttestCampaignService } from '@/services/attest/campaign';
import { AttestTasksService } from '@/services/attest/tasks';
import { AttestPackService } from '@/services/attest/pack';
import { AttestSlaService } from '@/services/attest/sla';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  attestProgram,
  attestTemplate,
  attestAssignment,
  attestCampaign,
  attestTask,
} from '@aibos/db-adapter/schema';

describe('M26.7 Attestations Portal', () => {
  const testCompanyId = 'test-company-123';
  const testUserId = 'test-user-123';
  const testAssigneeId = 'test-assignee-123';

  beforeEach(async () => {
    // Clean up any existing test data
    await db.delete(attestTask).where(eq(attestTask.companyId, testCompanyId));
    await db
      .delete(attestCampaign)
      .where(eq(attestCampaign.companyId, testCompanyId));
    await db
      .delete(attestAssignment)
      .where(eq(attestAssignment.companyId, testCompanyId));
    await db
      .delete(attestTemplate)
      .where(eq(attestTemplate.companyId, testCompanyId));
    await db
      .delete(attestProgram)
      .where(eq(attestProgram.companyId, testCompanyId));
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(attestTask).where(eq(attestTask.companyId, testCompanyId));
    await db
      .delete(attestCampaign)
      .where(eq(attestCampaign.companyId, testCompanyId));
    await db
      .delete(attestAssignment)
      .where(eq(attestAssignment.companyId, testCompanyId));
    await db
      .delete(attestTemplate)
      .where(eq(attestTemplate.companyId, testCompanyId));
    await db
      .delete(attestProgram)
      .where(eq(attestProgram.companyId, testCompanyId));
  });

  describe('AttestProgramsService', () => {
    it('should create and list attestation programs', async () => {
      const programsService = new AttestProgramsService();

      // Create a program
      const programData = {
        code: 'TEST-302',
        name: 'Test SOX 302 Program',
        freq: 'QUARTERLY' as const,
        scope: ['PROCESS:R2R', 'PROCESS:P2P'],
        active: true,
      };

      const createdProgram = await programsService.upsertProgram(
        testCompanyId,
        testUserId,
        programData
      );

      expect(createdProgram).toBeDefined();
      expect(createdProgram.code).toBe('TEST-302');
      expect(createdProgram.name).toBe('Test SOX 302 Program');
      expect(createdProgram.freq).toBe('QUARTERLY');

      // List programs
      const programs = await programsService.listPrograms(testCompanyId);
      expect(programs.programs).toHaveLength(1);
      expect(programs.programs[0]!.code).toBe('TEST-302');
    });

    it('should create and list attestation templates', async () => {
      const programsService = new AttestProgramsService();

      // Create a template
      const templateData = {
        code: 'TEST-TEMPLATE',
        title: 'Test Template',
        version: 1,
        schema: {
          version: 1,
          questions: [
            {
              id: 'q1',
              label: 'Test question?',
              type: 'YN' as const,
              requireEvidence: false,
              required: true,
            },
          ],
        },
        requiresEvidence: false,
        status: 'ACTIVE' as const,
      };

      const createdTemplate = await programsService.upsertTemplate(
        testCompanyId,
        testUserId,
        templateData
      );

      expect(createdTemplate).toBeDefined();
      expect(createdTemplate.code).toBe('TEST-TEMPLATE');
      expect(createdTemplate.title).toBe('Test Template');

      // List templates
      const templates = await programsService.listTemplates(testCompanyId);
      expect(templates.templates).toHaveLength(1);
      expect(templates.templates[0]!.code).toBe('TEST-TEMPLATE');
    });

    it('should create and list attestation assignments', async () => {
      const programsService = new AttestProgramsService();

      // First create a program
      const programData = {
        code: 'TEST-302',
        name: 'Test SOX 302 Program',
        freq: 'QUARTERLY' as const,
        scope: ['PROCESS:R2R'],
        active: true,
      };

      await programsService.upsertProgram(
        testCompanyId,
        testUserId,
        programData
      );

      // Create an assignment
      const assignmentData = {
        programCode: 'TEST-302',
        scopeKey: 'PROCESS:R2R',
        assigneeId: testAssigneeId,
        approverId: testUserId,
      };

      const createdAssignment = await programsService.upsertAssignment(
        testCompanyId,
        testUserId,
        assignmentData
      );

      expect(createdAssignment).toBeDefined();
      expect(createdAssignment.scopeKey).toBe('PROCESS:R2R');
      expect(createdAssignment.assigneeId).toBe(testAssigneeId);

      // List assignments
      const assignments = await programsService.listAssignments(testCompanyId);
      expect(assignments.assignments).toHaveLength(1);
      expect(assignments.assignments[0]!.scopeKey).toBe('PROCESS:R2R');
    });
  });

  describe('AttestCampaignService', () => {
    it('should issue a campaign and create tasks', async () => {
      const programsService = new AttestProgramsService();
      const campaignService = new AttestCampaignService();

      // Create program and template
      const programData = {
        code: 'TEST-302',
        name: 'Test SOX 302 Program',
        freq: 'QUARTERLY' as const,
        scope: ['PROCESS:R2R'],
        active: true,
      };

      await programsService.upsertProgram(
        testCompanyId,
        testUserId,
        programData
      );

      const templateData = {
        code: 'TEST-TEMPLATE',
        title: 'Test Template',
        version: 1,
        schema: {
          version: 1,
          questions: [
            {
              id: 'q1',
              label: 'Test question?',
              type: 'YN' as const,
              requireEvidence: false,
              required: true,
            },
          ],
        },
        requiresEvidence: false,
        status: 'ACTIVE' as const,
      };

      await programsService.upsertTemplate(
        testCompanyId,
        testUserId,
        templateData
      );

      // Create assignment
      const assignmentData = {
        programCode: 'TEST-302',
        scopeKey: 'PROCESS:R2R',
        assigneeId: testAssigneeId,
        approverId: testUserId,
      };

      await programsService.upsertAssignment(
        testCompanyId,
        testUserId,
        assignmentData
      );

      // Issue campaign
      const campaignData = {
        programCode: 'TEST-302',
        templateCode: 'TEST-TEMPLATE',
        period: '2025-Q1',
        dueAt: '2025-04-15T16:00:00Z',
        meta: {},
      };

      const createdCampaign = await campaignService.issueCampaign(
        testCompanyId,
        testUserId,
        campaignData
      );

      expect(createdCampaign).toBeDefined();
      expect(createdCampaign.period).toBe('2025-Q1');
      expect(createdCampaign.state).toBe('ISSUED');

      // Verify tasks were created
      const tasksService = new AttestTasksService();
      const tasks = await tasksService.listTasks(testCompanyId, {
        campaignId: createdCampaign.id,
        limit: 100,
        offset: 0,
      });

      expect(tasks.tasks).toHaveLength(1);
      expect(tasks.tasks[0]!.assigneeId).toBe(testAssigneeId);
      expect(tasks.tasks[0]!.scopeKey).toBe('PROCESS:R2R');
    });
  });

  describe('AttestTasksService', () => {
    it('should submit a task response', async () => {
      const programsService = new AttestProgramsService();
      const campaignService = new AttestCampaignService();
      const tasksService = new AttestTasksService();

      // Setup: Create program, template, assignment, and campaign
      await programsService.upsertProgram(testCompanyId, testUserId, {
        code: 'TEST-302',
        name: 'Test Program',
        freq: 'QUARTERLY' as const,
        scope: ['PROCESS:R2R'],
        active: true,
      });

      await programsService.upsertTemplate(testCompanyId, testUserId, {
        code: 'TEST-TEMPLATE',
        title: 'Test Template',
        version: 1,
        schema: {
          version: 1,
          questions: [
            {
              id: 'q1',
              label: 'Test question?',
              type: 'YN' as const,
              requireEvidence: false,
              required: true,
            },
          ],
        },
        requiresEvidence: false,
        status: 'ACTIVE' as const,
      });

      await programsService.upsertAssignment(testCompanyId, testUserId, {
        programCode: 'TEST-302',
        scopeKey: 'PROCESS:R2R',
        assigneeId: testAssigneeId,
        approverId: testUserId,
      });

      const campaign = await campaignService.issueCampaign(
        testCompanyId,
        testUserId,
        {
          programCode: 'TEST-302',
          templateCode: 'TEST-TEMPLATE',
          period: '2025-Q1',
          dueAt: '2025-04-15T16:00:00Z',
          meta: {},
        }
      );

      const tasks = await tasksService.listTasks(testCompanyId, {
        campaignId: campaign.id,
        limit: 100,
        offset: 0,
      });

      const task = tasks.tasks[0];

      // Submit task response
      const submitData = {
        taskId: task!.id,
        answers: { q1: 'N' },
        exceptions: [],
        evidenceIds: [],
      };

      await tasksService.submitTask(
        task!.id,
        testCompanyId,
        testAssigneeId,
        submitData
      );

      // Verify task state changed
      const updatedTasks = await tasksService.listTasks(testCompanyId, {
        campaignId: campaign.id,
        limit: 100,
        offset: 0,
      });

      expect(updatedTasks.tasks[0]!.state).toBe('SUBMITTED');
      expect(updatedTasks.tasks[0]!.submittedAt).toBeDefined();
    });
  });

  describe('AttestSlaService', () => {
    it('should tick SLA and update task states', async () => {
      const slaService = new AttestSlaService();

      // Create a test task with due date in the past
      const pastDueDate = new Date();
      pastDueDate.setHours(pastDueDate.getHours() - 25); // 25 hours ago

      const taskId = 'test-task-123';
      await db.insert(attestTask).values({
        id: taskId,
        companyId: testCompanyId,
        campaignId: 'test-campaign-123',
        assigneeId: testAssigneeId,
        scopeKey: 'PROCESS:R2R',
        state: 'OPEN',
        dueAt: pastDueDate,
        slaState: 'OK',
        createdBy: testUserId,
        updatedBy: testUserId,
      });

      // Tick SLA
      const result = await slaService.tickSla(undefined, testCompanyId);

      expect(result.updated).toBeGreaterThan(0);
      expect(result.late).toBeGreaterThan(0);

      // Verify task state was updated
      const [updatedTask] = await db
        .select()
        .from(attestTask)
        .where(eq(attestTask.id, taskId));

      expect(updatedTask!.slaState).toBe('LATE');
    });
  });
});
