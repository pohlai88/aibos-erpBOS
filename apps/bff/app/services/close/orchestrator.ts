import { db } from "@/lib/db";
import { closeRun, closeTask, closeDep, closeEvidence, closePolicy, closeLock, closeKpi } from "@aibos/db-adapter/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { logLine } from "@/lib/log";
import type {
    CloseRunCreateType,
    CloseRunQueryType,
    CloseTaskUpsertType,
    CloseTaskActionType,
    CloseTaskQueryType,
    CloseEvidenceAddType,
    CloseEvidenceQueryType,
    CloseLockRequestType,
    CloseRunResponseType,
    CloseTaskResponseType,
    CloseEvidenceResponseType,
    ClosePolicyResponseType,
    CloseLockResponseType,
    KpiQueryType,
    KpiResponseType
} from "@aibos/contracts";

export class CloseOrchestratorService {
    /**
     * Create a new close run for a specific period
     */
    async createCloseRun(
        companyId: string,
        userId: string,
        data: CloseRunCreateType
    ): Promise<CloseRunResponseType> {
        const runId = ulid();

        // Check if period is already locked
        const existingLock = await db
            .select()
            .from(closeLock)
            .where(and(
                eq(closeLock.companyId, companyId),
                eq(closeLock.year, data.year),
                eq(closeLock.month, data.month)
            ))
            .limit(1);

        if (existingLock.length > 0) {
            throw new Error(`Period ${data.year}-${data.month} is already locked`);
        }

        // Check if close run already exists for this period
        const existingRun = await db
            .select()
            .from(closeRun)
            .where(and(
                eq(closeRun.companyId, companyId),
                eq(closeRun.year, data.year),
                eq(closeRun.month, data.month)
            ))
            .limit(1);

        if (existingRun.length > 0) {
            throw new Error(`Close run already exists for period ${data.year}-${data.month}`);
        }

        // Create the close run
        const newRunResult = await db
            .insert(closeRun)
            .values({
                id: runId,
                companyId,
                year: data.year,
                month: data.month,
                status: "DRAFT",
                owner: data.owner,
                notes: data.notes,
                createdBy: userId,
                updatedBy: userId
            })
            .returning();

        const newRun = newRunResult[0];
        if (!newRun) {
            throw new Error("Failed to create close run");
        }

        logLine({
            msg: `Created close run ${runId} for ${companyId} period ${data.year}-${data.month}`,
            companyId,
            runId,
            year: data.year,
            month: data.month
        });

        return {
            id: newRun.id,
            company_id: newRun.companyId,
            year: newRun.year,
            month: newRun.month,
            status: newRun.status,
            started_at: newRun.startedAt?.toISOString(),
            closed_at: newRun.closedAt?.toISOString(),
            owner: newRun.owner,
            notes: newRun.notes || undefined,
            created_at: newRun.createdAt.toISOString(),
            created_by: newRun.createdBy,
            updated_at: newRun.updatedAt.toISOString(),
            updated_by: newRun.updatedBy
        };
    }

    /**
     * Start a close run (move from DRAFT to IN_PROGRESS)
     */
    async startCloseRun(companyId: string, runId: string, userId: string): Promise<void> {
        const updatedRunResult = await db
            .update(closeRun)
            .set({
                status: "IN_PROGRESS",
                startedAt: new Date(),
                updatedBy: userId
            })
            .where(and(
                eq(closeRun.id, runId),
                eq(closeRun.companyId, companyId)
            ))
            .returning();

        const updatedRun = updatedRunResult[0];
        if (!updatedRun) {
            throw new Error(`Close run ${runId} not found`);
        }

        // Create default tasks for the close run
        await this.createDefaultTasks(companyId, runId, userId);

        logLine({
            msg: `Started close run ${runId} for ${companyId}`,
            companyId,
            runId
        });
    }

