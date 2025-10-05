import { db } from "@/lib/db";
import {
    insBenchBaseline,
    insBenchTarget,
    insFactClose,
    closeRun
} from "@aibos/db-adapter/schema";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import { ulid } from "ulid";
import { logLine } from "@/lib/log";
import type {
    InsightsBenchmarkResponseType,
    BenchSeedReqType,
    TargetUpsertType
} from "@aibos/contracts";

export class InsightsBenchmarksService {
    /**
     * Compute benchmark baselines for a company
     */
    async computeBenchmarks(
        companyId: string,
        entityGroup: "SELF" | "PEER" | "GLOBAL" = "SELF"
    ): Promise<InsightsBenchmarkResponseType> {
        const metrics = [
            "DAYS_TO_CLOSE",
            "ON_TIME_RATE",
            "AVG_TASK_AGE",
            "LATE_TASKS",
            "EXCEPTIONS_MATERIAL",
            "CONTROL_FAIL_RATE",
            "FLUX_COMMENT_COVERAGE"
        ];

        let baselinesCreated = 0;
        const metricsProcessed: string[] = [];

        for (const metric of metrics) {
            try {
                await this.computeMetricBaseline(companyId, metric, entityGroup);
                baselinesCreated++;
                metricsProcessed.push(metric);
            } catch (error) {
                logLine({
                    msg: `Error computing baseline for metric ${metric}`,
                    error: error instanceof Error ? error.message : String(error),
                    companyId,
                    metric
                });
            }
        }

        logLine({
            msg: `Computed ${baselinesCreated} benchmark baselines`,
            companyId,
            entityGroup,
            metricsProcessed
        });

        return {
            success: true,
            message: `Computed ${baselinesCreated} baselines for ${entityGroup}`,
            baselines_created: baselinesCreated,
            metrics_processed: metricsProcessed
        };
    }

    /**
     * Compute baseline for a specific metric
     */
    private async computeMetricBaseline(
        companyId: string,
        metric: string,
        entityGroup: "SELF" | "PEER" | "GLOBAL"
    ): Promise<void> {
        const windowStart = this.getWindowStart(entityGroup);
        const windowEnd = new Date();

        let values: number[] = [];

        if (entityGroup === "SELF") {
            values = await this.getSelfValues(companyId, metric, windowStart, windowEnd);
        } else if (entityGroup === "PEER") {
            values = await this.getPeerValues(companyId, metric, windowStart, windowEnd);
        } else if (entityGroup === "GLOBAL") {
            values = await this.getGlobalValues(metric, windowStart, windowEnd);
        }

        if (values.length === 0) {
            logLine({
                msg: `No values found for metric ${metric}`,
                companyId,
                metric,
                entityGroup
            });
            return;
        }

        const percentiles = this.computePercentiles(values);
        const currentValue = values[values.length - 1] || 0; // Use latest value

        const baselineId = ulid();
        await db.insert(insBenchBaseline).values({
            id: baselineId,
            companyId,
            entityGroup,
            metric,
            granularity: "MONTH",
            value: currentValue.toString(),
            p50: percentiles.p50.toString(),
            p75: percentiles.p75.toString(),
            p90: percentiles.p90.toString(),
            windowStart,
            windowEnd
        });
    }

    /**
     * Get SELF values for a metric
     */
    private async getSelfValues(
        companyId: string,
        metric: string,
        windowStart: Date,
        windowEnd: Date
    ): Promise<number[]> {
        if (metric === "DAYS_TO_CLOSE") {
            const results = await db
                .select({ value: insFactClose.daysToClose })
                .from(insFactClose)
                .where(and(
                    eq(insFactClose.companyId, companyId),
                    gte(insFactClose.computedAt, windowStart),
                    lte(insFactClose.computedAt, windowEnd)
                ))
                .orderBy(asc(insFactClose.computedAt));

            return results.map(r => parseFloat(r.value));
        }

        if (metric === "ON_TIME_RATE") {
            const results = await db
                .select({ value: insFactClose.onTimeRate })
                .from(insFactClose)
                .where(and(
                    eq(insFactClose.companyId, companyId),
                    gte(insFactClose.computedAt, windowStart),
                    lte(insFactClose.computedAt, windowEnd)
                ))
                .orderBy(asc(insFactClose.computedAt));

            return results.map(r => parseFloat(r.value));
        }

        // TODO: Implement other metrics
        return [];
    }

    /**
     * Get PEER values for a metric (placeholder - would need industry/size classification)
     */
    private async getPeerValues(
        companyId: string,
        metric: string,
        windowStart: Date,
        windowEnd: Date
    ): Promise<number[]> {
        // TODO: Implement peer comparison based on industry/size tags
        // For now, return empty array
        return [];
    }

