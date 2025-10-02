import { describe, it, expect, beforeEach } from "vitest";
import { runConsolidation, getConsolRuns } from "../consolidation";
import { upsertEntity, upsertGroup, upsertOwnership } from "../entities";

describe("Consolidation Engine", () => {
    const companyId = "test-company";
    const actor = "test-user";

    beforeEach(async () => {
        // Clean up test data
        // Note: In real tests, you'd use a test database
    });

    it("should run dry-run consolidation with translation", async () => {
        // Set up entities and group
        await upsertEntity(companyId, {
            entity_code: "MY-CO",
            name: "Malaysia Company",
            base_ccy: "MYR",
            active: true
        });

        await upsertEntity(companyId, {
            entity_code: "SG-CO",
            name: "Singapore Company",
            base_ccy: "SGD",
            active: true
        });

        await upsertGroup(companyId, {
            group_code: "APAC-GRP",
            name: "APAC Group",
            presentation_ccy: "USD"
        });

        await upsertOwnership(companyId, {
            group_code: "APAC-GRP",
            parent_code: "MY-CO",
            child_code: "SG-CO",
            pct: 1.0,
            eff_from: "2025-01-01"
        });

        const consolData = {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true,
            present_ccy: "USD",
            memo: "Test consolidation"
        };

        const result = await runConsolidation(companyId, consolData, actor);

        expect(result.runId).toBeDefined();
        expect(result.summary).toBeDefined();
        expect(result.consolidatedPl).toBeDefined();
        expect(result.consolidatedBs).toBeDefined();
    });

    it("should calculate minority interest correctly", async () => {
        // Set up entities with partial ownership
        await upsertEntity(companyId, {
            entity_code: "MY-CO",
            name: "Malaysia Company",
            base_ccy: "MYR",
            active: true
        });

        await upsertEntity(companyId, {
            entity_code: "SG-CO",
            name: "Singapore Company",
            base_ccy: "SGD",
            active: true
        });

        await upsertGroup(companyId, {
            group_code: "APAC-GRP",
            name: "APAC Group",
            presentation_ccy: "USD"
        });

        // 70% ownership -> 30% minority interest
        await upsertOwnership(companyId, {
            group_code: "APAC-GRP",
            parent_code: "MY-CO",
            child_code: "SG-CO",
            pct: 0.7,
            eff_from: "2025-01-01"
        });

        const consolData = {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true,
            present_ccy: "USD"
        };

        const result = await runConsolidation(companyId, consolData, actor);

        // Check that minority interest summary is created
        const minoritySummary = result.summary.find(s => s.component === 'MINORITY');
        expect(minoritySummary).toBeDefined();
        expect(minoritySummary?.label).toBe('Minority Interest');
    });

    it("should handle currency translation with CTA", async () => {
        // Set up entities with different base currencies
        await upsertEntity(companyId, {
            entity_code: "MY-CO",
            name: "Malaysia Company",
            base_ccy: "MYR",
            active: true
        });

        await upsertEntity(companyId, {
            entity_code: "SG-CO",
            name: "Singapore Company",
            base_ccy: "SGD",
            active: true
        });

        await upsertGroup(companyId, {
            group_code: "APAC-GRP",
            name: "APAC Group",
            presentation_ccy: "USD"
        });

        await upsertOwnership(companyId, {
            group_code: "APAC-GRP",
            parent_code: "MY-CO",
            child_code: "SG-CO",
            pct: 1.0,
            eff_from: "2025-01-01"
        });

        const consolData = {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true,
            present_ccy: "USD"
        };

        const result = await runConsolidation(companyId, consolData, actor);

        // Check that translation summary is created
        const translationSummary = result.summary.find(s => s.component === 'TRANSLATION');
        expect(translationSummary).toBeDefined();
        expect(translationSummary?.label).toBe('Currency Translation Adjustment');
    });

    it("should be idempotent on multiple runs", async () => {
        // Set up basic consolidation structure
        await upsertEntity(companyId, {
            entity_code: "MY-CO",
            name: "Malaysia Company",
            base_ccy: "MYR",
            active: true
        });

        await upsertGroup(companyId, {
            group_code: "APAC-GRP",
            name: "APAC Group",
            presentation_ccy: "USD"
        });

        const consolData = {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true,
            present_ccy: "USD"
        };

        const result1 = await runConsolidation(companyId, consolData, actor);
        const result2 = await runConsolidation(companyId, consolData, actor);

        // Both runs should produce consistent results
        expect(result1.summary).toHaveLength(result2.summary.length);
        expect(result1.consolidatedPl).toHaveLength(result2.consolidatedPl?.length || 0);
        expect(result1.consolidatedBs).toHaveLength(result2.consolidatedBs?.length || 0);
    });

    it("should retrieve consolidation runs", async () => {
        // Run a consolidation first
        await upsertEntity(companyId, {
            entity_code: "MY-CO",
            name: "Malaysia Company",
            base_ccy: "MYR",
            active: true
        });

        await upsertGroup(companyId, {
            group_code: "APAC-GRP",
            name: "APAC Group",
            presentation_ccy: "USD"
        });

        await runConsolidation(companyId, {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true,
            present_ccy: "USD"
        }, actor);

        const runs = await getConsolRuns(companyId, "APAC-GRP", 2025, 11);

        expect(runs).toHaveLength(1);
        expect(runs[0]?.groupCode).toBe("APAC-GRP");
        expect(runs[0]?.year).toBe(2025);
        expect(runs[0]?.month).toBe(11);
        expect(runs[0]?.mode).toBe("dry_run");
        expect(runs[0]?.presentCcy).toBe("USD");
    });
});