    /**
     * Create default close tasks for a run
     */
    private async createDefaultTasks(companyId: string, runId: string, userId: string): Promise<void> {
        const defaultTasks = [
            { code: "GL_RECONCILE", title: "General Ledger Reconciliation", priority: 10, evidence_required: true },
            { code: "AR_AGING", title: "Accounts Receivable Aging Review", priority: 8, evidence_required: true },
            { code: "AP_AGING", title: "Accounts Payable Aging Review", priority: 8, evidence_required: true },
            { code: "INVENTORY_COUNT", title: "Inventory Count Verification", priority: 9, evidence_required: true },
            { code: "BANK_RECONCILE", title: "Bank Reconciliation", priority: 10, evidence_required: true },
            { code: "REV_RECOGNIZE", title: "Revenue Recognition", priority: 7, evidence_required: true },
            { code: "DEPR_CALC", title: "Depreciation Calculation", priority: 6, evidence_required: false },
            { code: "TAX_PROVISION", title: "Tax Provision Calculation", priority: 7, evidence_required: true },
            { code: "FX_REVALUE", title: "Foreign Exchange Revaluation", priority: 6, evidence_required: false },
            { code: "TRIAL_BALANCE", title: "Trial Balance Review", priority: 5, evidence_required: true }
        ];

        const tasks = defaultTasks.map(task => ({
            id: ulid(),
            runId,
            code: task.code,
            title: task.title,
            owner: "ops", // Default owner
            priority: task.priority,
            evidenceRequired: task.evidence_required,
            updatedBy: userId
        }));

        await db.insert(closeTask).values(tasks);

        // Create task dependencies
        const dependencies = [
            { task: "TRIAL_BALANCE", depends_on: ["GL_RECONCILE", "AR_AGING", "AP_AGING", "INVENTORY_COUNT", "BANK_RECONCILE"] },
            { task: "REV_RECOGNIZE", depends_on: ["AR_AGING"] },
            { task: "TAX_PROVISION", depends_on: ["TRIAL_BALANCE"] }
        ];

        for (const dep of dependencies) {
            const taskId = tasks.find(t => t.code === dep.task)?.id;
            if (taskId) {
                for (const depCode of dep.depends_on) {
                    const depTaskId = tasks.find(t => t.code === depCode)?.id;
                    if (depTaskId) {
                        await db.insert(closeDep).values({
                            id: ulid(),
                            runId,
                            taskId,
                            dependsOnTaskId: depTaskId
                        });
                    }
                }
            }
        }
    }

