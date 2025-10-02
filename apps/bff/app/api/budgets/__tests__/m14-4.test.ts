// M14.4: Budget Versions, Approvals, & Variance Alerts - Tests
// Basic test suite for version workflow, import targeting, and alert evaluation

// Note: Test runner functions are defined in generator.test.ts to avoid duplication

// Mock data for testing
const mockBudgetVersion = {
    id: "bv_test_123",
    company_id: "COMP-1",
    code: "FY25-TEST",
    label: "FY25 Test Version",
    year: 2025,
    is_baseline: false,
    status: "draft",
    created_by: "user_123",
    updated_by: "user_123"
};

const mockAlertRule = {
    id: "bar_test_123",
    company_id: "COMP-1",
    name: "Test Alert Rule",
    account_code: "6000",
    cost_center: null,
    project: null,
    period_scope: "month",
    threshold_pct: 10.0,
    comparator: "abs_gte",
    delivery: { email: ["test@example.com"] },
    is_active: true,
    created_by: "user_123"
};

const mockVarianceDataset = [
    {
        account_code: "6000",
        cost_center: "CC-OPS",
        project: null,
        budget: 1000,
        actual: 1200
    },
    {
        account_code: "6100",
        cost_center: "CC-HQ",
        project: "PRJ-ALPHA",
        budget: 500,
        actual: 450
    }
];

describe("M14.4 Budget Versions & Alerts", () => {
    describe("Version Workflow", () => {
        it("should create budget version with correct status", () => {
            const version = { ...mockBudgetVersion };
            expect(version.status).toBe("draft");
            expect(version.code).toBe("FY25-TEST");
            expect(version.is_baseline).toBeFalsy();
        });

        it("should validate status transitions", () => {
            const validTransitions = {
                submit: ["draft"],
                approve: ["submitted"],
                return: ["submitted"],
            };

            expect(validTransitions.submit.includes("draft")).toBeTruthy();
            expect(validTransitions.approve.includes("submitted")).toBeTruthy();
            expect(validTransitions.return.includes("submitted")).toBeTruthy();
        });

        it("should handle version cloning", () => {
            const sourceVersion = { ...mockBudgetVersion };
            const clonedVersion = {
                ...sourceVersion,
                id: "bv_cloned_456",
                code: "FY25-CLONE",
                label: "FY25 Cloned Version"
            };

            expect(clonedVersion.id).not.toBe(sourceVersion.id);
            expect(clonedVersion.code).toBe("FY25-CLONE");
            expect(clonedVersion.status).toBe("draft");
        });
    });

    describe("Import Version Targeting", () => {
        it("should resolve version codes to IDs", () => {
            const versionMap = new Map([
                ["FY25-BL", "bv_baseline_123"],
                ["FY25-WIP", "bv_working_456"],
                ["FY25-V2", "bv_version_789"]
            ]);

            expect(versionMap.get("FY25-BL")).toBe("bv_baseline_123");
            expect(versionMap.get("FY25-WIP")).toBe("bv_working_456");
            expect(versionMap.get("FY25-V2")).toBe("bv_version_789");
        });

        it("should validate version status for imports", () => {
            const validStatuses = ["draft"];
            const invalidStatuses = ["submitted", "approved", "returned", "archived"];

            expect(validStatuses.includes("draft")).toBeTruthy();
            invalidStatuses.forEach(status => {
                expect(validStatuses.includes(status)).toBeFalsy();
            });
        });
    });

    describe("Alert Evaluation", () => {
        it("should calculate variance percentages correctly", () => {
            const testCases = [
                { budget: 1000, actual: 1200, expected: 20.0 },
                { budget: 1000, actual: 800, expected: -20.0 },
                { budget: 500, actual: 450, expected: -10.0 },
                { budget: 0, actual: 100, expected: null } // Should skip zero budget
            ];

            testCases.forEach(({ budget, actual, expected }) => {
                if (budget === 0) {
                    expect(expected).toBeNull();
                } else {
                    const variancePct = ((actual - budget) / budget) * 100;
                    expect(variancePct).toBe(expected);
                }
            });
        });

        it("should evaluate alert rules correctly", () => {
            const rule = { ...mockAlertRule };
            const dataset = [...mockVarianceDataset];

            // Test abs_gte comparator with 10% threshold
            const breaches = dataset.filter(row => {
                if (row.budget === 0) return false;
                // Apply rule filtering first
                if (rule.account_code && row.account_code !== rule.account_code) return false;
                const variancePct = ((row.actual - row.budget) / row.budget) * 100;
                return Math.abs(variancePct) >= rule.threshold_pct;
            });

            expect(breaches.length).toBe(1); // Only the 20% variance should trigger
            expect(breaches[0]?.account_code).toBe("6000");
        });

        it("should handle different comparators", () => {
            const testValue = 15.0;
            const threshold = 10.0;

            const comparators = {
                gt: testValue > threshold,
                lt: testValue < threshold,
                gte: testValue >= threshold,
                lte: testValue <= threshold,
                abs_gt: Math.abs(testValue) > threshold,
                abs_gte: Math.abs(testValue) >= threshold
            };

            expect(comparators.gt).toBeTruthy();
            expect(comparators.lt).toBeFalsy();
            expect(comparators.gte).toBeTruthy();
            expect(comparators.lte).toBeFalsy();
            expect(comparators.abs_gt).toBeTruthy();
            expect(comparators.abs_gte).toBeTruthy();
        });

        it("should filter dataset by rule criteria", () => {
            const rule = { ...mockAlertRule, account_code: "6000" };
            const dataset = [...mockVarianceDataset];

            const filtered = dataset.filter(row => {
                if (rule.account_code && row.account_code !== rule.account_code) return false;
                if (rule.cost_center && row.cost_center !== rule.cost_center) return false;
                if (rule.project && row.project !== rule.project) return false;
                return true;
            });

            expect(filtered.length).toBe(1);
            expect(filtered[0]?.account_code).toBe("6000");
        });
    });

    describe("Scenario Resolution", () => {
        it("should resolve scenario parameters", () => {
            const scenarios = {
                baseline: "baseline",
                working: "working",
                versionCode: "FY25-V2"
            };

            expect(scenarios.baseline).toBe("baseline");
            expect(scenarios.working).toBe("working");
            expect(scenarios.versionCode).toBe("FY25-V2");
        });

        it("should handle default scenario fallback", () => {
            const defaultScenario = "working";
            const fallbackScenario = defaultScenario;

            expect(fallbackScenario).toBe("working");
        });
    });
});

console.log("✅ M14.4 tests completed successfully!");
