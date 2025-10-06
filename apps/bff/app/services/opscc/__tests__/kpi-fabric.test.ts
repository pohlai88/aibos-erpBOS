import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { KpiFabricService } from '../kpi-fabric';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';

describe('KPI Fabric Service', () => {
  let ids: ReturnType<typeof testIds>;
  let service: KpiFabricService;

  beforeEach(async () => {
    ids = testIds(expect.getState().currentTestName!);
    await cleanCompany(ids.companyId);
    service = new KpiFabricService();
  });

  describe('KPI Computation', () => {
    it('should compute a single KPI for EXEC board', async () => {
      const result = await service.computeKpi(
        ids.companyId,
        'EXEC',
        'LIQUIDITY_RUNWAY_W',
        { present: 'USD' }
      );

      expect(result).toBeDefined();
      expect(result?.company_id).toBe(ids.companyId);
      expect(result?.board).toBe('EXEC');
      expect(result?.kpi).toBe('LIQUIDITY_RUNWAY_W');
      expect(result?.present_ccy).toBe('USD');
      expect(result?.basis).toBe('ACTUAL');
      expect(typeof result?.value).toBe('number');
    });

    it('should compute a single KPI for TREASURY board', async () => {
      const result = await service.computeKpi(
        ids.companyId,
        'TREASURY',
        'PAY_RUN_COMMIT_14D',
        { present: 'USD' }
      );

      expect(result).toBeDefined();
      expect(result?.company_id).toBe(ids.companyId);
      expect(result?.board).toBe('TREASURY');
      expect(result?.kpi).toBe('PAY_RUN_COMMIT_14D');
      expect(result?.present_ccy).toBe('USD');
      expect(typeof result?.value).toBe('number');
    });

    it('should compute a single KPI for AR board', async () => {
      const result = await service.computeKpi(
        ids.companyId,
        'AR',
        'PTP_AT_RISK',
        { present: 'USD' }
      );

      expect(result).toBeDefined();
      expect(result?.company_id).toBe(ids.companyId);
      expect(result?.board).toBe('AR');
      expect(result?.kpi).toBe('PTP_AT_RISK');
      expect(result?.present_ccy).toBe('USD');
      expect(typeof result?.value).toBe('number');
    });

    it('should compute a single KPI for CLOSE board', async () => {
      const result = await service.computeKpi(
        ids.companyId,
        'CLOSE',
        'CONTROL_PASS_RATE',
        { present: 'USD' }
      );

      expect(result).toBeDefined();
      expect(result?.company_id).toBe(ids.companyId);
      expect(result?.board).toBe('CLOSE');
      expect(result?.kpi).toBe('CONTROL_PASS_RATE');
      expect(result?.present_ccy).toBe('USD');
      expect(typeof result?.value).toBe('number');
    });

    it('should handle unknown KPI gracefully', async () => {
      const result = await service.computeKpi(
        ids.companyId,
        'EXEC',
        'UNKNOWN_KPI',
        { present: 'USD' }
      );

      expect(result).toBeDefined();
      expect(result?.value).toBeNull();
    });
  });

  describe('Board Computation', () => {
    it('should throw error for unknown board', async () => {
      await expect(
        service.computeBoard(ids.companyId, 'UNKNOWN' as any, {
          present: 'USD',
        })
      ).rejects.toThrow('Unknown board: UNKNOWN');
    });

    it('should throw error when board config not found', async () => {
      await expect(
        service.computeBoard(ids.companyId, 'EXEC', { present: 'USD' })
      ).rejects.toThrow('Board config not found for EXEC');
    });
  });

  describe('KPI Snapshots', () => {
    it('should get KPI snapshots with query', async () => {
      // First create a snapshot
      await service.computeKpi(ids.companyId, 'EXEC', 'LIQUIDITY_RUNWAY_W', {
        present: 'USD',
      });

      const snapshots = await service.getKpiSnapshots({
        companyId: ids.companyId,
        board: 'EXEC',
        kpi: 'LIQUIDITY_RUNWAY_W',
        present: 'USD',
        limit: 10,
      });

      expect(snapshots).toBeDefined();
      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0]?.kpi).toBe('LIQUIDITY_RUNWAY_W');
    });

    it('should get KPI snapshots without specific KPI', async () => {
      // Create multiple snapshots
      await service.computeKpi(ids.companyId, 'EXEC', 'LIQUIDITY_RUNWAY_W', {
        present: 'USD',
      });
      await service.computeKpi(ids.companyId, 'EXEC', 'CASH_BURN_4W', {
        present: 'USD',
      });

      const snapshots = await service.getKpiSnapshots({
        companyId: ids.companyId,
        board: 'EXEC',
        present: 'USD',
        limit: 10,
      });

      expect(snapshots).toBeDefined();
      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots.length).toBeGreaterThan(0);
    });
  });

  describe('Materialized View Refresh', () => {
    it('should refresh materialized views without error', async () => {
      // This test might fail if the MVs don't exist, but should not throw
      await expect(
        service.refreshMaterializedViews(ids.companyId)
      ).resolves.not.toThrow();
    });
  });

  describe('KPI Calculation Methods', () => {
    it('should compute liquidity runway', async () => {
      const result = await service['computeLiquidityRunway'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should compute cash burn', async () => {
      const result = await service['computeCashBurn'](ids.companyId, 'USD');
      expect(typeof result).toBe('number');
    });

    it('should compute forecast accuracy', async () => {
      const result = await service['computeForecastAccuracy'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute DSO', async () => {
      const result = await service['computeDSO'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should compute close progress', async () => {
      const result = await service['computeCloseProgress'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute control pass rate', async () => {
      const result = await service['computeControlPassRate'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute UAR completion', async () => {
      const result = await service['computeUarCompletion'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('Treasury KPI Calculations', () => {
    it('should compute committed payments', async () => {
      const result = await service['computeCommittedPayments'](
        ids.companyId,
        'USD',
        14
      );
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should compute discount capture rate', async () => {
      const result = await service['computeDiscountCaptureRate'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute bank ack lag', async () => {
      const result = await service['computeBankAckLag'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should compute FX exposure', async () => {
      const result = await service['computeFxExposure'](ids.companyId, 'USD');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AR KPI Calculations', () => {
    it('should compute PTP at risk', async () => {
      const result = await service['computePtpAtRisk'](ids.companyId, 'USD');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should compute PTP kept rate', async () => {
      const result = await service['computePtpKeptRate'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute dunning hit rate', async () => {
      const result = await service['computeDunningHitRate'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute auto match rate', async () => {
      const result = await service['computeAutoMatchRate'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute slippage vs promise', async () => {
      const result = await service['computeSlippageVsPromise'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Close KPI Calculations', () => {
    it('should compute accrual coverage', async () => {
      const result = await service['computeAccrualCoverage'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute flux comment completion', async () => {
      const result = await service['computeFluxCommentCompletion'](
        ids.companyId
      );
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute evidence freshness', async () => {
      const result = await service['computeEvidenceFreshness'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should compute SOX status', async () => {
      const result = await service['computeSoxStatus'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should compute exceptions open', async () => {
      const result = await service['computeExceptionsOpen'](ids.companyId);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
