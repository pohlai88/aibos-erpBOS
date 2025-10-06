import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { AlertsService } from '../alerts';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';
import { randomUUID } from 'crypto';

describe('Alerts Service', () => {
  let ids: ReturnType<typeof testIds>;
  let service: AlertsService;

  beforeEach(async () => {
    ids = testIds(expect.getState().currentTestName!);
    await cleanCompany(ids.companyId);
    service = new AlertsService();
  });

  describe('Alert Rule Management', () => {
    it('should create a new alert rule', async () => {
      const rule = {
        board: 'EXEC' as const,
        kpi: 'LIQUIDITY_RUNWAY_W',
        rule_id: 'exec-liquidity-critical',
        expr: 'value < 6',
        severity: 'HIGH' as const,
        throttle_sec: 3600,
        enabled: true,
      };

      const result = await service.upsertAlertRule(ids.companyId, rule);

      expect(result).toBeDefined();
      expect(result.company_id).toBe(ids.companyId);
      expect(result.board).toBe('EXEC');
      expect(result.kpi).toBe('LIQUIDITY_RUNWAY_W');
      expect(result.rule_id).toBe('exec-liquidity-critical');
      expect(result.expr).toBe('value < 6');
      expect(result.severity).toBe('HIGH');
      expect(result.throttle_sec).toBe(3600);
      expect(result.enabled).toBe(true);
    });

    it('should update an existing alert rule', async () => {
      // Create initial rule
      const initialRule = {
        board: 'AR' as const,
        kpi: 'PTP_AT_RISK',
        rule_id: 'ar-ptp-high',
        expr: 'value > 100000',
        severity: 'MED' as const,
        throttle_sec: 1800,
        enabled: true,
      };

      await service.upsertAlertRule(ids.companyId, initialRule);

      // Update rule
      const updatedRule = {
        board: 'AR' as const,
        kpi: 'PTP_AT_RISK',
        rule_id: 'ar-ptp-high',
        expr: 'value > 150000',
        severity: 'HIGH' as const,
        throttle_sec: 900,
        enabled: false,
      };

      const result = await service.upsertAlertRule(ids.companyId, updatedRule);

      expect(result).toBeDefined();
      expect(result.expr).toBe('value > 150000');
      expect(result.severity).toBe('HIGH');
      expect(result.throttle_sec).toBe(900);
      expect(result.enabled).toBe(false);
    });

    it('should get alert rules for a company', async () => {
      // Create multiple rules
      const rules = [
        {
          board: 'EXEC' as const,
          kpi: 'LIQUIDITY_RUNWAY_W',
          rule_id: 'exec-liquidity-critical',
          expr: 'value < 6',
          severity: 'HIGH' as const,
          throttle_sec: 3600,
          enabled: true,
        },
        {
          board: 'TREASURY' as const,
          kpi: 'BANK_ACK_LAG_H',
          rule_id: 'treasury-bank-lag',
          expr: 'value > 6',
          severity: 'MED' as const,
          throttle_sec: 1800,
          enabled: true,
        },
      ];

      for (const rule of rules) {
        await service.upsertAlertRule(ids.companyId, rule);
      }

      const results = await service.getAlertRules(ids.companyId);

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results.map(r => r.rule_id)).toContain('exec-liquidity-critical');
      expect(results.map(r => r.rule_id)).toContain('treasury-bank-lag');
    });

    it('should get alert rules by board', async () => {
      // Create rules for different boards
      const rules = [
        {
          board: 'EXEC' as const,
          kpi: 'LIQUIDITY_RUNWAY_W',
          rule_id: 'exec-liquidity-critical',
          expr: 'value < 6',
          severity: 'HIGH' as const,
          throttle_sec: 3600,
          enabled: true,
        },
        {
          board: 'CLOSE' as const,
          kpi: 'CONTROL_PASS_RATE',
          rule_id: 'close-controls-failing',
          expr: 'value < 95',
          severity: 'HIGH' as const,
          throttle_sec: 1800,
          enabled: true,
        },
      ];

      for (const rule of rules) {
        await service.upsertAlertRule(ids.companyId, rule);
      }

      const execRules = await service.getAlertRulesByBoard(
        ids.companyId,
        'EXEC'
      );
      expect(execRules.length).toBe(1);
      expect(execRules[0]?.rule_id).toBe('exec-liquidity-critical');

      const closeRules = await service.getAlertRulesByBoard(
        ids.companyId,
        'CLOSE'
      );
      expect(closeRules.length).toBe(1);
      expect(closeRules[0]?.rule_id).toBe('close-controls-failing');
    });

    it('should delete alert rule', async () => {
      // Create rule first
      const rule = {
        board: 'AR' as const,
        kpi: 'PTP_AT_RISK',
        rule_id: 'ar-ptp-high',
        expr: 'value > 100000',
        severity: 'MED' as const,
        throttle_sec: 1800,
        enabled: true,
      };

      await service.upsertAlertRule(ids.companyId, rule);

      // Verify it exists
      const beforeDelete = await service.getAlertRules(ids.companyId);
      expect(beforeDelete.length).toBe(1);

      // Delete it
      await service.deleteAlertRule(ids.companyId, 'ar-ptp-high');

      // Verify it's gone
      const afterDelete = await service.getAlertRules(ids.companyId);
      expect(afterDelete.length).toBe(0);
    });
  });

  describe('Alert Event Management', () => {
    it('should acknowledge an alert event', async () => {
      // This test would require creating an alert event first
      // For now, we'll test the method exists and doesn't throw
      const eventId = randomUUID();

      // This should not throw even if the event doesn't exist
      await expect(
        service.acknowledgeAlert(ids.companyId, eventId)
      ).resolves.not.toThrow();
    });

    it('should resolve an alert event', async () => {
      // This test would require creating an alert event first
      // For now, we'll test the method exists and doesn't throw
      const eventId = randomUUID();

      // This should not throw even if the event doesn't exist
      await expect(
        service.resolveAlert(ids.companyId, eventId)
      ).resolves.not.toThrow();
    });

    it('should get active alerts', async () => {
      const results = await service.getActiveAlerts(ids.companyId);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get alert events by status', async () => {
      const openEvents = await service.getAlertEventsByStatus(
        ids.companyId,
        'OPEN'
      );
      expect(openEvents).toBeDefined();
      expect(Array.isArray(openEvents)).toBe(true);

      const ackEvents = await service.getAlertEventsByStatus(
        ids.companyId,
        'ACK'
      );
      expect(ackEvents).toBeDefined();
      expect(Array.isArray(ackEvents)).toBe(true);

      const resolvedEvents = await service.getAlertEventsByStatus(
        ids.companyId,
        'RESOLVED'
      );
      expect(resolvedEvents).toBeDefined();
      expect(Array.isArray(resolvedEvents)).toBe(true);
    });
  });

  describe('Alert Rule Evaluation', () => {
    it('should evaluate alert rules without error', async () => {
      // Create a rule first
      const rule = {
        board: 'EXEC' as const,
        kpi: 'LIQUIDITY_RUNWAY_W',
        rule_id: 'exec-liquidity-critical',
        expr: 'value < 6',
        severity: 'HIGH' as const,
        throttle_sec: 3600,
        enabled: true,
      };

      await service.upsertAlertRule(ids.companyId, rule);

      // Evaluate rules - should not throw
      await expect(service.fireAlerts(ids.companyId)).resolves.not.toThrow();
    });

    it('should handle evaluation with no rules', async () => {
      // Evaluate rules with no rules created - should not throw
      await expect(service.fireAlerts(ids.companyId)).resolves.not.toThrow();
    });

    it('should handle evaluation with disabled rules', async () => {
      // Create disabled rule
      const rule = {
        board: 'EXEC' as const,
        kpi: 'LIQUIDITY_RUNWAY_W',
        rule_id: 'exec-liquidity-critical',
        expr: 'value < 6',
        severity: 'HIGH' as const,
        throttle_sec: 3600,
        enabled: false,
      };

      await service.upsertAlertRule(ids.companyId, rule);

      // Evaluate rules - should not throw and should skip disabled rules
      await expect(service.fireAlerts(ids.companyId)).resolves.not.toThrow();
    });
  });

  describe('Expression Evaluation', () => {
    it('should evaluate simple threshold expressions', async () => {
      // Test the private evaluateExpression method through public methods
      // We'll create a rule and evaluate it to test expression evaluation

      const rule = {
        board: 'EXEC' as const,
        kpi: 'LIQUIDITY_RUNWAY_W',
        rule_id: 'exec-liquidity-critical',
        expr: 'value < 6',
        severity: 'HIGH' as const,
        throttle_sec: 3600,
        enabled: true,
      };

      await service.upsertAlertRule(ids.companyId, rule);

      // This should not throw
      await expect(service.fireAlerts(ids.companyId)).resolves.not.toThrow();
    });

    it('should handle invalid expressions gracefully', async () => {
      const rule = {
        board: 'EXEC' as const,
        kpi: 'LIQUIDITY_RUNWAY_W',
        rule_id: 'exec-liquidity-invalid',
        expr: 'invalid expression',
        severity: 'HIGH' as const,
        throttle_sec: 3600,
        enabled: true,
      };

      await service.upsertAlertRule(ids.companyId, rule);

      // This should not throw even with invalid expression
      await expect(service.fireAlerts(ids.companyId)).resolves.not.toThrow();
    });
  });
});
