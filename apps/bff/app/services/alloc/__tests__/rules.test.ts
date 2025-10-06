import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertAllocRule,
  getActiveAllocRules,
  getAllocRuleTargets,
} from '../rules';

describe('Allocation Rules Service', () => {
  const companyId = 'test-company';
  const actor = 'test-user';

  beforeEach(async () => {
    // Clean up test data
    // Note: In real tests, you'd use a test database
  });

  it('should create a PERCENT allocation rule with targets', async () => {
    const ruleData = {
      code: `TEST-PERCENT-${Date.now()}`,
      name: 'Test Percent Rule',
      active: true,
      method: 'PERCENT' as const,
      src_account: '7400',
      order_no: 1,
      targets: [
        { target_cc: 'CC-MFG', percent: 0.6 },
        { target_cc: 'CC-SALES', percent: 0.4 },
      ],
    };

    const result = await upsertAllocRule(companyId, actor, ruleData);
    expect(result.id).toBeDefined();

    const targets = await getAllocRuleTargets(result.id);
    expect(targets).toHaveLength(2);
    expect(targets[0]?.targetCc).toBe('CC-MFG');
    expect(targets[0]?.percent).toBe(0.6);
  });

  it('should create a DRIVER_SHARE allocation rule', async () => {
    const ruleData = {
      code: `TEST-DRIVER-${Date.now()}`,
      name: 'Test Driver Rule',
      active: true,
      method: 'DRIVER_SHARE' as const,
      driver_code: 'HEADCOUNT',
      src_cc_like: 'IT%',
      order_no: 1,
    };

    const result = await upsertAllocRule(companyId, actor, ruleData);
    expect(result.id).toBeDefined();

    const rules = await getActiveAllocRules(companyId, 2025, 11);
    const rule = rules.find(r => r.code === ruleData.code);
    expect(rule).toBeDefined();
    expect(rule?.method).toBe('DRIVER_SHARE');
    expect(rule?.driverCode).toBe('HEADCOUNT');
  });

  it('should validate PERCENT method requires targets', async () => {
    const ruleData = {
      code: 'TEST-INVALID',
      name: 'Test Invalid Rule',
      active: true,
      method: 'PERCENT' as const,
      src_account: '7400',
      order_no: 1,
      // Missing targets - should fail validation
    };

    await expect(upsertAllocRule(companyId, actor, ruleData)).rejects.toThrow();
  });

  it('should validate RATE_PER_UNIT method requires driver_code and rate_per_unit', async () => {
    const ruleData = {
      code: 'TEST-INVALID-RATE',
      name: 'Test Invalid Rate Rule',
      active: true,
      method: 'RATE_PER_UNIT' as const,
      src_account: '7400',
      order_no: 1,
      // Missing driver_code and rate_per_unit - should fail validation
    };

    await expect(upsertAllocRule(companyId, actor, ruleData)).rejects.toThrow();
  });
});
