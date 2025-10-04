import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { KpiService } from "@/services/close/kpi";
import { db } from "@/lib/db";
import { closeKpi, closeRun, closeTask } from "@aibos/db-adapter/schema";
import { eq, and } from "drizzle-orm";

describe("KpiService", () => {
    const companyId = "test-company";
    const userId = "test-user";
    let service: KpiService;

    beforeEach(async () => {
        service = new KpiService();
        // Clean up test data
        await db.delete(closeKpi);
        await db.delete(closeTask);
        await db.delete(closeRun);

        // Create test close runs
        await db.insert(closeRun).values([
            {
                id: "run-1",
                companyId,
                year: 2025,
                month: 1,
                status: "PUBLISHED",
                startedAt: new Date("2025-01-01T00:00:00Z"),
                closedAt: new Date("2025-01-05T00:00:00Z"),
                owner: "ops",
                createdBy: userId,
                updatedBy: userId
            },
            {
                id: "run-2",
                companyId,
                year: 2025,
                month: 2,
                status: "PUBLISHED",
                startedAt: new Date("2025-02-01T00:00:00Z"),
                closedAt: new Date("2025-02-03T00:00:00Z"),
                owner: "ops",
                createdBy: userId,
                updatedBy: userId
            }
        ]);
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(closeKpi);
        await db.delete(closeTask);
        await db.delete(closeRun);
    });

    describe("computeKpis", () => {
        it("should compute KPIs for a close run", async () => {
            // Create a close run
            await db.insert(closeRun).values({
                id: "run-1",
                companyId,
                year: 2025,
                month: 1,
                status: "PUBLISHED",
                startedAt: new Date("2025-01-01T00:00:00Z"),
                closedAt: new Date("2025-01-05T00:00:00Z"),
                owner: "ops",
                createdBy: userId,
                updatedBy: userId
            });

            // Create tasks for the run
            await db.insert(closeTask).values([
                {
                    id: "task-1",
                    runId: "run-1",
                    code: "TASK1",
                    title: "Task 1",
                    owner: "ops",
                    slaDueAt: new Date("2025-01-03T00:00:00Z"),
                    status: "DONE",
                    priority: 5,
                    evidenceRequired: false,
                    updatedBy: userId
                },
                {
                    id: "task-2",
                    runId: "run-1",
                    code: "TASK2",
                    title: "Task 2",
                    owner: "ops",
                    slaDueAt: new Date("2025-01-02T00:00:00Z"),
                    status: "DONE",
                    priority: 5,
                    evidenceRequired: false,
                    updatedBy: userId
                },
                {
                    id: "task-3",
                    runId: "run-1",
                    code: "TASK3",
                    title: "Task 3",
                    owner: "ops",
                    slaDueAt: new Date("2025-01-01T00:00:00Z"),
                    status: "OPEN",
                    priority: 5,
                    evidenceRequired: false,
                    updatedBy: userId
                }
            ]);

            await service.computeKpis(companyId, "run-1");

            // Check that KPIs were created
            const kpis = await db
                .select()
                .from(closeKpi)
                .where(and(
                    eq(closeKpi.companyId, companyId),
                    eq(closeKpi.runId, "run-1")
                ));

            expect(kpis.length).toBe(4); // DAYS_TO_CLOSE, ON_TIME_RATE, AVG_TASK_AGE, LATE_TASKS

            const kpiMap = new Map(kpis.map(kpi => [kpi.metric, Number(kpi.value)]));

            expect(kpiMap.get("DAYS_TO_CLOSE")).toBe(4); // 5 days - 1 day = 4 days
            expect(kpiMap.get("ON_TIME_RATE")).toBe(100); // All tasks with SLA completed on time
            expect(kpiMap.get("LATE_TASKS")).toBe(1); // One task overdue
        });

        it("should compute KPIs for all runs when no runId provided", async () => {
            // Create multiple close runs
            await db.insert(closeRun).values([
                {
                    id: "run-1",
                    companyId,
                    year: 2025,
                    month: 1,
                    status: "PUBLISHED",
                    startedAt: new Date("2025-01-01T00:00:00Z"),
                    closedAt: new Date("2025-01-05T00:00:00Z"),
                    owner: "ops",
                    createdBy: userId,
                    updatedBy: userId
                },
                {
                    id: "run-2",
                    companyId,
                    year: 2025,
                    month: 2,
                    status: "PUBLISHED",
                    startedAt: new Date("2025-02-01T00:00:00Z"),
                    closedAt: new Date("2025-02-03T00:00:00Z"),
                    owner: "ops",
                    createdBy: userId,
                    updatedBy: userId
                }
            ]);

            await service.computeKpis(companyId);

            // Check that KPIs were created for both runs
            const kpis = await db
                .select()
                .from(closeKpi)
                .where(eq(closeKpi.companyId, companyId));

            expect(kpis.length).toBe(8); // 4 KPIs per run
        });
    });

    describe("queryKpis", () => {
        it("should query KPIs correctly", async () => {
            // Create test KPIs
            await db.insert(closeKpi).values([
                {
                    id: "kpi-1",
                    companyId,
                    runId: "run-1",
                    metric: "DAYS_TO_CLOSE",
                    value: "5"
                },
                {
                    id: "kpi-2",
                    companyId,
                    runId: "run-1",
                    metric: "ON_TIME_RATE",
                    value: "95"
                },
                {
                    id: "kpi-3",
                    companyId,
                    runId: "run-2",
                    metric: "DAYS_TO_CLOSE",
                    value: "3"
                }
            ]);

            const query = {
                run_id: "run-1",
                metric: "DAYS_TO_CLOSE" as const,
                limit: 10,
                offset: 0
            };

            const kpis = await service.queryKpis(companyId, query);

            expect(kpis.length).toBe(1);
            expect(kpis[0]?.run_id).toBe("run-1");
            expect(kpis[0]?.metric).toBe("DAYS_TO_CLOSE");
            expect(kpis[0]?.value).toBe(5);
        });
    });

    describe("getKpiTrends", () => {
        it("should return KPI trends for a metric", async () => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

            // Create test KPIs with different dates
            await db.insert(closeKpi).values([
                {
                    id: "kpi-1",
                    companyId,
                    runId: "run-1",
                    metric: "DAYS_TO_CLOSE",
                    value: "5",
                    computedAt: twoDaysAgo
                },
                {
                    id: "kpi-2",
                    companyId,
                    runId: "run-2",
                    metric: "DAYS_TO_CLOSE",
                    value: "4",
                    computedAt: yesterday
                },
                {
                    id: "kpi-3",
                    companyId,
                    runId: "run-3",
                    metric: "DAYS_TO_CLOSE",
                    value: "3",
                    computedAt: now
                }
            ]);

            const trends = await service.getKpiTrends(companyId, "DAYS_TO_CLOSE", 3);

            expect(trends.length).toBe(3);
            expect(trends[0]?.value).toBe(5); // Oldest first
            expect(trends[1]?.value).toBe(4);
            expect(trends[2]?.value).toBe(3); // Newest last
        });
    });

    describe("getDashboardKpis", () => {
        it("should return latest KPIs for dashboard", async () => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Create test KPIs with different dates
            await db.insert(closeKpi).values([
                {
                    id: "kpi-1",
                    companyId,
                    runId: "run-1",
                    metric: "DAYS_TO_CLOSE",
                    value: "5",
                    computedAt: yesterday
                },
                {
                    id: "kpi-2",
                    companyId,
                    runId: "run-1",
                    metric: "ON_TIME_RATE",
                    value: "95",
                    computedAt: yesterday
                },
                {
                    id: "kpi-3",
                    companyId,
                    runId: "run-2",
                    metric: "DAYS_TO_CLOSE",
                    value: "3",
                    computedAt: now
                },
                {
                    id: "kpi-4",
                    companyId,
                    runId: "run-2",
                    metric: "ON_TIME_RATE",
                    value: "98",
                    computedAt: now
                },
                {
                    id: "kpi-5",
                    companyId,
                    runId: "run-2",
                    metric: "AVG_TASK_AGE",
                    value: "2.5",
                    computedAt: now
                },
                {
                    id: "kpi-6",
                    companyId,
                    runId: "run-2",
                    metric: "LATE_TASKS",
                    value: "1",
                    computedAt: now
                }
            ]);

            const dashboardKpis = await service.getDashboardKpis(companyId);

            expect(dashboardKpis.days_to_close).toBe(3); // Latest value
            expect(dashboardKpis.on_time_rate).toBe(98); // Latest value
            expect(dashboardKpis.avg_task_age).toBe(2.5);
            expect(dashboardKpis.late_tasks).toBe(1);
        });

        it("should return zeros when no KPIs exist", async () => {
            const dashboardKpis = await service.getDashboardKpis(companyId);

            expect(dashboardKpis.days_to_close).toBe(0);
            expect(dashboardKpis.on_time_rate).toBe(0);
            expect(dashboardKpis.avg_task_age).toBe(0);
            expect(dashboardKpis.late_tasks).toBe(0);
        });
    });
});
