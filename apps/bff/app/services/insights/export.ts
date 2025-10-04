import { db } from "@/lib/db";
import {
    insFactClose,
    insFactTask,
    insFactCtrl,
    insFactFlux,
    insAnomaly,
    insReco,
    ctrlRun,
    fluxRun
} from "@aibos/db-adapter/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { logLine } from "@/lib/log";
import type {
    InsightsExportResponseType,
    InsightsExportReqType
} from "@aibos/contracts";

export class InsightsExportService {
    /**
     * Export insights data in specified format
     */
    async exportData(
        companyId: string,
        data: InsightsExportReqType
    ): Promise<InsightsExportResponseType> {
        const fromDate = data.from ? new Date(data.from) : undefined;
        const toDate = data.to ? new Date(data.to) : undefined;

        let records: any[] = [];
        let recordCount = 0;

        try {
            switch (data.kind) {
                case "CLOSE":
                    records = await this.exportCloseFacts(companyId, fromDate, toDate);
                    break;
                case "TASK":
                    records = await this.exportTaskFacts(companyId, fromDate, toDate);
                    break;
                case "CTRL":
                    records = await this.exportControlFacts(companyId, fromDate, toDate);
                    break;
                case "FLUX":
                    records = await this.exportFluxFacts(companyId, fromDate, toDate);
                    break;
                case "ANOMALY":
                    records = await this.exportAnomalies(companyId, fromDate, toDate);
                    break;
                default:
                    throw new Error(`Unsupported export kind: ${data.kind}`);
            }

            recordCount = records.length;

            let downloadUrl: string | undefined;
            if (data.format === "csv") {
                downloadUrl = await this.generateCsvDownload(records, data.kind);
            } else if (data.format === "json") {
                downloadUrl = await this.generateJsonDownload(records, data.kind);
            }

            logLine({
                msg: `Exported ${recordCount} ${data.kind} records`,
                companyId,
                kind: data.kind,
                format: data.format,
                recordCount
            });

            return {
                success: true,
                message: `Exported ${recordCount} records`,
                download_url: downloadUrl,
                record_count: recordCount,
                format: data.format
            };

        } catch (error) {
            logLine({
                msg: `Export failed for ${data.kind}`,
                error: error instanceof Error ? error.message : String(error),
                companyId,
                kind: data.kind
            });

            throw error;
        }
    }

