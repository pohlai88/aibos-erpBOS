import { describe, it, expect, beforeEach } from "vitest";
import { runIcElimination, getIcElimRuns } from "../elimination";
import { createIcMatch, createIcLink } from "../ic";

describe("IC Elimination Engine", () => {
    const companyId = "test-company";
    const actor = "test-user";

    beforeEach(async () => {
        // Clean up test data
        // Note: In real tests, you'd use a test database
    });

    it("should run dry-run IC elimination without posting journals", async () => {
        // First create a match
        const link1 = await createIcLink(companyId, {
            entity_code: "MY-CO",
            co_entity_cp: "SG-CO",
            source_type: "AR",
            source_id: "INV-1001",
            amount_base: 1200.00
        });

        const link2 = await createIcLink(companyId, {
            entity_code: "SG-CO",
            co_entity_cp: "MY-CO",
            source_type: "AP",
            source_id: "INV-1001",
            amount_base: -1200.00
        });

        await createIcMatch(companyId, {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            link_ids: [link1.id, link2.id],
            tolerance: 0.01
        }, actor);

        const elimData = {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true,
            memo: "Test dry run"
        };

        const result = await runIcElimination(companyId, elimData, actor);

        expect(result.runId).toBeDefined();
        expect(result.summary.journalsPosted).toBeUndefined();
        expect(result.summary.totalEliminations).toBeGreaterThan(0);
        expect(result.lines).toHaveLength(1);
        expect(result.lines[0]?.entityCode).toBe("MY-CO");
        expect(result.lines[0]?.cpCode).toBe("SG-CO");
        expect(result.lines[0]?.amountBase).toBe(1200.00);
    });

    it("should be idempotent on second dry-run", async () => {
        // Create match and run elimination twice
        const link1 = await createIcLink(companyId, {
            entity_code: "MY-CO",
            co_entity_cp: "SG-CO",
            source_type: "AR",
            source_id: "INV-1001",
            amount_base: 1200.00
        });

        const link2 = await createIcLink(companyId, {
            entity_code: "SG-CO",
            co_entity_cp: "MY-CO",
            source_type: "AP",
            source_id: "INV-1001",
            amount_base: -1200.00
        });

        await createIcMatch(companyId, {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            link_ids: [link1.id, link2.id],
            tolerance: 0.01
        }, actor);

        const elimData = {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true
        };

        const result1 = await runIcElimination(companyId, elimData, actor);
        const result2 = await runIcElimination(companyId, elimData, actor);

        // Both runs should produce the same elimination lines
        expect(result1.lines).toHaveLength(result2.lines.length);
        expect(result1.summary.totalEliminations).toBe(result2.summary.totalEliminations);
    });

    it("should handle multiple entity pairs correctly", async () => {
        // Create multiple IC links for different entity pairs
        const link1 = await createIcLink(companyId, {
            entity_code: "MY-CO",
            co_entity_cp: "SG-CO",
            source_type: "AR",
            source_id: "INV-1001",
            amount_base: 1200.00
        });

        const link2 = await createIcLink(companyId, {
            entity_code: "SG-CO",
            co_entity_cp: "MY-CO",
            source_type: "AP",
            source_id: "INV-1001",
            amount_base: -1200.00
        });

        const link3 = await createIcLink(companyId, {
            entity_code: "MY-CO",
            co_entity_cp: "TH-CO",
            source_type: "AR",
            source_id: "INV-1002",
            amount_base: 800.00
        });

        const link4 = await createIcLink(companyId, {
            entity_code: "TH-CO",
            co_entity_cp: "MY-CO",
            source_type: "AP",
            source_id: "INV-1002",
            amount_base: -800.00
        });

        await createIcMatch(companyId, {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            link_ids: [link1.id, link2.id, link3.id, link4.id],
            tolerance: 0.01
        }, actor);

        const elimData = {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true
        };

        const result = await runIcElimination(companyId, elimData, actor);

        expect(result.lines).toHaveLength(2); // Two entity pairs
        expect(result.summary.totalEliminations).toBe(2000.00); // 1200 + 800
    });

    it("should retrieve IC elimination runs", async () => {
        // Create and run an elimination
        const link1 = await createIcLink(companyId, {
            entity_code: "MY-CO",
            co_entity_cp: "SG-CO",
            source_type: "AR",
            source_id: "INV-1001",
            amount_base: 1200.00
        });

        const link2 = await createIcLink(companyId, {
            entity_code: "SG-CO",
            co_entity_cp: "MY-CO",
            source_type: "AP",
            source_id: "INV-1001",
            amount_base: -1200.00
        });

        await createIcMatch(companyId, {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            link_ids: [link1.id, link2.id],
            tolerance: 0.01
        }, actor);

        await runIcElimination(companyId, {
            group_code: "APAC-GRP",
            year: 2025,
            month: 11,
            dry_run: true
        }, actor);

        const runs = await getIcElimRuns(companyId, "APAC-GRP", 2025, 11);

        expect(runs).toHaveLength(1);
        expect(runs[0]?.groupCode).toBe("APAC-GRP");
        expect(runs[0]?.year).toBe(2025);
        expect(runs[0]?.month).toBe(11);
        expect(runs[0]?.mode).toBe("dry_run");
    });
});
