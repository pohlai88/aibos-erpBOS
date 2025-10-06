// M16.1: Intangible Amortization Math Tests
// Tests for straight-line amortization calculations

import { describe, it, expect } from 'vitest';

// Import the math functions
function straightLineAmortization(amount: number, lifeM: number): number[] {
  const perMonth = amount / lifeM;
  return Array.from({ length: lifeM }, () => perMonth);
}

describe('amortization math', () => {
  it('SL amortization sums to total amount', () => {
    const amount = 240000;
    const lifeM = 24;

    const series = straightLineAmortization(amount, lifeM);
    const total = series.reduce((sum, val) => sum + val, 0);

    expect(total).toBeCloseTo(amount, 2);
    expect(series).toHaveLength(lifeM);
    expect(series.every(val => val > 0)).toBe(true);
    expect(series.every(val => val === series[0])).toBe(true); // All equal for SL
  });

  it('handles fractional amounts correctly', () => {
    const amount = 100000;
    const lifeM = 36;

    const series = straightLineAmortization(amount, lifeM);
    const expectedPerMonth = amount / lifeM;

    expect(series[0]).toBeCloseTo(expectedPerMonth, 6);
    expect(
      series.every(val => Math.abs(val - expectedPerMonth) < 0.000001)
    ).toBe(true);
  });

  it('handles short amortization periods', () => {
    const amount = 12000;
    const lifeM = 6;

    const series = straightLineAmortization(amount, lifeM);
    const total = series.reduce((sum, val) => sum + val, 0);

    expect(total).toBeCloseTo(amount, 2);
    expect(series).toHaveLength(6);
    expect(series.every(val => val === 2000)).toBe(true);
  });

  it('handles long amortization periods', () => {
    const amount = 1000000;
    const lifeM = 120; // 10 years

    const series = straightLineAmortization(amount, lifeM);
    const total = series.reduce((sum, val) => sum + val, 0);

    expect(total).toBeCloseTo(amount, 2);
    expect(series).toHaveLength(120);
    expect(series.every(val => val > 0)).toBe(true);
  });
});
