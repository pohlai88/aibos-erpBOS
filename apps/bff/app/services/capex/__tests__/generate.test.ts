// M16: Capex Depreciation Math Tests
// Tests for straight-line and double-declining balance calculations

import { describe, it, expect } from "vitest";

// Import the math functions (we'll need to export them from the generate service)
function straightLine(amount: number, lifeM: number, residualPct: number): number[] {
    const base = amount * (1 - residualPct / 100);
    const perMonth = base / lifeM;
    return Array.from({ length: lifeM }, () => perMonth);
}

function doubleDecliningBalance(amount: number, lifeM: number, residualPct: number): number[] {
    const floor = amount * (residualPct / 100);
    const rate = 2 / lifeM;
    const arr: number[] = [];
    let base = amount;

    for (let i = 0; i < lifeM; i++) {
        let dep = base * rate;
        if (base - dep < floor) {
            dep = base - floor;
        }
        arr.push(dep);
        base -= dep;
    }

    return arr;
}

describe("depreciation math", () => {
    it("SL sums to base less residual", () => {
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

    it("DDB never crosses residual floor", () => {
        const amount = 100000;
        const lifeM = 36;
        const residualPct = 10;
        const floor = amount * (residualPct / 100);

        const series = doubleDecliningBalance(amount, lifeM, residualPct);
        const total = series.reduce((sum, val) => sum + val, 0);
        const expected = amount - floor;

        expect(total).toBeCloseTo(expected, 2);
        expect(series).toHaveLength(lifeM);
        expect(series.every(val => val > 0)).toBe(true);

        // Check that we don't go below residual floor
        let runningTotal = amount;
        for (const dep of series) {
            runningTotal -= dep;
            expect(runningTotal).toBeGreaterThanOrEqual(floor);
        }
    });

    it("DDB has higher early depreciation than SL", () => {
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

    it("handles zero residual correctly", () => {
        const amount = 50000;
        const lifeM = 24;
        const residualPct = 0;

        const slSeries = straightLine(amount, lifeM, residualPct);
        const ddbSeries = doubleDecliningBalance(amount, lifeM, residualPct);

        const slTotal = slSeries.reduce((sum, val) => sum + val, 0);
        const ddbTotal = ddbSeries.reduce((sum, val) => sum + val, 0);

        expect(slTotal).toBeCloseTo(amount, 2);
        expect(ddbTotal).toBeCloseTo(amount, 2);
    });
});
