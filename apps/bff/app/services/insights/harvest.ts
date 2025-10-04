import { db } from "@/lib/db";
import {
    insFactClose,
    insFactTask,
    insFactCtrl,
    insFactFlux,
    insFactCert,
    closeRun,
    closeTask,
    ctrlRun,
    ctrlControl,
    ctrlResult,
    ctrlException,
    ctrlEvidence,
    fluxRun,
    fluxLine,
    fluxComment,
    certSignoff
} from "@aibos/db-adapter/schema";
import { eq, and, desc, asc, sql, isNull, isNotNull } from "drizzle-orm";
import { ulid } from "ulid";
import { logLine } from "@/lib/log";
import type {
    InsightsHarvestResponseType
} from "@aibos/contracts";

export class InsightsHarvestService {
    /**
     * Harvest insights facts from existing close runs
     */
    async harvestFacts(
        companyId: string,
        runId?: string
    ): Promise<InsightsHarvestResponseType> {
        const runs = runId
            ? [{ id: runId }]
            : await db
                .select({ id: closeRun.id })
                .from(closeRun)
                .where(eq(closeRun.companyId, companyId))
                .orderBy(desc(closeRun.createdAt))
                .limit(10); // Last 10 runs

        let factsCreated = {
            close: 0,
            task: 0,
            ctrl: 0,
            flux: 0,
            cert: 0
        };

        for (const run of runs) {
            try {
                // Check if facts already exist for this run (idempotent)
                const existingClose = await db
                    .select({ id: insFactClose.id })
                    .from(insFactClose)
                    .where(eq(insFactClose.runId, run.id))
                    .limit(1);

                if (existingClose.length === 0) {
                    await this.harvestCloseFacts(companyId, run.id);
                    factsCreated.close++;
                }

                await this.harvestTaskFacts(run.id);
                factsCreated.task += await this.harvestTaskFacts(run.id);

                await this.harvestControlFacts(run.id);
                factsCreated.ctrl += await this.harvestControlFacts(run.id);

                await this.harvestFluxFacts(run.id);
                factsCreated.flux += await this.harvestFluxFacts(run.id);

                await this.harvestCertFacts(run.id);
                factsCreated.cert += await this.harvestCertFacts(run.id);

            } catch (error) {
                logLine({
                    msg: `Error harvesting facts for run ${run.id}`,
                    error: error instanceof Error ? error.message : String(error),
                    runId: run.id
                });
            }
        }

        logLine({
            msg: `Harvested insights facts for ${runs.length} close runs`,
            companyId,
            factsCreated
        });

        return {
            success: true,
            message: `Harvested facts for ${runs.length} runs`,
            facts_created: factsCreated,
            run_id: runId
        };
    }

    /**
     * Harvest close-level facts
     */
    private async harvestCloseFacts(companyId: string, runId: string): Promise<void> {
        const run = await db
            .select()
            .from(closeRun)
            .where(eq(closeRun.id, runId))
            .limit(1);

        if (run.length === 0) return;

        const closeRunData = run[0];

        // Compute days to close
        const daysToClose = this.computeDaysToClose(closeRunData);

        // Compute on-time rate
        const onTimeRate = await this.computeOnTimeRate(runId);

        // Count late tasks
        const lateTasks = await this.countLateTasks(runId);

        // Count exceptions
        const exceptionsOpen = await this.countOpenExceptions(runId);
        const exceptionsMaterial = await this.countMaterialExceptions(runId);

        // Count certifications
        const certsDone = await this.countCertifications(runId);

        const factId = ulid();
        await db.insert(insFactClose).values({
            id: factId,
            companyId,
            entityId: null, // TODO: Add entity support
            runId,
            year: closeRunData?.year || 0,
            month: closeRunData?.month || 0,
            daysToClose: daysToClose.toString(),
            onTimeRate: onTimeRate.toString(),
            lateTasks,
            exceptionsOpen,
            exceptionsMaterial,
            certsDone
        });
    }

    /**
     * Harvest task-level facts
     */
    private async harvestTaskFacts(runId: string): Promise<number> {
        const tasks = await db
            .select()
            .from(closeTask)
            .where(eq(closeTask.runId, runId));

        let factsCreated = 0;

        for (const task of tasks) {
            const ageHours = this.computeTaskAge(task);
            const breached = this.isTaskBreached(task);

            const factId = ulid();
            await db.insert(insFactTask).values({
                id: factId,
                runId,
                taskId: task.id,
                code: task.code,
                owner: task.owner,
                startedAt: null, // TODO: Track task start time
                finishedAt: task.status === "DONE" ? task.updatedAt : null,
                slaDueAt: task.slaDueAt,
                status: task.status,
                ageHours: ageHours.toString(),
                breached
            });

            factsCreated++;
        }

        return factsCreated;
    }

