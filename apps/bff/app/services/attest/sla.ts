import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray, count, lt, gte } from "drizzle-orm";
import {
    attestTask,
    attestCampaign,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    AttestSlaStateType
} from "@aibos/contracts";

export class AttestSlaService {
    constructor(private dbInstance = db) { }

    /**
     * Tick SLA for all tasks in a campaign or company
     */
    async tickSla(campaignId?: string, companyId?: string): Promise<{
        updated: number;
        dueSoon: number;
        late: number;
        escalated: number;
    }> {
        let conditions = [];

        if (campaignId) {
            conditions.push(eq(attestTask.campaignId, campaignId));
        }

        if (companyId) {
            conditions.push(eq(attestTask.companyId, companyId));
        }

        // Only process OPEN and IN_PROGRESS tasks
        conditions.push(inArray(attestTask.state, ["OPEN", "IN_PROGRESS"]));

        // Get all tasks that need SLA evaluation
        const tasks = await this.dbInstance
            .select()
            .from(attestTask)
            .where(and(...conditions));

        let updated = 0;
        let dueSoon = 0;
        let late = 0;
        let escalated = 0;

        const now = new Date();

        for (const task of tasks) {
            const dueAt = task.dueAt;
            const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            let newSlaState: AttestSlaStateType = "OK";
            let shouldUpdate = false;

            if (hoursUntilDue < 0) {
                // Task is overdue
                if (task.slaState !== "LATE" && task.slaState !== "ESCALATED") {
                    newSlaState = "LATE";
                    shouldUpdate = true;
                    late++;
                }
            } else if (hoursUntilDue <= 24) {
                // Task is due soon (within 24 hours)
                if (task.slaState === "OK") {
                    newSlaState = "DUE_SOON";
                    shouldUpdate = true;
                    dueSoon++;
                }
            } else if (hoursUntilDue <= 48) {
                // Task is approaching due date (within 48 hours)
                if (task.slaState === "OK") {
                    newSlaState = "DUE_SOON";
                    shouldUpdate = true;
                    dueSoon++;
                }
            }

            // Check for escalation (tasks that have been late for more than 24 hours)
            if (task.slaState === "LATE" && hoursUntilDue < -24) {
                newSlaState = "ESCALATED";
                shouldUpdate = true;
                escalated++;
            }

            if (shouldUpdate) {
                await this.dbInstance
                    .update(attestTask)
                    .set({
                        slaState: newSlaState,
                        updatedAt: new Date(),
                    })
                    .where(eq(attestTask.id, task.id));

                updated++;

                // Emit appropriate outbox event
                await this.emitSlaEvent(task.id, task.companyId, newSlaState);
            }
        }

        return { updated, dueSoon, late, escalated };
    }

    /**
     * Get SLA summary for a campaign
     */
    async getSlaSummary(campaignId: string, companyId: string): Promise<{
        total: number;
        ok: number;
        dueSoon: number;
        late: number;
        escalated: number;
    }> {
        const tasks = await this.dbInstance
            .select({
                slaState: attestTask.slaState,
            })
            .from(attestTask)
            .where(and(
                eq(attestTask.campaignId, campaignId),
                eq(attestTask.companyId, companyId)
            ));

        const summary = {
            total: tasks.length,
            ok: 0,
            dueSoon: 0,
            late: 0,
            escalated: 0,
        };

        for (const task of tasks) {
            switch (task.slaState) {
                case "OK":
                    summary.ok++;
                    break;
                case "DUE_SOON":
                    summary.dueSoon++;
                    break;
                case "LATE":
                    summary.late++;
                    break;
                case "ESCALATED":
                    summary.escalated++;
                    break;
            }
        }

        return summary;
    }

    /**
     * Get heat map data for attestations
     */
    async getHeatMap(companyId: string, campaignId?: string): Promise<Array<{
        scopeKey: string;
        late: number;
        escalated: number;
        openCnt: number;
        submittedCnt: number;
        approvedCnt: number;
        total: number;
    }>> {
        let conditions = [eq(attestTask.companyId, companyId)];

        if (campaignId) {
            conditions.push(eq(attestTask.campaignId, campaignId));
        }

        const tasks = await this.dbInstance
            .select({
                scopeKey: attestTask.scopeKey,
                state: attestTask.state,
                slaState: attestTask.slaState,
            })
            .from(attestTask)
            .where(and(...conditions));

        // Group by scope key
        const heatMap = new Map<string, {
            scopeKey: string;
            late: number;
            escalated: number;
            openCnt: number;
            submittedCnt: number;
            approvedCnt: number;
            total: number;
        }>();

        for (const task of tasks) {
            if (!heatMap.has(task.scopeKey)) {
                heatMap.set(task.scopeKey, {
                    scopeKey: task.scopeKey,
                    late: 0,
                    escalated: 0,
                    openCnt: 0,
                    submittedCnt: 0,
                    approvedCnt: 0,
                    total: 0,
                });
            }

            const entry = heatMap.get(task.scopeKey)!;
            entry.total++;

            switch (task.state) {
                case "OPEN":
                case "IN_PROGRESS":
                    entry.openCnt++;
                    break;
                case "SUBMITTED":
                case "RETURNED":
                    entry.submittedCnt++;
                    break;
                case "APPROVED":
                    entry.approvedCnt++;
                    break;
            }

            switch (task.slaState) {
                case "LATE":
                    entry.late++;
                    break;
                case "ESCALATED":
                    entry.escalated++;
                    break;
            }
        }

        return Array.from(heatMap.values());
    }

    /**
     * Private helper to emit SLA events
     */
    private async emitSlaEvent(taskId: string, companyId: string, slaState: AttestSlaStateType): Promise<void> {
        let topic: string;

        switch (slaState) {
            case "DUE_SOON":
                topic = "ATTEST_DUE_SOON";
                break;
            case "LATE":
                topic = "ATTEST_LATE";
                break;
            case "ESCALATED":
                topic = "ATTEST_ESCALATED";
                break;
            default:
                return; // No event for OK state
        }

        await this.dbInstance
            .insert(outbox)
            .values({
                id: ulid(),
                topic,
                payload: JSON.stringify({
                    taskId,
                    companyId,
                    slaState,
                }),
            });
    }
}
