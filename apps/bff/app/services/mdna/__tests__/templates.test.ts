import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MdnaService } from '@/services/mdna/templates';
import { db } from '@/lib/db';
import {
  mdnaTemplate,
  mdnaDraft,
  mdnaPublish,
  closeRun,
} from '@aibos/db-adapter/schema';
import { eq, and } from 'drizzle-orm';

describe('MdnaService', () => {
  const companyId = 'test-company';
  const userId = 'test-user';
  let service: MdnaService;

  beforeEach(async () => {
    service = new MdnaService();
    // Clean up test data
    await db.delete(mdnaPublish);
    await db.delete(mdnaDraft);
    await db.delete(mdnaTemplate);
    await db.delete(closeRun);

    // Create test close runs
    await db.insert(closeRun).values([
      {
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
      },
      {
        id: 'run-2',
        companyId,
        year: 2025,
        month: 2,
        status: 'PUBLISHED',
        startedAt: new Date('2025-02-01T00:00:00Z'),
        closedAt: new Date('2025-02-03T00:00:00Z'),
        owner: 'ops',
        createdBy: userId,
        updatedBy: userId,
      },
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(mdnaPublish);
    await db.delete(mdnaDraft);
    await db.delete(mdnaTemplate);
    await db.delete(closeRun);
  });

  describe('upsertTemplate', () => {
    it('should create a new MD&A template', async () => {
      const data = {
        name: 'Monthly MD&A Template',
        sections: {
          executive_summary: 'Executive Summary',
          financial_highlights: 'Financial Highlights',
          operational_review: 'Operational Review',
        },
        variables: {
          revenue_growth: 'Revenue Growth %',
          profit_margin: 'Profit Margin %',
          cash_position: 'Cash Position',
        },
      };

      const template = await service.upsertTemplate(companyId, userId, data);

      expect(template.company_id).toBe(companyId);
      expect(template.name).toBe('Monthly MD&A Template');
      expect(template.sections).toEqual(data.sections);
      expect(template.variables).toEqual(data.variables);
      expect(template.status).toBe('DRAFT');
    });
  });

  describe('queryTemplates', () => {
    it('should query templates correctly', async () => {
      // Create test templates
      await db.insert(mdnaTemplate).values([
        {
          id: 'template-1',
          companyId,
          name: 'Template 1',
          sections: {},
          variables: {},
          status: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
        },
        {
          id: 'template-2',
          companyId,
          name: 'Template 2',
          sections: {},
          variables: {},
          status: 'APPROVED',
          createdBy: userId,
          updatedBy: userId,
        },
      ]);

      const query = {
        status: 'APPROVED' as const,
        limit: 10,
        offset: 0,
      };

      const templates = await service.queryTemplates(companyId, query);

      expect(templates.length).toBe(1);
      expect(templates[0]?.status).toBe('APPROVED');
    });
  });

  describe('approveTemplate', () => {
    it('should approve a template', async () => {
      // Create a template
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'DRAFT',
        createdBy: userId,
        updatedBy: userId,
      });

      await service.approveTemplate(companyId, 'template-1', userId);

      const template = await db
        .select()
        .from(mdnaTemplate)
        .where(
          and(
            eq(mdnaTemplate.id, 'template-1'),
            eq(mdnaTemplate.companyId, companyId)
          )
        )
        .limit(1);

      expect(template[0]?.status).toBe('APPROVED');
    });
  });

  describe('createDraft', () => {
    it('should create a new MD&A draft', async () => {
      // Create a template first
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      const data = {
        template_id: 'template-1',
        run_id: 'run-1',
        content: {
          executive_summary: 'Test summary',
          financial_highlights: 'Test highlights',
        },
        variables: {
          revenue_growth: '15%',
          profit_margin: '12%',
        },
      };

      const draft = await service.createDraft(companyId, userId, data);

      expect(draft.company_id).toBe(companyId);
      expect(draft.template_id).toBe('template-1');
      expect(draft.run_id).toBe('run-1');
      expect(draft.content).toEqual(data.content);
      expect(draft.variables).toEqual(data.variables);
      expect(draft.status).toBe('EDITING');
    });
  });

  describe('updateDraft', () => {
    it('should update an existing draft', async () => {
      // Create template and draft
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      const draftData = {
        template_id: 'template-1',
        content: { initial: 'content' },
        variables: { initial: 'variables' },
      };

      const draft = await service.createDraft(companyId, userId, draftData);

      const updateData = {
        content: { updated: 'content' },
        variables: { updated: 'variables' },
      };

      const updatedDraft = await service.updateDraft(
        companyId,
        draft.id,
        userId,
        updateData
      );

      expect(updatedDraft.content).toEqual(updateData.content);
      expect(updatedDraft.variables).toEqual(updateData.variables);
    });
  });

  describe('queryDrafts', () => {
    it('should query drafts correctly', async () => {
      // Create template and drafts
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      await db.insert(mdnaDraft).values([
        {
          id: 'draft-1',
          companyId,
          templateId: 'template-1',
          runId: 'run-1',
          content: {},
          variables: {},
          status: 'EDITING',
          createdBy: userId,
          updatedBy: userId,
        },
        {
          id: 'draft-2',
          companyId,
          templateId: 'template-1',
          runId: 'run-2',
          content: {},
          variables: {},
          status: 'APPROVED',
          createdBy: userId,
          updatedBy: userId,
        },
      ]);

      const query = {
        template_id: 'template-1',
        status: 'APPROVED' as const,
        limit: 10,
        offset: 0,
      };

      const drafts = await service.queryDrafts(companyId, query);

      expect(drafts.length).toBe(1);
      expect(drafts[0]?.status).toBe('APPROVED');
    });
  });

  describe('approveDraft', () => {
    it('should approve a draft', async () => {
      // Create template and draft
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      const draftData = {
        template_id: 'template-1',
        content: {},
        variables: {},
      };

      const draft = await service.createDraft(companyId, userId, draftData);

      await service.approveDraft(companyId, draft.id, userId);

      const updatedDraft = await db
        .select()
        .from(mdnaDraft)
        .where(
          and(eq(mdnaDraft.id, draft.id), eq(mdnaDraft.companyId, companyId))
        )
        .limit(1);

      expect(updatedDraft[0]?.status).toBe('APPROVED');
    });
  });

  describe('publishMdna', () => {
    it('should publish an approved draft', async () => {
      // Create template and approved draft
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      const draftData = {
        template_id: 'template-1',
        content: { test: 'content' },
        variables: { test: 'variables' },
      };

      const draft = await service.createDraft(companyId, userId, draftData);
      await service.approveDraft(companyId, draft.id, userId);

      const publishData = {
        draft_id: draft.id,
        run_id: 'run-1',
      };

      const published = await service.publishMdna(
        companyId,
        userId,
        publishData
      );

      expect(published.company_id).toBe(companyId);
      expect(published.draft_id).toBe(draft.id);
      expect(published.run_id).toBe('run-1');
      expect(published.html_uri).toBeDefined();
      expect(published.checksum).toBeDefined();
      expect(published.published_by).toBe(userId);
    });

    it('should create draft from template if draft_id not provided', async () => {
      // Create approved template
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      const publishData = {
        template_id: 'template-1',
        run_id: 'run-1',
      };

      const published = await service.publishMdna(
        companyId,
        userId,
        publishData
      );

      expect(published.company_id).toBe(companyId);
      expect(published.run_id).toBe('run-1');
      expect(published.html_uri).toBeDefined();
      expect(published.checksum).toBeDefined();
    });

    it('should throw error for non-approved draft', async () => {
      // Create template and draft
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      const draftData = {
        template_id: 'template-1',
        content: {},
        variables: {},
      };

      const draft = await service.createDraft(companyId, userId, draftData);

      const publishData = {
        draft_id: draft.id,
        run_id: 'run-1',
      };

      await expect(
        service.publishMdna(companyId, userId, publishData)
      ).rejects.toThrow('must be approved before publishing');
    });
  });

  describe('queryPublished', () => {
    it('should query published reports correctly', async () => {
      // Create template, draft, and published report
      await db.insert(mdnaTemplate).values({
        id: 'template-1',
        companyId,
        name: 'Test Template',
        sections: {},
        variables: {},
        status: 'APPROVED',
        createdBy: userId,
        updatedBy: userId,
      });

      const draftData = {
        template_id: 'template-1',
        content: {},
        variables: {},
      };

      const draft = await service.createDraft(companyId, userId, draftData);
      await service.approveDraft(companyId, draft.id, userId);

      const publishData = {
        draft_id: draft.id,
        run_id: 'run-1',
      };

      await service.publishMdna(companyId, userId, publishData);

      const query = {
        run_id: 'run-1',
        limit: 10,
        offset: 0,
      };

      const published = await service.queryPublished(companyId, query);

      expect(published.length).toBe(1);
      expect(published[0]?.run_id).toBe('run-1');
      expect(published[0]?.draft_id).toBe(draft.id);
    });
  });
});