    /**
     * Harvest control-level facts
     */
    private async harvestControlFacts(runId: string): Promise<number> {
        const controlRuns = await db
            .select({
                id: ctrlRun.id,
                controlId: ctrlRun.controlId,
                status: ctrlRun.status,
                startedAt: ctrlRun.startedAt,
                finishedAt: ctrlRun.finishedAt
            })
            .from(ctrlRun)
            .where(eq(ctrlRun.runId, runId));

        let factsCreated = 0;

        for (const ctrlRunData of controlRuns) {
            // Get control details
            const control = await db
                .select({ code: ctrlControl.code, severity: ctrlControl.severity })
                .from(ctrlControl)
                .where(eq(ctrlControl.id, ctrlRunData.controlId))
                .limit(1);

            if (control.length === 0) continue;

            // Count exceptions
            const exceptions = await db
                .select({ count: sql<number>`count(*)` })
                .from(ctrlException)
                .where(eq(ctrlException.ctrlRunId, ctrlRunData.id));

            const exceptionsCount = exceptions[0]?.count || 0;

            // Count waived exceptions
            const waived = await db
                .select({ count: sql<number>`count(*)` })
                .from(ctrlException)
                .where(and(
                    eq(ctrlException.ctrlRunId, ctrlRunData.id),
                    eq(ctrlException.remediationState, "WAIVED")
                ));

            const waivedCount = waived[0]?.count || 0;

            // Count evidence
            const evidence = await db
                .select({ count: sql<number>`count(*)` })
                .from(ctrlEvidence)
                .where(eq(ctrlEvidence.ctrlRunId, ctrlRunData.id));

            const evidenceCount = evidence[0]?.count || 0;

            // Compute duration
            const durationMs = this.computeControlDuration(ctrlRunData);

            // Check for material failures
            const materialFail = await this.hasMaterialFailures(ctrlRunData.id);

            const factId = ulid();
            await db.insert(insFactCtrl).values({
                id: factId,
                ctrlRunId: ctrlRunData.id,
                controlCode: control[0]?.code || "UNKNOWN",
                status: ctrlRunData.status,
                severity: control[0]?.severity || "LOW",
                exceptionsCount,
                waived: waivedCount,
                evidenceCount,
                durationMs,
                materialFail
            });

            factsCreated++;
        }

        return factsCreated;
    }

    /**
     * Harvest flux analysis facts
     */
    private async harvestFluxFacts(runId: string): Promise<number> {
        const fluxRuns = await db
            .select()
            .from(fluxRun)
            .where(eq(fluxRun.runId, runId));

        let factsCreated = 0;

        for (const fluxRunData of fluxRuns) {
            // Count material lines
            const materialLines = await db
                .select({ count: sql<number>`count(*)` })
                .from(fluxLine)
                .where(and(
                    eq(fluxLine.runId, fluxRunData.id),
                    eq(fluxLine.material, true)
                ));

            const materialCount = materialLines[0]?.count || 0;

            // Count missing comments
            const missingComments = await db
                .select({ count: sql<number>`count(*)` })
                .from(fluxLine)
                .where(and(
                    eq(fluxLine.runId, fluxRunData.id),
                    eq(fluxLine.requiresComment, true),
                    isNull(fluxComment.id) // No comment exists
                ))
                .leftJoin(fluxComment, eq(fluxLine.id, fluxComment.lineId));

            const commentMissingCount = missingComments[0]?.count || 0;

            // Find top delta
            const topDelta = await db
                .select({
                    delta: fluxLine.delta,
                    deltaPct: fluxLine.deltaPct
                })
                .from(fluxLine)
                .where(eq(fluxLine.runId, fluxRunData.id))
                .orderBy(sql`abs(${fluxLine.delta}) DESC`)
                .limit(1);

            const topDeltaAbs = topDelta[0]?.delta || "0";
            const topDeltaPct = topDelta[0]?.deltaPct || "0";

            const factId = ulid();
            await db.insert(insFactFlux).values({
                id: factId,
                fluxRunId: fluxRunData.id,
                scope: fluxRunData.baseYear.toString(), // Using base year as scope identifier
                presentCcy: fluxRunData.presentCcy,
                material: materialCount,
                commentMissing: commentMissingCount,
                topDeltaAbs,
                topDeltaPct
            });

            factsCreated++;
        }

        return factsCreated;
    }

