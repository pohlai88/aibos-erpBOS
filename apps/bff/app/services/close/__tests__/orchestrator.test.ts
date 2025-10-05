import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CloseOrchestratorService } from "@/services/close/orchestrator";
import { db } from "@/lib/db";
import { closeRun, closeTask, closeDep, closeEvidence, closePolicy, closeLock } from "@aibos/db-adapter/schema";
import { eq, and } from "drizzle-orm";

describe("CloseOrchestratorService", () => {
    const companyId = "test-company";
    const userId = "test-user";
    let service: CloseOrchestratorService;

    beforeEach(async () => {
        service = new CloseOrchestratorService();
        // Clean up test data
        await db.delete(closeEvidence);
        await db.delete(closeDep);
        await db.delete(closeTask);
        await db.delete(closeRun);
        await db.delete(closeLock);
        await db.delete(closePolicy);
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(closeEvidence);
        await db.delete(closeDep);
        await db.delete(closeTask);
        await db.delete(closeRun);
        await db.delete(closeLock);
        await db.delete(closePolicy);
    });

    describe("createCloseRun", () => {
        it("should create a new close run", async () => {
            const data = {
                year: 2025,
                month: 2, // Changed from 1 to 2 to avoid conflicts
                owner: "ops",
                notes: "Test close run"
            };

            const run = await service.createCloseRun(companyId, userId, data);

            expect(run.company_id).toBe(companyId);
            expect(run.year).toBe(2025);
            expect(run.month).toBe(2); // Updated expectation
            expect(run.status).toBe("DRAFT");
            expect(run.owner).toBe("ops");
            expect(run.notes).toBe("Test close run");
        });

        it("should prevent duplicate close runs for the same period", async () => {
            const data = {
                year: 2025,
                month: 1,
                owner: "ops"
            };

            await service.createCloseRun(companyId, userId, data);

            await expect(
                service.createCloseRun(companyId, userId, data)
            ).rejects.toThrow("Close run already exists for period 2025-1");
        });

        it("should prevent close runs when period is locked", async () => {
            // Create a lock for the period
            await db.insert(closeLock).values({
                companyId,
                entityId: "test-entity",
                year: 2025,
                month: 1,
                lockedBy: "admin"
            });

            const data = {
                year: 2025,
                month: 1,
                owner: "ops"
            };

            await expect(
                service.createCloseRun(companyId, userId, data)
            ).rejects.toThrow("Period 2025-1 is already locked");
        });
    });

    describe("startCloseRun", () => {
        it("should start a close run and create default tasks", async () => {
            // Create a close run first
            const data = {
                year: 2025,
                month: 3, // Changed from 1 to 3 to avoid conflicts
                owner: "ops"
            };
            const run = await service.createCloseRun(companyId, userId, data);

            await service.startCloseRun(companyId, run.id, userId);

            // Check that the run status was updated
            const updatedRun = await db
                .select()
                .from(closeRun)
                .where(eq(closeRun.id, run.id))
                .limit(1);

            expect(updatedRun[0]?.status).toBe("IN_PROGRESS");
            expect(updatedRun[0]?.startedAt).toBeDefined();

            // Check that default tasks were created
            const tasks = await db
                .select()
                .from(closeTask)
                .where(eq(closeTask.runId, run.id));

            expect(tasks.length).toBeGreaterThan(0);
            expect(tasks.some(t => t.code === "GL_RECONCILE")).toBe(true);
            expect(tasks.some(t => t.code === "BANK_RECONCILE")).toBe(true);
        });
    });

    describe("upsertCloseTask", () => {
        it("should create a new task", async () => {
            const run = await service.createCloseRun(companyId, userId, {
                year: 2025,
                month: 1,
                owner: "ops"
            });

            const taskData = {
                code: "CUSTOM_TASK",
                title: "Custom Task",
                owner: "accountant",
                priority: 5,
                tags: [],
                evidence_required: true
            };

            const task = await service.upsertCloseTask(companyId, run.id, userId, taskData);

            expect(task.code).toBe("CUSTOM_TASK");
            expect(task.title).toBe("Custom Task");
            expect(task.owner).toBe("accountant");
            expect(task.priority).toBe(5);
            expect(task.evidence_required).toBe(true);
        });

        it("should update an existing task", async () => {
            const run = await service.createCloseRun(companyId, userId, {
                year: 2025,
                month: 1,
                owner: "ops"
            });

            const taskData = {
                code: "CUSTOM_TASK",
                title: "Custom Task",
                owner: "accountant",
                priority: 5,
                tags: [],
                evidence_required: true
            };

            await service.upsertCloseTask(companyId, run.id, userId, taskData);

            const updatedTaskData = {
                code: "CUSTOM_TASK",
                title: "Updated Custom Task",
                owner: "ops",
                priority: 8,
                tags: [],
                evidence_required: false
            };

            const updatedTask = await service.upsertCloseTask(companyId, run.id, userId, updatedTaskData);

            expect(updatedTask.title).toBe("Updated Custom Task");
            expect(updatedTask.owner).toBe("ops");
            expect(updatedTask.priority).toBe(8);
            expect(updatedTask.evidence_required).toBe(false);
        });
    });

    describe("performTaskAction", () => {
        it("should update task status based on action", async () => {
            const run = await service.createCloseRun(companyId, userId, {
                year: 2025,
                month: 1,
                owner: "ops"
            });

            const taskData = {
                code: "TEST_TASK",
                title: "Test Task",
                owner: "ops",
                priority: 5,
                tags: [],
                evidence_required: false
            };

            const task = await service.upsertCloseTask(companyId, run.id, userId, taskData);

            await service.performTaskAction(companyId, task.id, userId, {
                action: "done",
                notes: "Task completed"
            });

            const updatedTask = await db
                .select()
                .from(closeTask)
                .where(eq(closeTask.id, task.id))
                .limit(1);

            expect(updatedTask[0]?.status).toBe("DONE");
        });
    });

    describe("addEvidence", () => {
        it("should add evidence to a task", async () => {
            const run = await service.createCloseRun(companyId, userId, {
                year: 2025,
                month: 1,
                owner: "ops"
            });

            const taskData = {
                code: "TEST_TASK",
                title: "Test Task",
                owner: "ops",
                priority: 5,
                tags: [],
                evidence_required: false
            };

            const task = await service.upsertCloseTask(companyId, run.id, userId, taskData);

            const evidenceData = {
                task_id: task.id,
                kind: "NOTE" as const,
                uri_or_note: "Task completed successfully"
            };

            const evidence = await service.addEvidence(companyId, userId, evidenceData);

            expect(evidence.task_id).toBe(task.id);
            expect(evidence.kind).toBe("NOTE");
            expect(evidence.uri_or_note).toBe("Task completed successfully");
            expect(evidence.added_by).toBe(userId);
        });
    });

    describe("lockEntity", () => {
        it("should lock an entity/period", async () => {
            const lockData = {
                entity_id: "test-entity",
                year: 2025,
                month: 1
            };

            const lock = await service.lockEntity(companyId, userId, lockData);

            expect(lock.company_id).toBe(companyId);
            expect(lock.entity_id).toBe("test-entity");
            expect(lock.year).toBe(2025);
            expect(lock.month).toBe(1);
            expect(lock.locked_by).toBe(userId);
        });
    });
});
