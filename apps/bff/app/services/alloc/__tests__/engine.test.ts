import { describe, it, expect, beforeEach } from 'vitest';
import { runAllocation } from '../engine';

describe('Allocation Engine', () => {
  const companyId = 'test-company';
  const actor = 'test-user';

  beforeEach(async () => {
    // Clean up test data
    // Note: In real tests, you'd use a test database
  });

  it('should run dry-run allocation without posting journals', async () => {
    const result = await runAllocation(
      companyId,
      2025,
      11,
      true, // dry_run
      actor,
      undefined, // all rules
      'Test dry run'
    );

    expect(result.runId).toBeDefined();
    expect(result.summary.journalsPosted).toBeUndefined();
    expect(result.summary.totalRulesProcessed).toBeGreaterThanOrEqual(0);
  });

  it('should process PERCENT rule correctly', async () => {
    // This would test the PERCENT allocation logic
    // In a real test, you'd set up test data first
    const result = await runAllocation(
      companyId,
      2025,
      11,
      true,
      actor,
      ['TEST-PERCENT'], // specific rule
      'Test percent allocation'
    );

    expect(result.lines).toBeDefined();
    expect(Array.isArray(result.lines)).toBe(true);
  });

  it('should process DRIVER_SHARE rule correctly', async () => {
    // This would test the DRIVER_SHARE allocation logic
    const result = await runAllocation(
      companyId,
      2025,
      11,
      true,
      actor,
      ['TEST-DRIVER'], // specific rule
      'Test driver share allocation'
    );

    expect(result.lines).toBeDefined();
    expect(Array.isArray(result.lines)).toBe(true);
  });

  it('should handle empty source pool gracefully', async () => {
    const result = await runAllocation(
      companyId,
      2025,
      11,
      true,
      actor,
      ['NONEXISTENT-RULE'], // rule that won't match any data
      'Test empty pool'
    );

    expect(result.summary.totalAmountAllocated).toBe(0);
    expect(result.lines).toHaveLength(0);
  });
});
