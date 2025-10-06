import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FluxEngineService } from '@/services/flux/engine';
import { db } from '@/lib/db';
import {
  fluxRun,
  fluxLine,
  fluxComment,
  fluxRule,
} from '@aibos/db-adapter/schema';
import { eq, and } from 'drizzle-orm';

describe('FluxEngineService', () => {
  const companyId = 'test-company';
  const userId = 'test-user';
  let service: FluxEngineService;

  beforeEach(async () => {
    service = new FluxEngineService();
    // Clean up test data
    await db.delete(fluxComment);
    await db.delete(fluxLine);
    await db.delete(fluxRun);
    await db.delete(fluxRule);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(fluxComment);
    await db.delete(fluxLine);
    await db.delete(fluxRun);
    await db.delete(fluxRule);
  });

  describe('runFluxAnalysis', () => {
    it('should run flux analysis successfully', async () => {
      // Create flux rules first
      await db.insert(fluxRule).values({
        id: 'rule-1',
        companyId,
        scope: 'PL',
        dim: 'ACCOUNT',
        thresholdAbs: '5000',
        thresholdPct: '0.05',
        requireComment: true,
        active: true,
        createdBy: userId,
        updatedBy: userId,
      });

      const data = {
        base: { y: 2024, m: 12 },
        cmp: { y: 2025, m: 1 },
        present: 'USD',
        scope: 'PL' as const,
        dim: 'ACCOUNT' as const,
      };

      const run = await service.runFluxAnalysis(companyId, userId, data);

      expect(run.company_id).toBe(companyId);
      expect(run.base_year).toBe(2024);
      expect(run.base_month).toBe(12);
      expect(run.cmp_year).toBe(2025);
      expect(run.cmp_month).toBe(1);
      expect(run.present_ccy).toBe('USD');
      expect(run.status).toBe('COMPLETED');
    });

    it('should handle flux analysis errors gracefully', async () => {
      const data = {
        base: { y: 2024, m: 12 },
        cmp: { y: 2025, m: 1 },
        present: 'USD',
        scope: 'PL' as const,
        dim: 'ACCOUNT' as const,
      };

      // Mock an error in the flux analysis
      const originalGenerateFluxLines = (service as any).generateFluxLines;
      (service as any).generateFluxLines = vi
        .fn()
        .mockRejectedValue(new Error('Mock error'));

      await expect(
        service.runFluxAnalysis(companyId, userId, data)
      ).rejects.toThrow('Mock error');

      // Restore original method
      (service as any).generateFluxLines = originalGenerateFluxLines;
    });
  });

  describe('queryFluxRuns', () => {
    it('should query flux runs correctly', async () => {
      // Create test flux runs
      await db.insert(fluxRun).values([
        {
          id: 'run-1',
          companyId,
          baseYear: 2024,
          baseMonth: 12,
          cmpYear: 2025,
          cmpMonth: 1,
          presentCcy: 'USD',
          status: 'COMPLETED',
          createdBy: userId,
        },
        {
          id: 'run-2',
          companyId,
          baseYear: 2024,
          baseMonth: 11,
          cmpYear: 2024,
          cmpMonth: 12,
          presentCcy: 'USD',
          status: 'COMPLETED',
          createdBy: userId,
        },
      ]);

      const query = {
        company_id: companyId,
        base_year: 2024,
        limit: 10,
        offset: 0,
        material_only: true,
      };

      const runs = await service.queryFluxRuns(companyId, query);

      expect(runs.length).toBe(2);
      expect(runs.every(run => run.company_id === companyId)).toBe(true);
      expect(runs.every(run => run.base_year === 2024)).toBe(true);
    });
  });

  describe('queryFluxLines', () => {
    it('should query flux lines correctly', async () => {
      // Create test flux run and lines
      await db.insert(fluxRun).values({
        id: 'run-1',
        companyId,
        baseYear: 2024,
        baseMonth: 12,
        cmpYear: 2025,
        cmpMonth: 1,
        presentCcy: 'USD',
        status: 'COMPLETED',
        createdBy: userId,
      });

      await db.insert(fluxLine).values([
        {
          id: 'line-1',
          runId: 'run-1',
          accountCode: '4000',
          dimKey: 'REVENUE',
          baseAmount: '100000',
          cmpAmount: '110000',
          delta: '10000',
          deltaPct: '0.10',
          requiresComment: false,
          material: true,
        },
        {
          id: 'line-2',
          runId: 'run-1',
          accountCode: '5000',
          dimKey: 'COGS',
          baseAmount: '60000',
          cmpAmount: '65000',
          delta: '5000',
          deltaPct: '0.083',
          requiresComment: false,
          material: false,
        },
      ]);

      const query = {
        run_id: 'run-1',
        material_only: true,
        limit: 10,
        offset: 0,
      };

      const lines = await service.queryFluxLines(companyId, query);

      expect(lines.length).toBe(1);
      expect(lines[0]?.material).toBe(true);
      expect(lines[0]?.account_code).toBe('4000');
    });
  });

  describe('addFluxComment', () => {
    it('should add comment to flux line', async () => {
      // Create test flux run and line
      await db.insert(fluxRun).values({
        id: 'run-1',
        companyId,
        baseYear: 2024,
        baseMonth: 12,
        cmpYear: 2025,
        cmpMonth: 1,
        presentCcy: 'USD',
        status: 'COMPLETED',
        createdBy: userId,
      });

      await db.insert(fluxLine).values({
        id: 'line-1',
        runId: 'run-1',
        accountCode: '4000',
        dimKey: 'REVENUE',
        baseAmount: '100000',
        cmpAmount: '110000',
        delta: '10000',
        deltaPct: '0.10',
        requiresComment: true,
        material: true,
      });

      const commentData = {
        line_id: 'line-1',
        body: 'Revenue increase due to new product launch',
      };

      const comment = await service.addFluxComment(
        companyId,
        userId,
        commentData
      );

      expect(comment.line_id).toBe('line-1');
      expect(comment.body).toBe('Revenue increase due to new product launch');
      expect(comment.author).toBe(userId);
    });
  });

  describe('upsertFluxRule', () => {
    it('should create flux rule', async () => {
      const data = {
        scope: 'PL' as const,
        dim: 'ACCOUNT' as const,
        threshold_abs: 5000,
        threshold_pct: 0.05,
        require_comment: true,
        active: true,
      };

      const rule = await service.upsertFluxRule(companyId, userId, data);

      expect(rule.company_id).toBe(companyId);
      expect(rule.scope).toBe('PL');
      expect(rule.dim).toBe('ACCOUNT');
      expect(rule.threshold_abs).toBe(5000);
      expect(rule.threshold_pct).toBe(0.05);
      expect(rule.require_comment).toBe(true);
      expect(rule.active).toBe(true);
    });
  });

  describe('getTopMovers', () => {
    it('should return top movers sorted by absolute delta', async () => {
      // Create test flux run and lines
      await db.insert(fluxRun).values({
        id: 'run-1',
        companyId,
        baseYear: 2024,
        baseMonth: 12,
        cmpYear: 2025,
        cmpMonth: 1,
        presentCcy: 'USD',
        status: 'COMPLETED',
        createdBy: userId,
      });

      await db.insert(fluxLine).values([
        {
          id: 'line-1',
          runId: 'run-1',
          accountCode: '4000',
          dimKey: 'REVENUE',
          baseAmount: '100000',
          cmpAmount: '110000',
          delta: '10000',
          deltaPct: '0.10',
          requiresComment: false,
          material: true,
        },
        {
          id: 'line-2',
          runId: 'run-1',
          accountCode: '5000',
          dimKey: 'COGS',
          baseAmount: '60000',
          cmpAmount: '65000',
          delta: '5000',
          deltaPct: '0.083',
          requiresComment: false,
          material: true,
        },
        {
          id: 'line-3',
          runId: 'run-1',
          accountCode: '6000',
          dimKey: 'EXPENSE',
          baseAmount: '20000',
          cmpAmount: '25000',
          delta: '5000',
          deltaPct: '0.25',
          requiresComment: false,
          material: true,
        },
      ]);

      const topMovers = await service.getTopMovers('run-1', 2);

      expect(topMovers.length).toBe(2);
      expect(topMovers[0]?.delta).toBe(10000); // Largest absolute delta
      expect(topMovers[1]?.delta).toBe(5000); // Second largest
    });
  });
});
