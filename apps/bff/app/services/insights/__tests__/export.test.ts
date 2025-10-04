import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InsightsExportService } from "@/services/insights/export";
import { db } from "@/lib/db";
import {
    insFactClose,
    insFactTask,
    insFactCtrl,
    insFactFlux,
    insAnomaly,
    insReco,
    ctrlRun,
    fluxRun,
    closeRun
} from "@aibos/db-adapter/schema";
import { eq, and } from "drizzle-orm";

describe("InsightsExportService", () => {
    const companyId = "test-company";
    const userId = "test-user";
    let service: InsightsExportService;

    beforeEach(async () => {
        service = new InsightsExportService();
        // Clean up test data
        await db.delete(insReco);
        await db.delete(insAnomaly);
        await db.delete(insFactFlux);
        await db.delete(insFactCtrl);
        await db.delete(insFactTask);
        await db.delete(insFactClose);
        await db.delete(ctrlRun);
        await db.delete(fluxRun);
        await db.delete(closeRun);

        // Create test close run
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

        // Create test close facts
        await db.insert(insFactClose).values({
            id: "fact-close-1",
            companyId,
            runId: "run-1",
            year: 2025,
            month: 1,
            daysToClose: "4",
            onTimeRate: "90",
            lateTasks: 1,
            exceptionsOpen: 2,
            exceptionsMaterial: 0,
            certsDone: 1,
            computedAt: new Date("2025-01-05T00:00:00Z")
        });

        // Create test task facts
        await db.insert(insFactTask).values([
            {
                id: "fact-task-1",
                runId: "run-1",
                taskId: "task-1",
                code: "JE_CUTOFF",
                owner: "accounting",
                startedAt: new Date("2025-01-01T00:00:00Z"),
                finishedAt: new Date("2025-01-02T00:00:00Z"),
                slaDueAt: new Date("2025-01-01T18:00:00Z"),
                status: "DONE",
                ageHours: "24",
                breached: false
            },
            {
                id: "fact-task-2",
                runId: "run-1",
                taskId: "task-2",
                code: "BANK_REC",
                owner: "accounting",
                startedAt: new Date("2025-01-01T00:00:00Z"),
                finishedAt: new Date("2025-01-03T00:00:00Z"),
                slaDueAt: new Date("2025-01-02T00:00:00Z"),
                status: "DONE",
                ageHours: "48",
                breached: true
            }
        ]);

        // Create test control run
        await db.insert(ctrlRun).values({
            id: "ctrl-run-1",
            companyId,
            controlId: "ctrl-1",
            runId: "run-1",
            scheduledAt: new Date("2025-01-01T00:00:00Z"),
            startedAt: new Date("2025-01-01T01:00:00Z"),
            finishedAt: new Date("2025-01-01T01:30:00Z"),
            status: "PASS",
            notes: "Control passed",
            createdBy: userId
        });

        // Create test control facts
        await db.insert(insFactCtrl).values({
            id: "fact-ctrl-1",
            ctrlRunId: "ctrl-run-1",
            controlCode: "BANK_REC_CTRL",
            status: "PASS",
            severity: "HIGH",
            exceptionsCount: 0,
            waived: 0,
            evidenceCount: 2,
            durationMs: 1800000,
            materialFail: false
        });

        // Create test flux run
        await db.insert(fluxRun).values({
            id: "flux-run-1",
            companyId,
            runId: "run-1",
            baseYear: 2024,
            baseMonth: 12,
            cmpYear: 2025,
            cmpMonth: 1,
            presentCcy: "USD",
            status: "COMPLETED",
            createdBy: userId
        });

        // Create test flux facts
        await db.insert(insFactFlux).values({
            id: "fact-flux-1",
            fluxRunId: "flux-run-1",
            scope: "2024",
            presentCcy: "USD",
            material: 5,
            commentMissing: 2,
            topDeltaAbs: "10000",
            topDeltaPct: "0.1"
        });

        // Create test anomaly
        await db.insert(insAnomaly).values({
            id: "anomaly-1",
            companyId,
            runId: "run-1",
            kind: "TASK",
            signal: { taskCode: "JE_CUTOFF", pattern: "repeated_late" },
            score: "0.8",
            severity: "HIGH",
            openedAt: new Date("2025-01-05T00:00:00Z")
        });

        // Create test recommendation
        await db.insert(insReco).values({
            id: "reco-1",
            companyId,
            runId: "run-1",
            recoCode: "TASK_SLA_OPTIMIZATION",
            title: "Optimize Task SLA Timing",
            detail: { recommendation: "Shift JE cutoff task earlier" },
            impactEstimate: "0.5",
            effort: "LOW",
            status: "OPEN",
            createdBy: "system",
            updatedBy: "system"
        });
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(insReco);
        await db.delete(insAnomaly);
        await db.delete(insFactFlux);
        await db.delete(insFactCtrl);
        await db.delete(insFactTask);
        await db.delete(insFactClose);
        await db.delete(ctrlRun);
        await db.delete(fluxRun);
        await db.delete(closeRun);
    });

    it("should export close facts correctly", async () => {
        const exportData = {
            kind: "CLOSE" as const,
            format: "json" as const,
            from: "2025-01-01T00:00:00Z",
            to: "2025-01-31T23:59:59Z"
        };

        const result = await service.exportData(companyId, exportData);

        expect(result.success).toBe(true);
        expect(result.record_count).toBe(1);
        expect(result.format).toBe("json");
        expect(result.download_url).toBeDefined();

        // Verify the exported data structure
        const records = await service.exportCloseFacts(
            companyId,
            new Date("2025-01-01T00:00:00Z"),
            new Date("2025-01-31T23:59:59Z")
        );

        expect(records).toHaveLength(1);
        expect(records[0].id).toBe("fact-close-1");
        expect(records[0].company_id).toBe(companyId);
        expect(records[0].run_id).toBe("run-1");
        expect(records[0].year).toBe(2025);
        expect(records[0].month).toBe(1);
        expect(records[0].days_to_close).toBe(4);
        expect(records[0].on_time_rate).toBe(90);
        expect(records[0].late_tasks).toBe(1);
        expect(records[0].exceptions_open).toBe(2);
        expect(records[0].exceptions_material).toBe(0);
        expect(records[0].certs_done).toBe(1);
    });

    it("should export task facts correctly", async () => {
        const exportData = {
            kind: "TASK" as const,
            format: "csv" as const,
            from: "2025-01-01T00:00:00Z",
            to: "2025-01-31T23:59:59Z"
        };

        const result = await service.exportData(companyId, exportData);

        expect(result.success).toBe(true);
        expect(result.record_count).toBe(2);
        expect(result.format).toBe("csv");

        // Verify the exported data structure
        const records = await service.exportTaskFacts(
            companyId,
            new Date("2025-01-01T00:00:00Z"),
            new Date("2025-01-31T23:59:59Z")
        );

        expect(records).toHaveLength(2);

        const jeTask = records.find(r => r.code === "JE_CUTOFF");
        expect(jeTask).toBeDefined();
        expect(jeTask?.run_id).toBe("run-1");
        expect(jeTask?.task_id).toBe("task-1");
        expect(jeTask?.owner).toBe("accounting");
        expect(jeTask?.status).toBe("DONE");
        expect(jeTask?.age_hours).toBe(24);
        expect(jeTask?.breached).toBe(false);

        const bankTask = records.find(r => r.code === "BANK_REC");
        expect(bankTask).toBeDefined();
        expect(bankTask?.age_hours).toBe(48);
        expect(bankTask?.breached).toBe(true);
    });

    it("should export control facts correctly", async () => {
        const exportData = {
            kind: "CTRL" as const,
            format: "json" as const,
            from: "2025-01-01T00:00:00Z",
            to: "2025-01-31T23:59:59Z"
        };

        const result = await service.exportData(companyId, exportData);

        expect(result.success).toBe(true);
        expect(result.record_count).toBe(1);

        // Verify the exported data structure
        const records = await service.exportControlFacts(
            companyId,
            new Date("2025-01-01T00:00:00Z"),
            new Date("2025-01-31T23:59:59Z")
        );

        expect(records).toHaveLength(1);
        expect(records[0].id).toBe("fact-ctrl-1");
        expect(records[0].ctrl_run_id).toBe("ctrl-run-1");
        expect(records[0].control_code).toBe("BANK_REC_CTRL");
        expect(records[0].status).toBe("PASS");
        expect(records[0].severity).toBe("HIGH");
        expect(records[0].exceptions_count).toBe(0);
        expect(records[0].waived).toBe(0);
        expect(records[0].evidence_count).toBe(2);
        expect(records[0].duration_ms).toBe(1800000);
        expect(records[0].material_fail).toBe(false);
    });

    it("should export flux facts correctly", async () => {
        const exportData = {
            kind: "FLUX" as const,
            format: "csv" as const,
            from: "2025-01-01T00:00:00Z",
            to: "2025-01-31T23:59:59Z"
        };

        const result = await service.exportData(companyId, exportData);

        expect(result.success).toBe(true);
        expect(result.record_count).toBe(1);

        // Verify the exported data structure
        const records = await service.exportFluxFacts(
            companyId,
            new Date("2025-01-01T00:00:00Z"),
            new Date("2025-01-31T23:59:59Z")
        );

        expect(records).toHaveLength(1);
        expect(records[0].id).toBe("fact-flux-1");
        expect(records[0].flux_run_id).toBe("flux-run-1");
        expect(records[0].scope).toBe("2024");
        expect(records[0].present_ccy).toBe("USD");
        expect(records[0].material).toBe(5);
        expect(records[0].comment_missing).toBe(2);
        expect(records[0].top_delta_abs).toBe(10000);
        expect(records[0].top_delta_pct).toBe(0.1);
    });

    it("should export anomalies correctly", async () => {
        const exportData = {
            kind: "ANOMALY" as const,
            format: "json" as const,
            from: "2025-01-01T00:00:00Z",
            to: "2025-01-31T23:59:59Z"
        };

        const result = await service.exportData(companyId, exportData);

        expect(result.success).toBe(true);
        expect(result.record_count).toBe(1);

        // Verify the exported data structure
        const records = await service.exportAnomalies(
            companyId,
            new Date("2025-01-01T00:00:00Z"),
            new Date("2025-01-31T23:59:59Z")
        );

        expect(records).toHaveLength(1);
        expect(records[0].id).toBe("anomaly-1");
        expect(records[0].company_id).toBe(companyId);
        expect(records[0].run_id).toBe("run-1");
        expect(records[0].kind).toBe("TASK");
        expect(records[0].signal.taskCode).toBe("JE_CUTOFF");
        expect(records[0].signal.pattern).toBe("repeated_late");
        expect(records[0].score).toBe(0.8);
        expect(records[0].severity).toBe("HIGH");
    });

    it("should handle date filtering correctly", async () => {
        // Test with date range that excludes all data
        const exportData = {
            kind: "CLOSE" as const,
            format: "json" as const,
            from: "2025-02-01T00:00:00Z",
            to: "2025-02-28T23:59:59Z"
        };

        const result = await service.exportData(companyId, exportData);

        expect(result.success).toBe(true);
        expect(result.record_count).toBe(0);
    });

    it("should handle missing data gracefully", async () => {
        // Test with kind that has no data
        const exportData = {
            kind: "CLOSE" as const,
            format: "json" as const,
            from: "2025-01-01T00:00:00Z",
            to: "2025-01-31T23:59:59Z"
        };

        // Delete all close facts
        await db.delete(insFactClose);

        const result = await service.exportData(companyId, exportData);

        expect(result.success).toBe(true);
        expect(result.record_count).toBe(0);
    });

    it("should get export statistics correctly", async () => {
        const stats = await service.getExportStats(companyId);

        expect(stats.close_facts).toBe(1);
        expect(stats.task_facts).toBe(2);
        expect(stats.ctrl_facts).toBe(1);
        expect(stats.flux_facts).toBe(1);
        expect(stats.anomalies).toBe(1);
        expect(stats.recommendations).toBe(1);
    });

    it("should handle unsupported export kind", async () => {
        const exportData = {
            kind: "UNSUPPORTED" as any,
            format: "json" as const,
            from: "2025-01-01T00:00:00Z",
            to: "2025-01-31T23:59:59Z"
        };

        await expect(service.exportData(companyId, exportData))
            .rejects.toThrow("Unsupported export kind: UNSUPPORTED");
    });

    it("should generate download URLs correctly", async () => {
        const records = [{ id: "test", data: "test" }];

        // Access private methods through type assertion
        const serviceAny = service as any;

        const csvUrl = await serviceAny.generateCsvDownload(records, "CLOSE");
        expect(csvUrl).toMatch(/\/downloads\/insights-CLOSE-.*\.csv$/);

        const jsonUrl = await serviceAny.generateJsonDownload(records, "TASK");
        expect(jsonUrl).toMatch(/\/downloads\/insights-TASK-.*\.json$/);
    });
});
