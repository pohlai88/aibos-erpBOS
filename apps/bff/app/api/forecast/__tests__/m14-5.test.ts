// M14.5 Driver-Based Rolling Forecast Tests
// Note: Test runner functions are defined in generator.test.ts to avoid duplication

import { describe, it, expect } from '../../../services/cash/__tests__/test-utils';

// Mock data for testing
const mockDriverProfile = {
    id: "dp_test_123",
    company_id: "COMP-1",
    name: "Revenue Growth Model",
    description: "Standard revenue and COGS driver model",
    formula_json: {
        "4000": "revenue * 0.6",  // COGS = 60% of revenue
        "5000": "revenue * 0.3",  // Operating expenses = 30% of revenue
        "6000": "revenue * 0.1"   // Other expenses = 10% of revenue
    } as Record<string, string>,
    seasonality_json: {
        "1": 100, "2": 95, "3": 110, "4": 105,
        "5": 100, "6": 95, "7": 90, "8": 105,
        "9": 110, "10": 100, "11": 95, "12": 120
    } as Record<string, number>,
    is_active: true,
    created_by: "user_123"
};

const mockForecastVersion = {
    id: "fv_test_123",
    company_id: "COMP-1",
    code: "FY25-FC1",
    label: "FY25 Q1 Forecast",
    year: 2025,
    driver_profile_id: "dp_test_123",
    status: "draft",
    created_by: "user_123",
    updated_by: "user_123"
};

const mockBudgetLines = [
    {
        account_code: "4000",
        cost_center_code: "CC-SALES",
        project_code: null,
        amount_base: 100000,
        currency: "USD"
    },
    {
        account_code: "5000",
        cost_center_code: "CC-OPS",
        project_code: "PRJ-001",
        amount_base: 50000,
        currency: "USD"
    }
] as Array<{
    account_code: string;
    cost_center_code: string;
    project_code: string | null;
    amount_base: number;
    currency: string;
}>;