    /**
     * Export close facts
     */
    async exportCloseFacts(
        companyId: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<any[]> {
        const whereConditions = [eq(insFactClose.companyId, companyId)];

        if (fromDate) {
            whereConditions.push(gte(insFactClose.computedAt, fromDate));
        }
        if (toDate) {
            whereConditions.push(lte(insFactClose.computedAt, toDate));
        }

        const facts = await db
            .select()
            .from(insFactClose)
            .where(and(...whereConditions))
            .orderBy(insFactClose.computedAt);

        return facts.map(fact => ({
            id: fact.id,
            company_id: fact.companyId,
            entity_id: fact.entityId,
            run_id: fact.runId,
            year: fact.year,
            month: fact.month,
            days_to_close: parseFloat(fact.daysToClose),
            on_time_rate: parseFloat(fact.onTimeRate),
            late_tasks: fact.lateTasks,
            exceptions_open: fact.exceptionsOpen,
            exceptions_material: fact.exceptionsMaterial,
            certs_done: fact.certsDone,
            computed_at: fact.computedAt.toISOString()
        }));
    }

    /**
     * Export task facts
     */
    async exportTaskFacts(
        companyId: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<any[]> {
        const whereConditions = [eq(insFactTask.runId, insFactClose.runId)];

        if (fromDate) {
            whereConditions.push(gte(insFactClose.computedAt, fromDate));
        }
        if (toDate) {
            whereConditions.push(lte(insFactClose.computedAt, toDate));
        }

        const facts = await db
            .select()
            .from(insFactTask)
            .innerJoin(insFactClose, eq(insFactTask.runId, insFactClose.runId))
            .where(and(
                eq(insFactClose.companyId, companyId),
                ...whereConditions
            ))
            .orderBy(insFactTask.createdAt);

        return facts.map(fact => ({
            id: fact.ins_fact_task.id,
            run_id: fact.ins_fact_task.runId,
            task_id: fact.ins_fact_task.taskId,
            code: fact.ins_fact_task.code,
            owner: fact.ins_fact_task.owner,
            started_at: fact.ins_fact_task.startedAt?.toISOString(),
            finished_at: fact.ins_fact_task.finishedAt?.toISOString(),
            sla_due_at: fact.ins_fact_task.slaDueAt?.toISOString(),
            status: fact.ins_fact_task.status,
            age_hours: parseFloat(fact.ins_fact_task.ageHours),
            breached: fact.ins_fact_task.breached
        }));
    }

    /**
     * Export control facts
     */
    async exportControlFacts(
        companyId: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<any[]> {
        const whereConditions = [eq(insFactCtrl.ctrlRunId, ctrlRun.id)];

        if (fromDate) {
            whereConditions.push(gte(insFactClose.computedAt, fromDate));
        }
        if (toDate) {
            whereConditions.push(lte(insFactClose.computedAt, toDate));
        }

        const facts = await db
            .select()
            .from(insFactCtrl)
            .innerJoin(ctrlRun, eq(insFactCtrl.ctrlRunId, ctrlRun.id))
            .innerJoin(insFactClose, eq(ctrlRun.runId, insFactClose.runId))
            .where(and(
                eq(insFactClose.companyId, companyId),
                ...whereConditions
            ))
            .orderBy(insFactCtrl.createdAt);

        return facts.map(fact => ({
            id: fact.ins_fact_ctrl.id,
            ctrl_run_id: fact.ins_fact_ctrl.ctrlRunId,
            control_code: fact.ins_fact_ctrl.controlCode,
            status: fact.ins_fact_ctrl.status,
            severity: fact.ins_fact_ctrl.severity,
            exceptions_count: fact.ins_fact_ctrl.exceptionsCount,
            waived: fact.ins_fact_ctrl.waived,
            evidence_count: fact.ins_fact_ctrl.evidenceCount,
            duration_ms: fact.ins_fact_ctrl.durationMs,
            material_fail: fact.ins_fact_ctrl.materialFail
        }));
    }

    /**
     * Export flux facts
     */
    async exportFluxFacts(
        companyId: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<any[]> {
        const whereConditions = [eq(insFactFlux.fluxRunId, fluxRun.id)];

        if (fromDate) {
            whereConditions.push(gte(insFactClose.computedAt, fromDate));
        }
        if (toDate) {
            whereConditions.push(lte(insFactClose.computedAt, toDate));
        }

        const facts = await db
            .select()
            .from(insFactFlux)
            .innerJoin(fluxRun, eq(insFactFlux.fluxRunId, fluxRun.id))
            .innerJoin(insFactClose, eq(fluxRun.runId, insFactClose.runId))
            .where(and(
                eq(insFactClose.companyId, companyId),
                ...whereConditions
            ))
            .orderBy(insFactFlux.createdAt);

        return facts.map(fact => ({
            id: fact.ins_fact_flux.id,
            flux_run_id: fact.ins_fact_flux.fluxRunId,
            scope: fact.ins_fact_flux.scope,
            present_ccy: fact.ins_fact_flux.presentCcy,
            material: fact.ins_fact_flux.material,
            comment_missing: fact.ins_fact_flux.commentMissing,
            top_delta_abs: parseFloat(fact.ins_fact_flux.topDeltaAbs),
            top_delta_pct: parseFloat(fact.ins_fact_flux.topDeltaPct)
        }));
    }

    /**
     * Export anomalies
     */
    async exportAnomalies(
        companyId: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<any[]> {
        const whereConditions = [eq(insAnomaly.companyId, companyId)];

        if (fromDate) {
            whereConditions.push(gte(insAnomaly.openedAt, fromDate));
        }
        if (toDate) {
            whereConditions.push(lte(insAnomaly.openedAt, toDate));
        }

        const anomalies = await db
            .select()
            .from(insAnomaly)
            .where(and(...whereConditions))
            .orderBy(desc(insAnomaly.score), desc(insAnomaly.openedAt));

        return anomalies.map(anomaly => ({
            id: anomaly.id,
            company_id: anomaly.companyId,
            run_id: anomaly.runId,
            kind: anomaly.kind,
            signal: anomaly.signal,
            score: parseFloat(anomaly.score),
            severity: anomaly.severity,
            opened_at: anomaly.openedAt.toISOString(),
            closed_at: anomaly.closedAt?.toISOString()
        }));
    }

    /**
     * Generate CSV download URL (placeholder implementation)
     */
    private async generateCsvDownload(records: any[], kind: string): Promise<string> {
        // TODO: Implement actual CSV generation and file storage
        // For now, return a placeholder URL
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `/downloads/insights-${kind}-${timestamp}.csv`;
    }

    /**
     * Generate JSON download URL (placeholder implementation)
     */
    private async generateJsonDownload(records: any[], kind: string): Promise<string> {
        // TODO: Implement actual JSON generation and file storage
        // For now, return a placeholder URL
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `/downloads/insights-${kind}-${timestamp}.json`;
    }

    /**
     * Get export statistics
     */
    async getExportStats(companyId: string): Promise<any> {
        const stats = {
            close_facts: 0,
            task_facts: 0,
            ctrl_facts: 0,
            flux_facts: 0,
            anomalies: 0,
            recommendations: 0
        };

        try {
            // Count close facts
            const closeCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(insFactClose)
                .where(eq(insFactClose.companyId, companyId));
            stats.close_facts = closeCount[0]?.count || 0;

            // Count task facts
            const taskCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(insFactTask)
                .innerJoin(insFactClose, eq(insFactTask.runId, insFactClose.runId))
                .where(eq(insFactClose.companyId, companyId));
            stats.task_facts = taskCount[0]?.count || 0;

            // Count control facts
            const ctrlCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(insFactCtrl)
                .innerJoin(ctrlRun, eq(insFactCtrl.ctrlRunId, ctrlRun.id))
                .innerJoin(insFactClose, eq(ctrlRun.runId, insFactClose.runId))
                .where(eq(insFactClose.companyId, companyId));
            stats.ctrl_facts = ctrlCount[0]?.count || 0;

            // Count flux facts
            const fluxCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(insFactFlux)
                .innerJoin(fluxRun, eq(insFactFlux.fluxRunId, fluxRun.id))
                .innerJoin(insFactClose, eq(fluxRun.runId, insFactClose.runId))
                .where(eq(insFactClose.companyId, companyId));
            stats.flux_facts = fluxCount[0]?.count || 0;

            // Count anomalies
            const anomalyCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(insAnomaly)
                .where(eq(insAnomaly.companyId, companyId));
            stats.anomalies = anomalyCount[0]?.count || 0;

            // Count recommendations
            const recoCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(insReco)
                .where(eq(insReco.companyId, companyId));
            stats.recommendations = recoCount[0]?.count || 0;

        } catch (error) {
            logLine({
                msg: "Error getting export stats",
                error: error instanceof Error ? error.message : String(error),
                companyId
            });
        }

        return stats;
    }
}
