import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, gte, lte, isNull } from 'drizzle-orm';
import {
  ctrlControl,
  ctrlAssignment,
  closeRun,
  closeTask,
} from '@aibos/db-adapter/schema';
import type {
  ControlUpsert,
  ControlQuery,
  AssignmentUpsert,
  AssignmentQuery,
  ControlResponseType,
  AssignmentResponseType,
} from '@aibos/contracts';

export class ControlsAdminService {
  constructor(private dbInstance = db) {}

  /**
   * Upsert control definition
   */
  async upsertControl(
    companyId: string,
    userId: string,
    data: any
  ): Promise<ControlResponseType> {
    const controlId = ulid();

    const controlData = {
      id: controlId,
      companyId,
      code: data.code,
      name: data.name,
      purpose: data.purpose,
      domain: data.domain,
      frequency: data.frequency,
      severity: data.severity,
      autoKind: data.auto_kind,
      autoConfig: data.auto_config || null,
      evidenceRequired: data.evidence_required,
      status: data.status,
      createdBy: userId,
      updatedBy: userId,
    };

    await this.dbInstance
      .insert(ctrlControl)
      .values(controlData)
      .onConflictDoUpdate({
        target: [ctrlControl.companyId, ctrlControl.code],
        set: {
          name: controlData.name,
          purpose: controlData.purpose,
          domain: controlData.domain,
          frequency: controlData.frequency,
          severity: controlData.severity,
          autoKind: controlData.autoKind,
          autoConfig: controlData.autoConfig,
          evidenceRequired: controlData.evidenceRequired,
          status: controlData.status,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

    return this.getControl(companyId, controlId);
  }

  /**
   * Get control by ID
   */
  async getControl(
    companyId: string,
    controlId: string
  ): Promise<ControlResponseType> {
    const controls = await this.dbInstance
      .select()
      .from(ctrlControl)
      .where(
        and(eq(ctrlControl.id, controlId), eq(ctrlControl.companyId, companyId))
      )
      .limit(1);

    if (controls.length === 0) {
      throw new Error('Control not found');
    }

    const control = controls[0];
    if (!control) {
      throw new Error('Control not found');
    }

    return {
      id: control.id,
      company_id: control.companyId,
      code: control.code,
      name: control.name,
      purpose: control.purpose,
      domain: control.domain,
      frequency: control.frequency,
      severity: control.severity,
      auto_kind: control.autoKind,
      auto_config: (control.autoConfig as Record<string, any>) || undefined,
      evidence_required: control.evidenceRequired,
      status: control.status,
      created_at: control.createdAt.toISOString(),
      updated_at: control.updatedAt.toISOString(),
      created_by: control.createdBy,
      updated_by: control.updatedBy,
    };
  }

  /**
   * Query controls with filters
   */
  async queryControls(
    companyId: string,
    query: any
  ): Promise<ControlResponseType[]> {
    const conditions = [eq(ctrlControl.companyId, companyId)];

    if (query.domain) {
      conditions.push(eq(ctrlControl.domain, query.domain));
    }
    if (query.frequency) {
      conditions.push(eq(ctrlControl.frequency, query.frequency));
    }
    if (query.severity) {
      conditions.push(eq(ctrlControl.severity, query.severity));
    }
    if (query.status) {
      conditions.push(eq(ctrlControl.status, query.status));
    }

    const controls = await this.dbInstance
      .select()
      .from(ctrlControl)
      .where(and(...conditions))
      .orderBy(asc(ctrlControl.code))
      .limit(query.limit)
      .offset(query.offset);

    return controls.map(control => ({
      id: control.id,
      company_id: control.companyId,
      code: control.code,
      name: control.name,
      purpose: control.purpose,
      domain: control.domain,
      frequency: control.frequency,
      severity: control.severity,
      auto_kind: control.autoKind,
      auto_config: (control.autoConfig as Record<string, any>) || undefined,
      evidence_required: control.evidenceRequired,
      status: control.status,
      created_at: control.createdAt.toISOString(),
      updated_at: control.updatedAt.toISOString(),
      created_by: control.createdBy,
      updated_by: control.updatedBy,
    }));
  }

  /**
   * Upsert control assignment
   */
  async upsertAssignment(
    companyId: string,
    userId: string,
    data: any
  ): Promise<AssignmentResponseType> {
    const assignmentId = ulid();

    const assignmentData = {
      id: assignmentId,
      controlId: data.control_id,
      runId: data.run_id || null,
      taskId: data.task_id || null,
      entityId: data.entity_id || null,
      owner: data.owner,
      approver: data.approver,
      slaDueAt: data.sla_due_at ? new Date(data.sla_due_at) : null,
      active: data.active,
      createdBy: userId,
      updatedBy: userId,
    };

    await this.dbInstance
      .insert(ctrlAssignment)
      .values(assignmentData)
      .onConflictDoUpdate({
        target: [ctrlAssignment.id],
        set: {
          controlId: assignmentData.controlId,
          runId: assignmentData.runId,
          taskId: assignmentData.taskId,
          entityId: assignmentData.entityId,
          owner: assignmentData.owner,
          approver: assignmentData.approver,
          slaDueAt: assignmentData.slaDueAt,
          active: assignmentData.active,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

    return this.getAssignment(companyId, assignmentId);
  }

  /**
   * Get assignment by ID
   */
  async getAssignment(
    companyId: string,
    assignmentId: string
  ): Promise<AssignmentResponseType> {
    const assignments = await this.dbInstance
      .select()
      .from(ctrlAssignment)
      .where(eq(ctrlAssignment.id, assignmentId))
      .limit(1);

    if (assignments.length === 0) {
      throw new Error('Assignment not found');
    }

    const assignment = assignments[0];
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    return {
      id: assignment.id,
      control_id: assignment.controlId,
      run_id: assignment.runId || undefined,
      task_id: assignment.taskId || undefined,
      entity_id: assignment.entityId || undefined,
      owner: assignment.owner,
      approver: assignment.approver,
      sla_due_at: assignment.slaDueAt?.toISOString(),
      active: assignment.active,
      created_at: assignment.createdAt.toISOString(),
      updated_at: assignment.updatedAt.toISOString(),
      created_by: assignment.createdBy,
      updated_by: assignment.updatedBy,
    };
  }

  /**
   * Query assignments with filters
   */
  async queryAssignments(
    companyId: string,
    query: any
  ): Promise<AssignmentResponseType[]> {
    const conditions = [];

    if (query.control_id) {
      conditions.push(eq(ctrlAssignment.controlId, query.control_id));
    }
    if (query.run_id) {
      conditions.push(eq(ctrlAssignment.runId, query.run_id));
    }
    if (query.task_id) {
      conditions.push(eq(ctrlAssignment.taskId, query.task_id));
    }
    if (query.entity_id) {
      conditions.push(eq(ctrlAssignment.entityId, query.entity_id));
    }
    if (query.owner) {
      conditions.push(eq(ctrlAssignment.owner, query.owner));
    }
    if (query.approver) {
      conditions.push(eq(ctrlAssignment.approver, query.approver));
    }
    if (query.active !== undefined) {
      conditions.push(eq(ctrlAssignment.active, query.active));
    }

    const assignments = await this.dbInstance
      .select()
      .from(ctrlAssignment)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ctrlAssignment.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return assignments.map(assignment => ({
      id: assignment.id,
      control_id: assignment.controlId,
      run_id: assignment.runId || undefined,
      task_id: assignment.taskId || undefined,
      entity_id: assignment.entityId || undefined,
      owner: assignment.owner,
      approver: assignment.approver,
      sla_due_at: assignment.slaDueAt?.toISOString(),
      active: assignment.active,
      created_at: assignment.createdAt.toISOString(),
      updated_at: assignment.updatedAt.toISOString(),
      created_by: assignment.createdBy,
      updated_by: assignment.updatedBy,
    }));
  }

  /**
   * Compute and schedule control assignments for a close run
   */
  async scheduleControlAssignments(
    companyId: string,
    runId: string,
    userId: string
  ): Promise<void> {
    // Get the close run
    const runs = await this.dbInstance
      .select()
      .from(closeRun)
      .where(and(eq(closeRun.id, runId), eq(closeRun.companyId, companyId)))
      .limit(1);

    if (runs.length === 0) {
      throw new Error('Close run not found');
    }

    const run = runs[0];

    // Get active controls for the CLOSE domain
    const controls = await this.dbInstance
      .select()
      .from(ctrlControl)
      .where(
        and(
          eq(ctrlControl.companyId, companyId),
          eq(ctrlControl.domain, 'CLOSE'),
          eq(ctrlControl.status, 'ACTIVE')
        )
      );

    // Create assignments for each control
    for (const control of controls) {
      const assignmentId = ulid();
      const slaDueAt = new Date();
      slaDueAt.setHours(slaDueAt.getHours() + 24); // Default 24-hour SLA

      await this.dbInstance.insert(ctrlAssignment).values({
        id: assignmentId,
        controlId: control.id,
        runId: runId,
        owner: 'ops', // Default owner
        approver: 'controller', // Default approver
        slaDueAt: slaDueAt,
        active: true,
        createdBy: userId,
        updatedBy: userId,
      });
    }
  }

  /**
   * Seed baseline controls for a company
   */
  async seedBaselineControls(companyId: string, userId: string): Promise<void> {
    // Call the database function to seed baseline controls
    await this.dbInstance.execute(sql`
            SELECT seed_baseline_controls(${companyId}, ${userId})
        `);
  }
}