    /**
     * Harvest certification facts
     */
    private async harvestCertFacts(runId: string): Promise<number> {
        const certifications = await db
            .select()
            .from(certSignoff)
            .where(eq(certSignoff.runId, runId));

        let factsCreated = 0;

        for (const cert of certifications) {
            const factId = ulid();
            await db.insert(insFactCert).values({
                id: factId,
                runId,
                level: cert.level,
                signerRole: cert.signerRole,
                signedAt: cert.signedAt
            });

            factsCreated++;
        }

        return factsCreated;
    }

    // Helper methods
    private computeDaysToClose(run: any): number {
        if (!run.startedAt || !run.closedAt) {
            return 0;
        }

        const startTime = new Date(run.startedAt).getTime();
        const endTime = new Date(run.closedAt).getTime();
        const diffMs = endTime - startTime;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    private async computeOnTimeRate(runId: string): Promise<number> {
        const tasks = await db
            .select()
            .from(closeTask)
            .where(eq(closeTask.runId, runId));

        if (tasks.length === 0) return 0;

        const tasksWithSla = tasks.filter(task => task.slaDueAt);
        if (tasksWithSla.length === 0) return 100;

        const onTimeTasks = tasksWithSla.filter(task => {
            if (task.status !== "DONE" || !task.updatedAt) return false;
            return new Date(task.updatedAt) <= new Date(task.slaDueAt!);
        });

        return (onTimeTasks.length / tasksWithSla.length) * 100;
    }

    private async countLateTasks(runId: string): Promise<number> {
        const lateTasks = await db
            .select({ count: sql<number>`count(*)` })
            .from(closeTask)
            .where(and(
                eq(closeTask.runId, runId),
                isNotNull(closeTask.slaDueAt),
                sql`${closeTask.updatedAt} > ${closeTask.slaDueAt}`
            ));

        return lateTasks[0]?.count || 0;
    }

    private async countOpenExceptions(runId: string): Promise<number> {
        const exceptions = await db
            .select({ count: sql<number>`count(*)` })
            .from(ctrlException)
            .innerJoin(ctrlRun, eq(ctrlException.ctrlRunId, ctrlRun.id))
            .where(and(
                eq(ctrlRun.runId, runId),
                eq(ctrlException.remediationState, "OPEN")
            ));

        return exceptions[0]?.count || 0;
    }

    private async countMaterialExceptions(runId: string): Promise<number> {
        const exceptions = await db
            .select({ count: sql<number>`count(*)` })
            .from(ctrlException)
            .innerJoin(ctrlRun, eq(ctrlException.ctrlRunId, ctrlRun.id))
            .where(and(
                eq(ctrlRun.runId, runId),
                eq(ctrlException.material, true)
            ));

        return exceptions[0]?.count || 0;
    }

    private async countCertifications(runId: string): Promise<number> {
        const certs = await db
            .select({ count: sql<number>`count(*)` })
            .from(certSignoff)
            .where(eq(certSignoff.runId, runId));

        return certs[0]?.count || 0;
    }

    private computeTaskAge(task: any): number {
        if (!task.updatedAt) return 0;

        const now = new Date().getTime();
        const taskTime = new Date(task.updatedAt).getTime();
        const diffMs = now - taskTime;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        return diffHours;
    }

    private isTaskBreached(task: any): boolean {
        if (!task.slaDueAt || task.status === "DONE") return false;

        const now = new Date();
        const slaDue = new Date(task.slaDueAt);

        return now > slaDue;
    }

    private computeControlDuration(ctrlRun: any): number {
        if (!ctrlRun.startedAt || !ctrlRun.finishedAt) return 0;

        const startTime = new Date(ctrlRun.startedAt).getTime();
        const endTime = new Date(ctrlRun.finishedAt).getTime();
        const diffMs = endTime - startTime;

        return diffMs;
    }

    private async hasMaterialFailures(ctrlRunId: string): Promise<boolean> {
        const materialFailures = await db
            .select({ count: sql<number>`count(*)` })
            .from(ctrlException)
            .where(and(
                eq(ctrlException.ctrlRunId, ctrlRunId),
                eq(ctrlException.material, true)
            ));

        return (materialFailures[0]?.count || 0) > 0;
    }
}
