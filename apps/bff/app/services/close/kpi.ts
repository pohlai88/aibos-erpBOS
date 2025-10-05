import { db } from "@/lib/db";
import { closeKpi, closeRun, closeTask } from "@aibos/db-adapter/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { logLine } from "@/lib/log";
import type {
    KpiQueryType,
    KpiResponseType
} from "@aibos/contracts";

export class KpiService {
    /**
     * Compute and store KPIs for a close run
     */
    async computeKpis(companyId: string, runId?: string): Promise<void> {
        const runs = runId
            ? [{ id: runId }]
            : await db
                .select({ id: closeRun.id })
                .from(closeRun)
                .where(eq(closeRun.companyId, companyId));

        for (const run of runs) {
            await this.computeRunKpis(companyId, run.id);
        }

        logLine({
            msg: `Computed KPIs for ${runs.length} close runs in ${companyId}`,
            companyId,
            runsCount: runs.length
        });
    }

    /**
     * Compute KPIs for a specific close run
     */
    private async computeRunKpis(companyId: string, runId: string): Promise<void> {
        const run = await db
            .select()
            .from(closeRun)
            .where(eq(closeRun.id, runId))
            .limit(1);

        if (run.length === 0) {
            return;
        }

        const closeRunData = run[0];

        // Compute days to close
        const daysToClose = await this.computeDaysToClose(closeRunData);
        await this.storeKpi(companyId, runId, "DAYS_TO_CLOSE", daysToClose);

        // Compute on-time rate
        const onTimeRate = await this.computeOnTimeRate(runId);
        await this.storeKpi(companyId, runId, "ON_TIME_RATE", onTimeRate);

        // Compute average task age
        const avgTaskAge = await this.computeAvgTaskAge(runId);
        await this.storeKpi(companyId, runId, "AVG_TASK_AGE", avgTaskAge);

        // Compute late tasks count
        const lateTasks = await this.computeLateTasks(runId);
        await this.storeKpi(companyId, runId, "LATE_TASKS", lateTasks);
    }