    /**
     * Query close runs
     */
    async queryCloseRuns(companyId: string, query: CloseRunQueryType): Promise<CloseRunResponseType[]> {
        let whereConditions = [eq(closeRun.companyId, companyId)];

        if (query.year !== undefined) {
            whereConditions.push(eq(closeRun.year, query.year));
        }
        if (query.month !== undefined) {
            whereConditions.push(eq(closeRun.month, query.month));
        }
        if (query.status !== undefined) {
            whereConditions.push(eq(closeRun.status, query.status));
        }
        if (query.owner !== undefined) {
            whereConditions.push(eq(closeRun.owner, query.owner));
        }

        const runs = await db
            .select()
            .from(closeRun)
            .where(and(...whereConditions))
            .orderBy(desc(closeRun.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return runs.map(run => ({
            id: run.id,
            company_id: run.companyId,
            year: run.year,
            month: run.month,
            status: run.status,
            started_at: run.startedAt?.toISOString(),
            closed_at: run.closedAt?.toISOString(),
            owner: run.owner,
            notes: run.notes || undefined,
            created_at: run.createdAt.toISOString(),
            created_by: run.createdBy,
            updated_at: run.updatedAt.toISOString(),
            updated_by: run.updatedBy
        }));
    }

    /**
     * Create or update a close task
     */
    async upsertCloseTask(
        companyId: string,
        runId: string,
        userId: string,
        data: CloseTaskUpsertType
    ): Promise<CloseTaskResponseType> {
        // Check if task already exists
        const existingTask = await db
            .select()
            .from(closeTask)
            .where(and(
                eq(closeTask.runId, runId),
                eq(closeTask.code, data.code)
            ))
            .limit(1);

        if (existingTask.length > 0) {
            const existingTaskData = existingTask[0];
            if (!existingTaskData) {
                throw new Error("Task data not found");
            }

            // Update existing task
            const updatedTaskResult = await db
                .update(closeTask)
                .set({
                    title: data.title,
                    owner: data.owner,
                    slaDueAt: data.sla_due_at ? new Date(data.sla_due_at) : undefined,
                    priority: data.priority,
                    tags: data.tags,
                    evidenceRequired: data.evidence_required,
                    approver: data.approver,
                    updatedBy: userId
                })
                .where(eq(closeTask.id, existingTaskData.id))
                .returning();

            const updatedTask = updatedTaskResult[0];
            if (!updatedTask) {
                throw new Error("Failed to update task");
            }

            return this.mapTaskToResponse(updatedTask);
        } else {
            // Create new task
            const newTaskResult = await db
                .insert(closeTask)
                .values({
                    id: ulid(),
                    runId,
                    code: data.code,
                    title: data.title,
                    owner: data.owner,
                    slaDueAt: data.sla_due_at ? new Date(data.sla_due_at) : undefined,
                    priority: data.priority,
                    tags: data.tags,
                    evidenceRequired: data.evidence_required,
                    approver: data.approver,
                    updatedBy: userId
                })
                .returning();

            const newTask = newTaskResult[0];
            if (!newTask) {
                throw new Error("Failed to create task");
            }

            return this.mapTaskToResponse(newTask);
        }
    }

    /**
     * Perform an action on a close task
     */
    async performTaskAction(
        companyId: string,
        taskId: string,
        userId: string,
        data: CloseTaskActionType
    ): Promise<void> {
        const task = await db
            .select()
            .from(closeTask)
            .where(eq(closeTask.id, taskId))
            .limit(1);

        if (task.length === 0) {
            throw new Error(`Task ${taskId} not found`);
        }

        let newStatus: "OPEN" | "BLOCKED" | "READY" | "DONE" | "REJECTED";
        switch (data.action) {
            case "start":
                newStatus = "READY";
                break;
            case "block":
                newStatus = "BLOCKED";
                break;
            case "ready":
                newStatus = "READY";
                break;
            case "done":
                newStatus = "DONE";
                break;
            case "reject":
                newStatus = "REJECTED";
                break;
            default:
                throw new Error(`Invalid action: ${data.action}`);
        }

        await db
            .update(closeTask)
            .set({
                status: newStatus,
                updatedBy: userId
            })
            .where(eq(closeTask.id, taskId));

        // Check if all dependencies are satisfied and update task status
        await this.updateTaskReadiness(taskId);

        logLine({
            msg: `Task ${taskId} action ${data.action} performed by ${userId}`,
            taskId,
            action: data.action,
            userId
        });
    }

    /**
     * Update task readiness based on dependencies
     */
    private async updateTaskReadiness(taskId: string): Promise<void> {
        // Get all dependencies for this task
        const dependencies = await db
            .select()
            .from(closeDep)
            .where(eq(closeDep.taskId, taskId));

        if (dependencies.length === 0) {
            return; // No dependencies
        }

        // Check if all dependencies are DONE
        const depTaskIds = dependencies.map(dep => dep.dependsOnTaskId);
        const depTasks = await db
            .select()
            .from(closeTask)
            .where(sql`${closeTask.id} = ANY(${depTaskIds})`);

        const allDepsDone = depTasks.every(task => task.status === "DONE");

        if (allDepsDone) {
            await db
                .update(closeTask)
                .set({ status: "READY" })
                .where(eq(closeTask.id, taskId));
        }
    }

    /**
     * Query close tasks
     */
    async queryCloseTasks(companyId: string, query: CloseTaskQueryType): Promise<CloseTaskResponseType[]> {
        let whereConditions = [];

        if (query.run_id !== undefined) {
            whereConditions.push(eq(closeTask.runId, query.run_id));
        }
        if (query.status !== undefined) {
            whereConditions.push(eq(closeTask.status, query.status));
        }
        if (query.owner !== undefined) {
            whereConditions.push(eq(closeTask.owner, query.owner));
        }
        if (query.sla_breach !== undefined && query.sla_breach) {
            whereConditions.push(sql`${closeTask.slaDueAt} < NOW()`);
        }

        const tasks = await db
            .select()
            .from(closeTask)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(asc(closeTask.priority), desc(closeTask.slaDueAt))
            .limit(query.limit)
            .offset(query.offset);

        return tasks.map(task => this.mapTaskToResponse(task));
    }

    /**
     * Add evidence to a close task
     */
    async addEvidence(
        companyId: string,
        userId: string,
        data: CloseEvidenceAddType
    ): Promise<CloseEvidenceResponseType> {
        const newEvidenceResult = await db
            .insert(closeEvidence)
            .values({
                id: ulid(),
                runId: "", // Will be populated from task
                taskId: data.task_id,
                kind: data.kind,
                uriOrNote: data.uri_or_note,
                addedBy: userId
            })
            .returning();

        const newEvidence = newEvidenceResult[0];
        if (!newEvidence) {
            throw new Error("Failed to create evidence");
        }

        // Get the run ID from the task
        const task = await db
            .select()
            .from(closeTask)
            .where(eq(closeTask.id, data.task_id))
            .limit(1);

        let taskData: any = null;
        if (task.length > 0) {
            taskData = task[0];
            if (!taskData) {
                throw new Error("Task data not found");
            }

            await db
                .update(closeEvidence)
                .set({ runId: taskData.runId })
                .where(eq(closeEvidence.id, newEvidence.id));
        }

        return {
            id: newEvidence.id,
            run_id: taskData?.runId || "",
            task_id: newEvidence.taskId,
            kind: newEvidence.kind,
            uri_or_note: newEvidence.uriOrNote,
            added_by: newEvidence.addedBy,
            added_at: newEvidence.addedAt.toISOString()
        };
    }

    /**
     * Query close evidence
     */
    async queryCloseEvidence(companyId: string, query: CloseEvidenceQueryType): Promise<CloseEvidenceResponseType[]> {
        let whereConditions = [];

        if (query.run_id !== undefined) {
            whereConditions.push(eq(closeEvidence.runId, query.run_id));
        }
        if (query.task_id !== undefined) {
            whereConditions.push(eq(closeEvidence.taskId, query.task_id));
        }
        if (query.kind !== undefined) {
            whereConditions.push(eq(closeEvidence.kind, query.kind));
        }

        const evidence = await db
            .select()
            .from(closeEvidence)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(closeEvidence.addedAt))
            .limit(query.limit)
            .offset(query.offset);

        return evidence.map(ev => ({
            id: ev.id,
            run_id: ev.runId,
            task_id: ev.taskId,
            kind: ev.kind,
            uri_or_note: ev.uriOrNote,
            added_by: ev.addedBy,
            added_at: ev.addedAt.toISOString()
        }));
    }

    /**
     * Lock an entity/period for close operations
     */
    async lockEntity(companyId: string, userId: string, data: CloseLockRequestType): Promise<CloseLockResponseType> {
        const newLockResult = await db
            .insert(closeLock)
            .values({
                companyId,
                entityId: data.entity_id,
                year: data.year,
                month: data.month,
                lockedBy: userId
            })
            .returning();

        const newLock = newLockResult[0];
        if (!newLock) {
            throw new Error("Failed to create lock");
        }

        return {
            company_id: newLock.companyId,
            entity_id: newLock.entityId,
            year: newLock.year,
            month: newLock.month,
            locked_by: newLock.lockedBy,
            locked_at: newLock.lockedAt.toISOString()
        };
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
     * Map task to response type
     */
    private mapTaskToResponse(task: any): CloseTaskResponseType {
        return {
            id: task.id,
            run_id: task.runId,
            code: task.code,
            title: task.title,
            owner: task.owner,
            sla_due_at: task.slaDueAt?.toISOString(),
            status: task.status,
            priority: task.priority,
            tags: task.tags || [],
            evidence_required: task.evidenceRequired,
            approver: task.approver || undefined,
            updated_at: task.updatedAt.toISOString(),
            updated_by: task.updatedBy
        };
    }
}