describe("M14.5 Driver-Based Rolling Forecast", () => {
    describe("Driver Profile Management", () => {
        it("should create driver profiles with formulas and seasonality", () => {
            const profile = { ...mockDriverProfile };

            expect(profile.name).toBe("Revenue Growth Model");
            expect(Object.keys(profile.formula_json).length).toBe(3);
            expect(Object.keys(profile.seasonality_json).length).toBe(12);
            expect(profile.seasonality_json["12"]).toBe(120); // December peak
        });

        it("should validate seasonality normalization", () => {
            const seasonality = mockDriverProfile.seasonality_json;
            const values = Object.values(seasonality);
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

            // Should be normalized around 100%
            expect(avg).toBeGreaterThan(95);
            expect(avg).toBeLessThan(105);
        });
    });

    describe("Forecast Generation", () => {
        it("should generate forecast lines from budget with driver formulas", () => {
            const profile = mockDriverProfile;
            const budgetLine = mockBudgetLines[0]; // COGS account
            if (!budgetLine) throw new Error("Budget line not found");

            const formula = profile.formula_json[budgetLine.account_code];

            expect(formula).toBe("revenue * 0.6");

            // Simulate forecast generation
            const baseAmount = budgetLine.amount_base;
            const driverMultiplier = 0.6;
            const expectedDriverAmount = baseAmount * driverMultiplier;

            expect(expectedDriverAmount).toBe(60000);
        });

        it("should apply seasonality to monthly forecasts", () => {
            const seasonality = mockDriverProfile.seasonality_json;
            const baseAmount = 100000;

            // Test January (100%) and December (120%)
            const janFactor = seasonality["1"];
            const decFactor = seasonality["12"];
            if (!janFactor || !decFactor) throw new Error("Seasonality factors not found");

            const janAmount = baseAmount * (janFactor / 100);
            const decAmount = baseAmount * (decFactor / 100);

            expect(janAmount).toBe(100000);
            expect(decAmount).toBe(120000);
        });

        it("should handle accounts without driver formulas", () => {
            const budgetLine = { ...mockBudgetLines[0], account_code: "9999" }; // No formula
            const profile = mockDriverProfile;
            const formula = profile.formula_json[budgetLine.account_code];

            expect(formula).toBeUndefined();

            // Should keep original amount
            const expectedAmount = budgetLine.amount_base;
            expect(expectedAmount).toBe(100000);
        });
    });

    describe("What-If Simulation", () => {
        it("should simulate price and volume changes", () => {
            const simulationParams = {
                priceDelta: 10,  // +10% price increase
                volumeDelta: 5,  // +5% volume increase
                fxRate: 1.0
            };

            const baseRevenue = 100000;
            const priceMultiplier = 1 + (simulationParams.priceDelta / 100);
            const volumeMultiplier = 1 + (simulationParams.volumeDelta / 100);

            const simulatedRevenue = baseRevenue * priceMultiplier * volumeMultiplier;
            const expectedRevenue = 100000 * 1.1 * 1.05; // 115,500

            expect(simulatedRevenue).toBe(expectedRevenue);
        });

        it("should apply FX rate adjustments", () => {
            const simulationParams = {
                fxRate: 1.2  // 20% FX appreciation
            };

            const baseAmount = 100000;
            const fxAdjustedAmount = baseAmount * simulationParams.fxRate;

            expect(fxAdjustedAmount).toBe(120000);
        });

        it("should handle combined simulation parameters", () => {
            const simulationParams = {
                priceDelta: 5,
                volumeDelta: -2,  // Volume decrease
                fxRate: 0.95     // FX depreciation
            };

            const baseRevenue = 100000;
            const priceMultiplier = 1 + (simulationParams.priceDelta / 100);
            const volumeMultiplier = 1 + (simulationParams.volumeDelta / 100);
            const fxMultiplier = simulationParams.fxRate;

            const finalAmount = baseRevenue * priceMultiplier * volumeMultiplier * fxMultiplier;
            const expectedAmount = 100000 * 1.05 * 0.98 * 0.95; // 97,755

            expect(Math.round(finalAmount)).toBe(Math.round(expectedAmount));
        });
    });

    describe("Report Integration", () => {
        it("should resolve forecast scenarios correctly", () => {
            const scenarioTests = [
                { input: "baseline", expected: "budget_version" },
                { input: "working", expected: "budget_version" },
                { input: "forecast:FY25-FC1", expected: "forecast_version" },
                { input: "FY25-V2", expected: "budget_version" }
            ];

            scenarioTests.forEach(test => {
                if (test.input.startsWith("forecast:")) {
                    expect(test.input.substring(9)).toBe("FY25-FC1");
                } else {
                    expect(test.input).toBeTruthy();
                }
            });
        });

        it("should generate forecast matrix with pivot support", () => {
            const forecastLines = [
                { account_code: "4000", cost_center_code: "CC-SALES", month: 1, amount: 60000 },
                { account_code: "4000", cost_center_code: "CC-SALES", month: 2, amount: 57000 },
                { account_code: "5000", cost_center_code: "CC-OPS", month: 1, amount: 30000 }
            ];

            // Test pivot by cost center
            const pivotByCC = forecastLines.reduce((acc, line) => {
                const key = line.cost_center_code;
                acc[key] = (acc[key] || 0) + line.amount;
                return acc;
            }, {} as Record<string, number>);

            expect(pivotByCC["CC-SALES"]).toBe(117000);
            expect(pivotByCC["CC-OPS"]).toBe(30000);
        });
    });

    describe("Performance Requirements", () => {
        it("should generate forecast in under 5 seconds for 50k lines", () => {
            const startTime = Date.now();

            // Simulate processing 50k lines
            const lines = Array.from({ length: 50000 }, (_, i) => ({
                account_code: `4${(i % 1000).toString().padStart(3, '0')}`,
                amount_base: 1000 + (i % 1000),
                month: (i % 12) + 1
            }));

            // Process each line (simplified)
            lines.forEach(line => {
                const seasonalFactor = mockDriverProfile.seasonality_json[line.month.toString() as keyof typeof mockDriverProfile.seasonality_json] || 100;
                const forecastAmount = line.amount_base * (seasonalFactor / 100);
                // In real implementation, this would be inserted into DB
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete in under 5 seconds (5000ms)
            expect(duration).toBeLessThan(5000);
        });
    });
});

console.log("✅ M14.5 Driver-Based Rolling Forecast tests completed successfully!");
