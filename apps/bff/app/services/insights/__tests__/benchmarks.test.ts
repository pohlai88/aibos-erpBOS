import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InsightsBenchmarksService } from "@/services/insights/benchmarks";
import { db } from "@/lib/db";
import {
    insBenchBaseline,
    insBenchTarget,
    insFactClose,
    closeRun
} from "@aibos/db-adapter/schema";
import { eq, and } from "drizzle-orm";

describe("InsightsBenchmarksService", () => {
    const companyId = "test-company";
    const userId = "test-user";
    let service: InsightsBenchmarksService;

    beforeEach(async () => {
        service = new InsightsBenchmarksService();
        // Clean up test data
        await db.delete(insBenchTarget);
        await db.delete(insBenchBaseline);
        await db.delete(insFactClose);
        await db.delete(closeRun);

        // Create test close facts for baseline calculation
        await db.insert(insFactClose).values([
            {
                id: "fact-1",
                companyId,
                runId: "run-1",
                year: 2025,
                month: 1,
                daysToClose: "3",
                onTimeRate: "95",
                lateTasks: 1,
                exceptionsOpen: 2,
                exceptionsMaterial: 0,
                certsDone: 1,
                computedAt: new Date("2025-01-05T00:00:00Z")
            },
            {
                id: "fact-2",
                companyId,
                runId: "run-2",
                year: 2025,
                month: 2,
                daysToClose: "4",
                onTimeRate: "90",
                lateTasks: 2,
                exceptionsOpen: 3,
                exceptionsMaterial: 1,
                certsDone: 1,
                computedAt: new Date("2025-02-05T00:00:00Z")
            },
            {
                id: "fact-3",
                companyId,
                runId: "run-3",
                year: 2025,
                month: 3,
                daysToClose: "5",
                onTimeRate: "85",
                lateTasks: 3,
                exceptionsOpen: 4,
                exceptionsMaterial: 2,
                certsDone: 1,
                computedAt: new Date("2025-03-05T00:00:00Z")
            }
        ]);
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(insBenchTarget);
        await db.delete(insBenchBaseline);
        await db.delete(insFactClose);
        await db.delete(closeRun);
    });

    it("should compute SELF benchmarks correctly", async () => {
        const result = await service.computeBenchmarks(companyId, "SELF");

        expect(result.success).toBe(true);
        expect(result.baselines_created).toBeGreaterThan(0);
        expect(result.metrics_processed).toContain("DAYS_TO_CLOSE");
        expect(result.metrics_processed).toContain("ON_TIME_RATE");

        // Check that baselines were created
        const baselines = await db
            .select()
            .from(insBenchBaseline)
            .where(and(
                eq(insBenchBaseline.companyId, companyId),
                eq(insBenchBaseline.entityGroup, "SELF")
            ));

        expect(baselines.length).toBeGreaterThan(0);

        const daysToCloseBaseline = baselines.find(b => b.metric === "DAYS_TO_CLOSE");
        expect(daysToCloseBaseline).toBeDefined();
        expect(parseFloat(daysToCloseBaseline!.p50)).toBeGreaterThan(0);
        expect(parseFloat(daysToCloseBaseline!.p75)).toBeGreaterThan(parseFloat(daysToCloseBaseline!.p50));
        expect(parseFloat(daysToCloseBaseline!.p90)).toBeGreaterThan(parseFloat(daysToCloseBaseline!.p75));
    });

    it("should seed benchmarks manually", async () => {
        const seedData = {
            entity_group: "SELF" as const,
            metric: "DAYS_TO_CLOSE",
            granularity: "MONTH" as const,
            window_start: "2025-01-01T00:00:00Z",
            window_end: "2025-03-31T23:59:59Z"
        };

        await service.seedBenchmarks(companyId, seedData);

        const baselines = await db
            .select()
            .from(insBenchBaseline)
            .where(and(
                eq(insBenchBaseline.companyId, companyId),
                eq(insBenchBaseline.metric, "DAYS_TO_CLOSE"),
                eq(insBenchBaseline.entityGroup, "SELF")
            ));

        expect(baselines).toHaveLength(1);
        expect(baselines[0]?.granularity).toBe("MONTH");
        expect(parseFloat(baselines[0]?.value || "0")).toBe(5); // Latest value
        expect(parseFloat(baselines[0]?.p50 || "0")).toBe(4); // Median
        expect(parseFloat(baselines[0]?.p75 || "0")).toBe(4.5); // 75th percentile
        expect(parseFloat(baselines[0]?.p90 || "0")).toBe(5); // 90th percentile
    });

    it("should upsert targets correctly", async () => {
        const targetData = {
            metric: "DAYS_TO_CLOSE",
            target: 3,
            effective_from: "2025-01-01T00:00:00Z",
            effective_to: "2025-12-31T23:59:59Z"
        };

        await service.upsertTarget(companyId, userId, targetData);

        const targets = await db
            .select()
            .from(insBenchTarget)
            .where(and(
                eq(insBenchTarget.companyId, companyId),
                eq(insBenchTarget.metric, "DAYS_TO_CLOSE")
            ));

        expect(targets).toHaveLength(1);
        expect(parseFloat(targets[0]?.target || "0")).toBe(3);
        expect(targets[0]?.createdBy).toBe(userId);
        expect(targets[0]?.updatedBy).toBe(userId);
    });

    it("should get benchmark deltas correctly", async () => {
        // Create a baseline
        await db.insert(insBenchBaseline).values({
            id: "baseline-1",
            companyId,
            entityGroup: "SELF",
            metric: "DAYS_TO_CLOSE",
            granularity: "MONTH",
            value: "4",
            p50: "3",
            p75: "4",
            p90: "5",
            windowStart: new Date("2025-01-01T00:00:00Z"),
            windowEnd: new Date("2025-03-31T23:59:59Z")
        });

        // Create a target
        await db.insert(insBenchTarget).values({
            id: "target-1",
            companyId,
            metric: "DAYS_TO_CLOSE",
            target: "3",
            effectiveFrom: new Date("2025-01-01T00:00:00Z"),
            effectiveTo: null,
            createdBy: userId,
            updatedBy: userId
        });

        const deltas = await service.getBenchmarkDeltas(companyId);

        expect(deltas).toHaveLength(1);
        expect(deltas[0].metric).toBe("DAYS_TO_CLOSE");
        expect(deltas[0].currentValue).toBe("4");
        expect(deltas[0].p50).toBe("3");
        expect(deltas[0].p75).toBe("4");
        expect(deltas[0].p90).toBe("5");
        expect(deltas[0].target).toBe("3");
        expect(deltas[0].deltaToTarget).toBe(1); // 4 - 3
        expect(deltas[0].deltaToP50).toBe(1); // 4 - 3
        expect(deltas[0].deltaToP90).toBe(-1); // 4 - 5
    });

    it("should handle empty values gracefully", async () => {
        // Test with no facts data
        await db.delete(insFactClose);

        const result = await service.computeBenchmarks(companyId, "SELF");

        expect(result.success).toBe(true);
        expect(result.baselines_created).toBe(0);
        expect(result.metrics_processed).toHaveLength(0);
    });

    it("should compute percentiles correctly", async () => {
        // Test percentile calculation with known values
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        // Access private method through type assertion
        const serviceAny = service as any;
        const percentiles = serviceAny.computePercentiles(values);

        expect(percentiles.p50).toBe(5); // Median
        expect(percentiles.p75).toBe(8); // 75th percentile
        expect(percentiles.p90).toBe(9); // 90th percentile
    });

    it("should handle PEER and GLOBAL entity groups", async () => {
        // Test PEER group (should return empty for now)
        const peerResult = await service.computeBenchmarks(companyId, "PEER");
        expect(peerResult.success).toBe(true);
        expect(peerResult.baselines_created).toBe(0);

        // Test GLOBAL group (should return empty for now)
        const globalResult = await service.computeBenchmarks(companyId, "GLOBAL");
        expect(globalResult.success).toBe(true);
        expect(globalResult.baselines_created).toBe(0);
    });
});
