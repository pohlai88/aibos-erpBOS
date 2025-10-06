// M16.3: Proration Tests
// Tests for proration calculations

import { describe, it, expect } from 'vitest';
import {
  prorate,
  validateProrationParams,
  getProrationSummary,
} from '../proration';

describe('proration', () => {
  it('calculates half-month proration correctly', () => {
    const amount = 1200;
    const dateISO = '2025-11-15';
    const result = prorate(amount, dateISO, 'half_month');
    expect(result).toBe(600);
  });

  it('calculates days-in-month proration correctly', () => {
    const amount = 1200;
    const dateISO = '2025-11-15'; // 15th of November (30 days)
    const result = prorate(amount, dateISO, 'days_in_month');

    // November has 30 days, active from 15th = 16 days
    // Expected: (1200 * 16) / 30 = 640
    expect(result).toBe(640);
  });

  it('handles month-end correctly', () => {
    const amount = 1200;
    const dateISO = '2025-11-30'; // Last day of November
    const result = prorate(amount, dateISO, 'days_in_month');

    // November has 30 days, active from 30th = 1 day
    // Expected: (1200 * 1) / 30 = 40
    expect(result).toBe(40);
  });

  it('handles month-start correctly', () => {
    const amount = 1200;
    const dateISO = '2025-11-01'; // First day of November
    const result = prorate(amount, dateISO, 'days_in_month');

    // November has 30 days, active from 1st = 30 days
    // Expected: (1200 * 30) / 30 = 1200
    expect(result).toBe(1200);
  });

  it('validates proration parameters', () => {
    expect(
      validateProrationParams(100, '2025-11-15', 'days_in_month').valid
    ).toBe(true);
    expect(
      validateProrationParams(-100, '2025-11-15', 'days_in_month').valid
    ).toBe(false);
    expect(
      validateProrationParams(100, 'invalid-date', 'days_in_month').valid
    ).toBe(false);
  });

  it('provides proration summary', () => {
    const amount = 1200;
    const dateISO = '2025-11-15';
    const summary = getProrationSummary(amount, dateISO, 'days_in_month');

    expect(summary.fullAmount).toBe(1200);
    expect(summary.daysInMonth).toBe(30);
    expect(summary.daysActive).toBe(16);
    expect(summary.prorationFactor).toBe(16 / 30);
    expect(summary.proratedAmount).toBe(640);
  });
});
