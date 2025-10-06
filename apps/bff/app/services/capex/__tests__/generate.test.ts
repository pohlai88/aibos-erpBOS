// M16: Capex Depreciation Math Tests
// Tests for straight-line and double-declining balance calculations

import { describe, it, expect } from 'vitest';
import {
  asCents,
  approxEq,
  validateDepreciationCalculation,
  validateBookValue,
} from '../../../lib/math';

// Import the math functions (we'll need to export them from the generate service)
function straightLine(
  amount: number,
  lifeM: number,
  residualPct: number
): number[] {
  const base = amount * (1 - residualPct / 100);
  const perMonth = base / lifeM;
  return Array.from({ length: lifeM }, () => perMonth);
}

function doubleDecliningBalance(
  amount: number,
  lifeM: number,
  residualPct: number
): number[] {
  const floor = amount * (residualPct / 100);
  const rate = 2 / lifeM;
  const arr: number[] = [];
  let base = amount;

  for (let i = 0; i < lifeM; i++) {
    // If we've already reached the floor, no more depreciation
    if (base <= floor) {
      arr.push(0);
      continue;
    }

    let dep = base * rate;

    // If this depreciation would take us below the floor,
    // adjust to exactly reach the floor
    if (base - dep < floor) {
      dep = base - floor;
    }

    arr.push(dep);
    base -= dep;
  }

  return arr;
}

describe('depreciation math', () => {
  it('SL sums to base less residual', () => {
    const amount = 100000;
    const lifeM = 36;
    const residualPct = 10;

    const series = straightLine(amount, lifeM, residualPct);
    const total = series.reduce((sum, val) => sum + val, 0);
    const expected = amount * (1 - residualPct / 100);

    expect(total).toBeCloseTo(expected, 2);
    expect(series).toHaveLength(lifeM);
    expect(series.every(val => val > 0)).toBe(true);
  });

  it('DDB never crosses residual floor', () => {
    const amount = 100000;
    const lifeM = 36;
    const residualPct = 10;
    const floor = amount * (residualPct / 100);

    const series = doubleDecliningBalance(amount, lifeM, residualPct);
    const totalCharges = series.reduce((sum, val) => sum + val, 0);
    const totalChargesRounded = asCents(totalCharges);
    const expectedTotal = amount - floor;

    // Test financial soundness: total charges should be close to expected (within 1 cent)
    expect(
      validateDepreciationCalculation(totalChargesRounded, amount, floor, 0.01)
    ).toBe(true);

    // Test array properties
    expect(series).toHaveLength(lifeM);
    expect(series.every(val => val >= 0)).toBe(true);

    // Test book value never goes negative and final value is close to salvage
    let runningBookValue = amount;
    for (const dep of series) {
      runningBookValue -= dep;
      expect(runningBookValue).toBeGreaterThanOrEqual(floor);
    }

    // Final book value should be close to salvage value
    expect(validateBookValue(amount, totalChargesRounded, floor, 0.01)).toBe(
      true
    );
  });

  it('DDB has higher early depreciation than SL', () => {
    const amount = 100000;
    const lifeM = 36;
    const residualPct = 0;

    const slSeries = straightLine(amount, lifeM, residualPct);
    const ddbSeries = doubleDecliningBalance(amount, lifeM, residualPct);

    // First few months should have higher DDB depreciation
    expect(ddbSeries[0]).toBeGreaterThan(slSeries[0]!);
    expect(ddbSeries[1]).toBeGreaterThan(slSeries[1]!);
    expect(ddbSeries[2]).toBeGreaterThan(slSeries[2]!);

    // Later months should have lower DDB depreciation
    expect(ddbSeries[lifeM - 1]).toBeLessThan(slSeries[lifeM - 1]!);
    expect(ddbSeries[lifeM - 2]).toBeLessThan(slSeries[lifeM - 2]!);
  });

  it('handles zero residual correctly', () => {
    const amount = 50000;
    const lifeM = 24;
    const residualPct = 0;

    const slSeries = straightLine(amount, lifeM, residualPct);
    const ddbSeries = doubleDecliningBalance(amount, lifeM, residualPct);

    const slTotal = slSeries.reduce((sum, val) => sum + val, 0);
    const ddbTotal = ddbSeries.reduce((sum, val) => sum + val, 0);

    // SL should be exact
    expect(asCents(slTotal)).toBe(asCents(amount));

    // DDB with zero residual should be close to full amount (within 1 cent)
    expect(
      validateDepreciationCalculation(asCents(ddbTotal), amount, 0, 0.01)
    ).toBe(true);

    // Both should have correct array lengths
    expect(slSeries).toHaveLength(lifeM);
    expect(ddbSeries).toHaveLength(lifeM);
  });
});