    /**
     * Get GLOBAL values for a metric (placeholder - would need global data)
     */
    private async getGlobalValues(
        metric: string,
        windowStart: Date,
        windowEnd: Date
    ): Promise<number[]> {
        // TODO: Implement global benchmarks
        // For now, return empty array
        return [];
    }

    /**
     * Compute percentiles from values array
     */
    private computePercentiles(values: number[]): { p50: number; p75: number; p90: number } {
        if (values.length === 0) {
            return { p50: 0, p75: 0, p90: 0 };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const len = sorted.length;

        const p50 = sorted[Math.floor(len * 0.5)] || 0;
        const p75 = sorted[Math.floor(len * 0.75)] || 0;
        const p90 = sorted[Math.floor(len * 0.9)] || 0;

        return { p50, p75, p90 };
    }

    /**
     * Get window start date based on entity group
     */
    private getWindowStart(entityGroup: "SELF" | "PEER" | "GLOBAL"): Date {
        const now = new Date();

        if (entityGroup === "SELF") {
            // Rolling 6 months for SELF
            return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        } else if (entityGroup === "PEER") {
            // Rolling 12 months for PEER
            return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        } else {
            // Rolling 24 months for GLOBAL
            return new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        }
    }

    /**
     * Seed benchmark baselines manually
     */
    async seedBenchmarks(
        companyId: string,
        data: BenchSeedReqType
    ): Promise<void> {
        const windowStart = new Date(data.window_start);
        const windowEnd = new Date(data.window_end);

        // Get values for the specified window
        const values = await this.getSelfValues(companyId, data.metric, windowStart, windowEnd);

        if (values.length === 0) {
            throw new Error(`No values found for metric ${data.metric} in the specified window`);
        }

        const percentiles = this.computePercentiles(values);
        const currentValue = values[values.length - 1] || 0;

        const baselineId = ulid();
        await db.insert(insBenchBaseline).values({
            id: baselineId,
            companyId,
            entityGroup: data.entity_group,
            metric: data.metric,
            granularity: data.granularity,
            value: currentValue.toString(),
            p50: percentiles.p50.toString(),
            p75: percentiles.p75.toString(),
            p90: percentiles.p90.toString(),
            windowStart,
            windowEnd
        });

        logLine({
            msg: `Seeded benchmark baseline for ${data.metric}`,
            companyId,
            metric: data.metric,
            entityGroup: data.entity_group,
            valuesCount: values.length
        });
    }

    /**
     * Manage benchmark targets
     */
    async upsertTarget(
        companyId: string,
        userId: string,
        data: TargetUpsertType
    ): Promise<void> {
        const effectiveFrom = new Date(data.effective_from);
        const effectiveTo = data.effective_to ? new Date(data.effective_to) : null;

        const targetId = ulid();
        await db.insert(insBenchTarget).values({
            id: targetId,
            companyId,
            metric: data.metric,
            target: data.target.toString(),
            effectiveFrom,
            effectiveTo,
            createdBy: userId,
            updatedBy: userId
        });

        logLine({
            msg: `Upserted target for ${data.metric}`,
            companyId,
            metric: data.metric,
            target: data.target,
            userId
        });
    }

    /**
     * Get benchmark deltas vs targets
     */
    async getBenchmarkDeltas(companyId: string): Promise<any[]> {
        const deltas = await db
            .select({
                metric: insBenchBaseline.metric,
                entityGroup: insBenchBaseline.entityGroup,
                currentValue: insBenchBaseline.value,
                p50: insBenchBaseline.p50,
                p75: insBenchBaseline.p75,
                p90: insBenchBaseline.p90,
                target: insBenchTarget.target,
                effectiveFrom: insBenchTarget.effectiveFrom,
                effectiveTo: insBenchTarget.effectiveTo
            })
            .from(insBenchBaseline)
            .leftJoin(insBenchTarget, and(
                eq(insBenchBaseline.companyId, insBenchTarget.companyId),
                eq(insBenchBaseline.metric, insBenchTarget.metric),
                gte(insBenchBaseline.windowStart, insBenchTarget.effectiveFrom),
                sql`(${insBenchTarget.effectiveTo} IS NULL OR ${insBenchBaseline.windowStart} <= ${insBenchTarget.effectiveTo})`
            ))
            .where(eq(insBenchBaseline.companyId, companyId))
            .orderBy(asc(insBenchBaseline.metric), asc(insBenchBaseline.entityGroup));

        return deltas.map(delta => ({
            ...delta,
            deltaToTarget: delta.target ? parseFloat(delta.currentValue) - parseFloat(delta.target) : null,
            deltaToP50: parseFloat(delta.currentValue) - parseFloat(delta.p50),
            deltaToP90: parseFloat(delta.currentValue) - parseFloat(delta.p90)
        }));
    }
}
