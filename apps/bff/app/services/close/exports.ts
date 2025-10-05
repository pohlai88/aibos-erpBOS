import { db } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import {
    closeItem,
    closeSlaPolicy
} from "@aibos/db-adapter/schema";
import type {
    HeatMapResponseType,
    CloseSummaryPackType,
    CloseSummaryRequestType
} from "@aibos/contracts";

export class CloseExportsService {
    constructor(private dbInstance = db) { }

    /**
     * Export CSV of board view
     */
    async exportCsv(
        companyId: string,
        query: any
    ): Promise<string> {
        const conditions = [eq(closeItem.companyId, companyId)];

        if (query.period) {
            conditions.push(eq(closeItem.period, query.period));
        }

        if (query.process && query.process.length > 0) {
            conditions.push(sql`${closeItem.process} = ANY(${query.process})`);
        }

        if (query.status && query.status.length > 0) {
            conditions.push(sql`${closeItem.status} = ANY(${query.status})`);
        }

        if (query.ownerId) {
            conditions.push(eq(closeItem.ownerId, query.ownerId));
        }

        if (query.slaState && query.slaState.length > 0) {
            conditions.push(sql`${closeItem.slaState} = ANY(${query.slaState})`);
        }

        if (query.kind && query.kind.length > 0) {
            conditions.push(sql`${closeItem.kind} = ANY(${query.kind})`);
        }

        const items = await this.dbInstance
            .select({
                id: closeItem.id,
                period: closeItem.period,
                kind: closeItem.kind,
                refId: closeItem.refId,
                title: closeItem.title,
                process: closeItem.process,
                ownerId: closeItem.ownerId,
                dueAt: closeItem.dueAt,
                status: closeItem.status,
                severity: closeItem.severity,
                agingDays: closeItem.agingDays,
                slaState: closeItem.slaState,
                createdAt: closeItem.createdAt,
                updatedAt: closeItem.updatedAt,
            })
            .from(closeItem)
            .where(and(...conditions))
            .orderBy(sql`${closeItem.slaState} DESC`, sql`${closeItem.agingDays} DESC`, sql`${closeItem.dueAt} ASC`);

        // Convert to CSV
        const headers = [
            "ID", "Period", "Kind", "Ref ID", "Title", "Process", "Owner ID",
            "Due At", "Status", "Severity", "Aging Days", "SLA State",
            "Created At", "Updated At"
        ];

        const csvRows = items.map(item => [
            item.id,
            item.period,
            item.kind,
            item.refId,
            `"${item.title.replace(/"/g, '""')}"`, // Escape quotes
            item.process,
            item.ownerId || "",
            item.dueAt.toISOString(),
            item.status,
            item.severity,
            item.agingDays,
            item.slaState,
            item.createdAt.toISOString(),
            item.updatedAt.toISOString(),
        ]);

        const csvContent = [headers.join(","), ...csvRows.map(row => row.join(","))].join("\n");
        return csvContent;
    }

    /**
     * Build summary pack for a period
     */
    async buildSummaryPack(
        companyId: string,
        request: CloseSummaryRequestType
    ): Promise<CloseSummaryPackType> {
        const { period, includePdf = false } = request;

        // Get heat map data
        const heatMap = await this.getHeatMap(companyId, period);

        // Get top risks (items with highest aging or critical severity)
        const topRisks = await this.getTopRisks(companyId, period);

        // Get SLA metrics
        const slaMetrics = await this.getSlaMetrics(companyId, period);

        // Calculate completion rate
        const completionRate = slaMetrics.totalItems > 0
            ? Math.round((slaMetrics.onTime / slaMetrics.totalItems) * 100)
            : 100;

        const summaryPack: CloseSummaryPackType = {
            period,
            generatedAt: new Date().toISOString(),
            heatMap,
            topRisks,
            slaBreaches: slaMetrics.late + slaMetrics.escalated,
            totalItems: slaMetrics.totalItems,
            completionRate,
        };

        // TODO: Generate PDF if requested
        if (includePdf) {
            // Implementation would generate PDF using a library like puppeteer or similar
            console.log("PDF generation not implemented yet");
        }

        return summaryPack;
    }

    /**
     * Get heat map data for a period
     */
    private async getHeatMap(
        companyId: string,
        period: string
    ): Promise<HeatMapResponseType> {
        const heatMapData = await this.dbInstance
            .select({
                process: closeItem.process,
                late: sql<number>`count(*) filter (where sla_state = 'LATE')`,
                escal: sql<number>`count(*) filter (where sla_state = 'ESCALATED')`,
                openCnt: sql<number>`count(*) filter (where status = 'OPEN')`,
                total: sql<number>`count(*)`,
            })
            .from(closeItem)
            .where(and(
                eq(closeItem.companyId, companyId),
                eq(closeItem.period, period)
            ))
            .groupBy(closeItem.process);

        return heatMapData.map(row => ({
            process: row.process as any,
            late: row.late,
            escal: row.escal,
            openCnt: row.openCnt,
            total: row.total,
        }));
    }

    /**
     * Get top risks for a period
     */
    private async getTopRisks(companyId: string, period: string, limit: number = 10) {
        const risks = await this.dbInstance
            .select({
                id: closeItem.id,
                period: closeItem.period,
                kind: closeItem.kind,
                title: closeItem.title,
                process: closeItem.process,
                ownerId: closeItem.ownerId,
                dueAt: closeItem.dueAt,
                status: closeItem.status,
                slaState: closeItem.slaState,
                agingDays: closeItem.agingDays,
                severity: closeItem.severity,
            })
            .from(closeItem)
            .where(and(
                eq(closeItem.companyId, companyId),
                eq(closeItem.period, period),
                sql`${closeItem.status} IN ('OPEN', 'IN_PROGRESS', 'BLOCKED')`
            ))
            .orderBy(
                sql`CASE ${closeItem.severity} WHEN 'CRITICAL' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'NORMAL' THEN 2 ELSE 1 END DESC`,
                sql`${closeItem.agingDays} DESC`,
                sql`${closeItem.slaState} DESC`
            )
            .limit(limit);

        return risks.map(risk => ({
            id: risk.id,
            period: risk.period,
            kind: risk.kind as any,
            title: risk.title,
            process: risk.process as any,
            ownerId: risk.ownerId,
            dueAt: risk.dueAt.toISOString(),
            status: risk.status as any,
            slaState: risk.slaState as any,
            agingDays: risk.agingDays,
            severity: risk.severity as any,
        }));
    }

    /**
     * Get SLA metrics for a period
     */
    private async getSlaMetrics(companyId: string, period: string) {
        const [result] = await this.dbInstance
            .select({
                totalItems: sql<number>`count(*)`,
                onTime: sql<number>`count(*) filter (where sla_state = 'OK')`,
                late: sql<number>`count(*) filter (where sla_state = 'LATE')`,
                escalated: sql<number>`count(*) filter (where sla_state = 'ESCALATED')`,
                avgAgingDays: sql<number>`avg(aging_days)`,
                maxAgingDays: sql<number>`max(aging_days)`,
            })
            .from(closeItem)
            .where(and(
                eq(closeItem.companyId, companyId),
                eq(closeItem.period, period)
            ));

        return {
            totalItems: result?.totalItems || 0,
            onTime: result?.onTime || 0,
            late: result?.late || 0,
            escalated: result?.escalated || 0,
            avgAgingDays: Math.round((result?.avgAgingDays || 0) * 100) / 100,
            maxAgingDays: result?.maxAgingDays || 0,
        };
    }
}
