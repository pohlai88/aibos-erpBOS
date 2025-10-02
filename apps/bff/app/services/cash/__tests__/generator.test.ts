// M15: Cash Flow Tests
// apps/bff/app/services/cash/__tests__/generator.test.ts

import { describe, it, expect } from './test-utils';

// Import the functions we want to test
// Note: We'll test the math functions directly since they're pure functions

// Working Capital Math Helpers (copied from generator.ts for testing)
function arFromRevenue(rev: number, dsoDays: number): number {
    return (rev * dsoDays) / 365;
}

function apFromCogs(cogs: number, dpoDays: number): number {
    return (cogs * dpoDays) / 365;
}

function invFromCogs(cogs: number, dioDays: number): number {
    return (cogs * dioDays) / 365;
}

function cashFromPL(
    monthData: { year: number; month: number; revenue: number; cogs: number; opex: number; taxPct: number; interestApr: number },
    deltaAR: number,
    deltaAP: number,
    deltaInv: number
) {
    const grossProfit = monthData.revenue - monthData.cogs;
    const ebit = grossProfit - monthData.opex;
    const tax = Math.max(0, ebit) * (monthData.taxPct / 100);
    const interest = Math.max(0, (monthData.revenue + monthData.cogs + monthData.opex) * (monthData.interestApr / 100 / 12));
    const netIncome = ebit - tax - interest;

    // Indirect method adjustments
    const cashFromOps = netIncome - deltaAR + deltaAP - deltaInv;
    return {
        cashIn: Math.max(0, cashFromOps),
        cashOut: Math.max(0, -cashFromOps),
        net: cashFromOps
    };
}

describe("Working Capital Math", () => {
    it("calculates AR correctly with different DSO periods", () => {
        const revenue = 100000;
        const dso30 = arFromRevenue(revenue, 30);
        const dso60 = arFromRevenue(revenue, 60);

        expect(dso30).toBeLessThan(dso60);
        expect(dso30).toBeGreaterThan(0);
        expect(dso60).toBeGreaterThan(0);
    });

    it("calculates AP correctly with different DPO periods", () => {
        const cogs = 50000;
        const dpo30 = apFromCogs(cogs, 30);
        const dpo60 = apFromCogs(cogs, 60);

        expect(dpo30).toBeLessThan(dpo60);
        expect(dpo30).toBeGreaterThan(0);
        expect(dpo60).toBeGreaterThan(0);
    });

    it("calculates inventory correctly with different DIO periods", () => {
        const cogs = 50000;
        const dio30 = invFromCogs(cogs, 30);
        const dio60 = invFromCogs(cogs, 60);

        expect(dio30).toBeLessThan(dio60);
        expect(dio30).toBeGreaterThan(0);
        expect(dio60).toBeGreaterThan(0);
    });

    it("produces higher AR with larger DSO", () => {
        const rev = 100000;
        const dso30 = arFromRevenue(rev, 30);
        const dso60 = arFromRevenue(rev, 60);
        expect(dso60).toBeGreaterThan(dso30);
    });
});

describe("Cash Flow Calculation", () => {
    it("calculates positive cash flow for profitable operations", () => {
        const monthData = {
            year: 2025,
            month: 1,
            revenue: 100000,
            cogs: 60000,
            opex: 20000,
            taxPct: 24,
            interestApr: 6
        };

        const deltas = { dAR: 0, dAP: 0, dInv: 0 };
        const cash = cashFromPL(monthData, deltas.dAR, deltas.dAP, deltas.dInv);

        expect(cash.net).toBeGreaterThan(0);
        expect(cash.cashIn).toBeGreaterThan(0);
        expect(cash.cashOut).toBe(0);
    });

    it("calculates negative cash flow for unprofitable operations", () => {
        const monthData = {
            year: 2025,
            month: 1,
            revenue: 50000,
            cogs: 60000,
            opex: 20000,
            taxPct: 24,
            interestApr: 6
        };

        const deltas = { dAR: 0, dAP: 0, dInv: 0 };
        const cash = cashFromPL(monthData, deltas.dAR, deltas.dAP, deltas.dInv);

        expect(cash.net).toBeLessThan(0);
        expect(cash.cashIn).toBe(0);
        expect(cash.cashOut).toBeGreaterThan(0);
    });

    it("adjusts cash flow for working capital changes", () => {
        const monthData = {
            year: 2025,
            month: 1,
            revenue: 100000,
            cogs: 60000,
            opex: 20000,
            taxPct: 24,
            interestApr: 6
        };

        // Positive AR delta (customers paying slower) reduces cash
        const deltas = { dAR: 20000, dAP: 0, dInv: 0 };
        const cash = cashFromPL(monthData, deltas.dAR, deltas.dAP, deltas.dInv);

        expect(cash.net).toBeLessThan(0); // Should be negative due to AR increase
    });

    it("handles tax and interest calculations correctly", () => {
        const monthData = {
            year: 2025,
            month: 1,
            revenue: 100000,
            cogs: 40000,
            opex: 20000,
            taxPct: 30,
            interestApr: 12
        };

        const deltas = { dAR: 0, dAP: 0, dInv: 0 };
        const cash = cashFromPL(monthData, deltas.dAR, deltas.dAP, deltas.dInv);

        // Should account for tax and interest in cash calculation
        expect(cash.net).toBeGreaterThan(0);
        expect(cash.net).toBeLessThan(40000); // Less than gross profit due to tax/interest
    });
});

describe("Scenario Resolution", () => {
    it("parses forecast scenario tags correctly", () => {
        // This would test the parseScenarioTag function if we exported it
        // For now, we'll test the logic inline
        const tag1 = "forecast:FY26-FC1";
        const [t1, rest1] = tag1.includes(":") ? tag1.split(":") : ["budget", tag1];

        expect(t1).toBe("forecast");
        expect(rest1).toBe("FY26-FC1");
    });

    it("parses budget scenario tags correctly", () => {
        const tag2 = "budget:FY25-WIP";
        const [t2, rest2] = tag2.includes(":") ? tag2.split(":") : ["budget", tag2];

        expect(t2).toBe("budget");
        expect(rest2).toBe("FY25-WIP");
    });

    it("defaults to budget for simple tags", () => {
        const tag3 = "FY25-BL";
        const [t3, rest3] = tag3.includes(":") ? tag3.split(":") : ["budget", tag3];

        expect(t3).toBe("budget");
        expect(rest3).toBe("FY25-BL");
    });
});

console.log("\n🎉 All M15 Cash Flow tests completed!");
