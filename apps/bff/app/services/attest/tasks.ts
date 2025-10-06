import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, inArray, count } from 'drizzle-orm';
import {
  attestTask,
  attestResponse,
  attestEvidenceLink,
  attestTemplate,
  outbox,
} from '@aibos/db-adapter/schema';
import type {
  TaskQueryType,
  TaskResponseType,
  TaskSubmitType,
  TaskReturnType,
  TaskApproveType,
} from '@aibos/contracts';

export class AttestTasksService {
  constructor(private dbInstance = db) {}

  /**
   * List attestation tasks with filtering and pagination
   */
  async listTasks(
    companyId: string,
    query: TaskQueryType
  ): Promise<{ tasks: TaskResponseType[]; total: number; hasMore: boolean }> {
    const conditions = [eq(attestTask.companyId, companyId)];

    if (query.campaignId) {
      conditions.push(eq(attestTask.campaignId, query.campaignId));
    }

    if (query.assigneeId) {
      conditions.push(eq(attestTask.assigneeId, query.assigneeId));
    }

    if (query.state && query.state.length > 0) {
      conditions.push(inArray(attestTask.state, query.state));
    }

    if (query.slaState && query.slaState.length > 0) {
      conditions.push(inArray(attestTask.slaState, query.slaState));
    }

    if (query.scopeKey && query.scopeKey.length > 0) {
      conditions.push(inArray(attestTask.scopeKey, query.scopeKey));
    }

    // Get total count
    const [totalResult] = await this.dbInstance
      .select({ count: count() })
      .from(attestTask)
      .where(and(...conditions));

    const total = totalResult?.count || 0;

    // Get paginated results
    const tasks = await this.dbInstance
      .select()
      .from(attestTask)
      .where(and(...conditions))
      .orderBy(
        desc(attestTask.slaState),
        desc(attestTask.dueAt),
        asc(attestTask.createdAt)
      )
      .limit(query.limit)
      .offset(query.offset);

    const taskResponses: TaskResponseType[] = tasks.map(task => ({
      id: task.id,
      companyId: task.companyId,
      campaignId: task.campaignId,
      assigneeId: task.assigneeId,
      scopeKey: task.scopeKey,
      state: task.state as any,
      dueAt: task.dueAt.toISOString(),
      submittedAt: task.submittedAt?.toISOString() || null,
      approvedAt: task.approvedAt?.toISOString() || null,
      approverId: task.approverId,
      slaState: task.slaState as any,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    return {
      tasks: taskResponses,
      total,
      hasMore: query.offset + query.limit < total,
    };
  }

  /**
   * Submit a task response
   */
  async submitTask(
    taskId: string,
    companyId: string,
    userId: string,
    data: TaskSubmitType
  ): Promise<void> {
    // Verify task exists and user is the assignee
    const [task] = await this.dbInstance
      .select()
      .from(attestTask)
      .where(
        and(
          eq(attestTask.id, taskId),
          eq(attestTask.companyId, companyId),
          eq(attestTask.assigneeId, userId)
        )
      );

    if (!task) {
      throw new Error('Task not found or user is not the assignee');
    }

    if (task.state !== 'OPEN' && task.state !== 'IN_PROGRESS') {
      throw new Error(`Task is in ${task.state} state and cannot be submitted`);
    }

    // Upsert response
    const responseId = ulid();
    const responseData = {
      id: responseId,
      taskId,
      answers: data.answers,
      exceptions: data.exceptions,
    };

    await this.dbInstance
      .insert(attestResponse)
      .values(responseData)
      .onConflictDoUpdate({
        target: [attestResponse.taskId],
        set: {
          answers: responseData.answers,
          exceptions: responseData.exceptions,
          updatedAt: new Date(),
        },
      });

    // Link evidence if provided
    if (data.evidenceIds && data.evidenceIds.length > 0) {
      const evidenceLinks = data.evidenceIds.map(evdId => ({
        id: ulid(),
        taskId,
        evdRecordId: evdId,
      }));

      await this.dbInstance
        .insert(attestEvidenceLink)
        .values(evidenceLinks)
        .onConflictDoNothing(); // Don't create duplicates
    }

    // Update task state
    await this.dbInstance
      .update(attestTask)
      .set({
        state: 'SUBMITTED',
        submittedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(attestTask.id, taskId));

    // Emit outbox event
    await this.emitTaskSubmittedEvent(taskId, companyId, userId);
  }

  /**
   * Return a task for fixes
   */
  async returnTask(
    taskId: string,
    companyId: string,
    userId: string,
    data: TaskReturnType
  ): Promise<void> {
    // Verify task exists and user has approval rights
    const [task] = await this.dbInstance
      .select()
      .from(attestTask)
      .where(
        and(eq(attestTask.id, taskId), eq(attestTask.companyId, companyId))
      );

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.state !== 'SUBMITTED') {
      throw new Error(`Task is in ${task.state} state and cannot be returned`);
    }

    // Update task state
    await this.dbInstance
      .update(attestTask)
      .set({
        state: 'RETURNED',
        approverId: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(attestTask.id, taskId));

    // Emit outbox event
    await this.emitTaskReturnedEvent(taskId, companyId, userId, data.reason);
  }

  /**
   * Approve a task
   */
  async approveTask(
    taskId: string,
    companyId: string,
    userId: string,
    data: TaskApproveType
  ): Promise<void> {
    // Verify task exists and user has approval rights
    const [task] = await this.dbInstance
      .select()
      .from(attestTask)
      .where(
        and(eq(attestTask.id, taskId), eq(attestTask.companyId, companyId))
      );

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.state !== 'SUBMITTED') {
      throw new Error(`Task is in ${task.state} state and cannot be approved`);
    }

    // Update task state
    await this.dbInstance
      .update(attestTask)
      .set({
        state: 'APPROVED',
        approvedAt: new Date(),
        approverId: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(attestTask.id, taskId));

    // Emit outbox event
    await this.emitTaskApprovedEvent(taskId, companyId, userId);
  }

  /**
   * Private helper to emit task submitted event
   */
  private async emitTaskSubmittedEvent(
    taskId: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'ATTEST_TASK_SUBMITTED',
      payload: JSON.stringify({
        taskId,
        companyId,
        userId,
      }),
    });
  }

  /**
   * Private helper to emit task returned event
   */
  private async emitTaskReturnedEvent(
    taskId: string,
    companyId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'ATTEST_TASK_RETURNED',
      payload: JSON.stringify({
        taskId,
        companyId,
        userId,
        reason,
      }),
    });
  }

  /**
   * Private helper to emit task approved event
   */
  private async emitTaskApprovedEvent(
    taskId: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'ATTEST_TASK_APPROVED',
      payload: JSON.stringify({
        taskId,
        companyId,
        userId,
      }),
    });
  }
}