    /**
     * Compute days to close
     */
    private async computeDaysToClose(run: any): Promise<number> {
        if (!run.startedAt || !run.closedAt) {
            return 0;
        }

        const startTime = new Date(run.startedAt).getTime();
        const endTime = new Date(run.closedAt).getTime();
        const diffMs = endTime - startTime;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * Compute on-time rate (percentage of tasks completed on time)
     */
    private async computeOnTimeRate(runId: string): Promise<number> {
        const tasks = await db
            .select()
            .from(closeTask)
            .where(eq(closeTask.runId, runId));

        if (tasks.length === 0) {
            return 0;
        }

        const tasksWithSla = tasks.filter(task => task.slaDueAt);
        if (tasksWithSla.length === 0) {
            return 100; // No SLA tasks, consider 100% on-time
        }

        const onTimeTasks = tasksWithSla.filter(task => {
            if (task.status !== "DONE") {
                return false;
            }
            if (!task.slaDueAt) {
                return true;
            }
            // Check if task was completed before SLA due date
            // This would need to be tracked in a separate table for accuracy
            return true; // Simplified for now
        });

        return (onTimeTasks.length / tasksWithSla.length) * 100;
    }

    /**
     * Compute average task age (in days)
     */
    private async computeAvgTaskAge(runId: string): Promise<number> {
        const tasks = await db
            .select()
            .from(closeTask)
            .where(eq(closeTask.runId, runId));

        if (tasks.length === 0) {
            return 0;
        }

        const now = new Date().getTime();
        let totalAge = 0;

        for (const task of tasks) {
            const taskStart = new Date(task.updatedAt).getTime();
            const ageMs = now - taskStart;
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            totalAge += ageDays;
        }

        return totalAge / tasks.length;
    }

    /**
     * Compute number of late tasks
     */
    private async computeLateTasks(runId: string): Promise<number> {
        const lateTasks = await db
            .select()
            .from(closeTask)
            .where(and(
                eq(closeTask.runId, runId),
                sql`${closeTask.slaDueAt} < NOW()`,
                sql`${closeTask.status} NOT IN ('DONE', 'REJECTED')`
            ));

        return lateTasks.length;
    }

    /**
     * Store a KPI value
     */
    private async storeKpi(
        companyId: string,
        runId: string | undefined,
        metric: string,
        value: number
    ): Promise<void> {
        await db
            .insert(closeKpi)
            .values({
                id: ulid(),
                companyId,
                runId: runId || null,
                metric: metric as "DAYS_TO_CLOSE" | "ON_TIME_RATE" | "AVG_TASK_AGE" | "LATE_TASKS",
                value: value.toString()
            });
    }

    /**
     * Query KPIs
     */
    async queryKpis(companyId: string, query: KpiQueryType): Promise<KpiResponseType[]> {
        let whereConditions = [eq(closeKpi.companyId, companyId)];

        if (query.run_id !== undefined) {
            whereConditions.push(eq(closeKpi.runId, query.run_id));
        }
        if (query.metric !== undefined) {
            whereConditions.push(eq(closeKpi.metric, query.metric));
        }
        if (query.computed_at_from !== undefined) {
            whereConditions.push(sql`${closeKpi.computedAt} >= ${query.computed_at_from}`);
        }
        if (query.computed_at_to !== undefined) {
            whereConditions.push(sql`${closeKpi.computedAt} <= ${query.computed_at_to}`);
        }

        const kpis = await db
            .select()
            .from(closeKpi)
            .where(and(...whereConditions))
            .orderBy(desc(closeKpi.computedAt))
            .limit(query.limit)
            .offset(query.offset);

        return kpis.map(kpi => ({
            id: kpi.id,
            company_id: kpi.companyId,
            run_id: kpi.runId || undefined,
            metric: kpi.metric,
            value: Number(kpi.value),
            computed_at: kpi.computedAt.toISOString(),
            created_at: kpi.createdAt.toISOString()
        }));
    }

    /**
     * Get KPI trends for a company
     */
    async getKpiTrends(companyId: string, metric: string, days: number = 30): Promise<KpiResponseType[]> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const kpis = await db
            .select()
            .from(closeKpi)
            .where(and(
                eq(closeKpi.companyId, companyId),
                eq(closeKpi.metric, metric as "DAYS_TO_CLOSE" | "ON_TIME_RATE" | "AVG_TASK_AGE" | "LATE_TASKS"),
                sql`${closeKpi.computedAt} >= ${cutoffDate.toISOString()}`
            ))
            .orderBy(asc(closeKpi.computedAt));

        return kpis.map(kpi => ({
            id: kpi.id,
            company_id: kpi.companyId,
            run_id: kpi.runId || undefined,
            metric: kpi.metric,
            value: Number(kpi.value),
            computed_at: kpi.computedAt.toISOString(),
            created_at: kpi.createdAt.toISOString()
        }));
    }

    /**
     * Get dashboard KPIs for a company
     */
    async getDashboardKpis(companyId: string): Promise<{
        days_to_close: number;
        on_time_rate: number;
        avg_task_age: number;
        late_tasks: number;
    }> {
        const latestKpis = await db
            .select()
            .from(closeKpi)
            .where(eq(closeKpi.companyId, companyId))
            .orderBy(desc(closeKpi.computedAt));

        const kpiMap = new Map<string, number>();

        for (const kpi of latestKpis) {
            if (!kpiMap.has(kpi.metric)) {
                kpiMap.set(kpi.metric, Number(kpi.value));
            }
        }

        return {
            days_to_close: kpiMap.get("DAYS_TO_CLOSE") || 0,
            on_time_rate: kpiMap.get("ON_TIME_RATE") || 0,
            avg_task_age: kpiMap.get("AVG_TASK_AGE") || 0,
            late_tasks: kpiMap.get("LATE_TASKS") || 0
        };
    }
}
