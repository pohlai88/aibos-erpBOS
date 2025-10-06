import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, inArray, count } from 'drizzle-orm';
import {
  attestProgram,
  attestTemplate,
  attestAssignment,
  outbox,
} from '@aibos/db-adapter/schema';
import type {
  AttestProgramUpsertType,
  AttestProgramResponseType,
  AttestTemplateUpsertType,
  AttestTemplateResponseType,
  AttestAssignmentUpsertType,
  AttestAssignmentResponseType,
} from '@aibos/contracts';

export class AttestProgramsService {
  constructor(private dbInstance = db) {}

  /**
   * Create or update an attestation program
   */
  async upsertProgram(
    companyId: string,
    userId: string,
    data: AttestProgramUpsertType
  ): Promise<AttestProgramResponseType> {
    const programId = ulid();

    const programData = {
      id: programId,
      companyId,
      code: data.code,
      name: data.name,
      freq: data.freq,
      scope: data.scope,
      active: data.active,
      createdBy: userId,
      updatedBy: userId,
    };

    await this.dbInstance
      .insert(attestProgram)
      .values(programData)
      .onConflictDoUpdate({
        target: [attestProgram.companyId, attestProgram.code],
        set: {
          name: programData.name,
          freq: programData.freq,
          scope: programData.scope,
          active: programData.active,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

    // Return the created/updated program
    const [result] = await this.dbInstance
      .select()
      .from(attestProgram)
      .where(eq(attestProgram.id, programId));

    if (!result) {
      throw new Error('Failed to create attestation program');
    }

    return {
      id: result.id,
      companyId: result.companyId,
      code: result.code,
      name: result.name,
      freq: result.freq as any,
      scope: result.scope,
      active: result.active,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  /**
   * List attestation programs
   */
  async listPrograms(
    companyId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    programs: AttestProgramResponseType[];
    total: number;
    hasMore: boolean;
  }> {
    // Get total count
    const [totalResult] = await this.dbInstance
      .select({ count: count() })
      .from(attestProgram)
      .where(eq(attestProgram.companyId, companyId));

    const total = totalResult?.count || 0;

    // Get paginated results
    const programs = await this.dbInstance
      .select()
      .from(attestProgram)
      .where(eq(attestProgram.companyId, companyId))
      .orderBy(desc(attestProgram.createdAt))
      .limit(limit)
      .offset(offset);

    const programResponses: AttestProgramResponseType[] = programs.map(
      program => ({
        id: program.id,
        companyId: program.companyId,
        code: program.code,
        name: program.name,
        freq: program.freq as any,
        scope: program.scope,
        active: program.active,
        createdAt: program.createdAt.toISOString(),
        updatedAt: program.updatedAt.toISOString(),
      })
    );

    return {
      programs: programResponses,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Create or update an attestation template
   */
  async upsertTemplate(
    companyId: string,
    userId: string,
    data: AttestTemplateUpsertType
  ): Promise<AttestTemplateResponseType> {
    const templateId = ulid();

    const templateData = {
      id: templateId,
      companyId,
      code: data.code,
      title: data.title,
      version: data.version,
      schema: data.schema,
      requiresEvidence: data.requiresEvidence,
      status: data.status,
      createdBy: userId,
      updatedBy: userId,
    };

    await this.dbInstance
      .insert(attestTemplate)
      .values(templateData)
      .onConflictDoUpdate({
        target: [
          attestTemplate.companyId,
          attestTemplate.code,
          attestTemplate.version,
        ],
        set: {
          title: templateData.title,
          schema: templateData.schema,
          requiresEvidence: templateData.requiresEvidence,
          status: templateData.status,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

    // Return the created/updated template
    const [result] = await this.dbInstance
      .select()
      .from(attestTemplate)
      .where(eq(attestTemplate.id, templateId));

    if (!result) {
      throw new Error('Failed to create attestation template');
    }

    return {
      id: result.id,
      companyId: result.companyId,
      code: result.code,
      title: result.title,
      version: result.version,
      schema: result.schema as any,
      requiresEvidence: result.requiresEvidence,
      status: result.status as any,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  /**
   * List attestation templates
   */
  async listTemplates(
    companyId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    templates: AttestTemplateResponseType[];
    total: number;
    hasMore: boolean;
  }> {
    // Get total count
    const [totalResult] = await this.dbInstance
      .select({ count: count() })
      .from(attestTemplate)
      .where(eq(attestTemplate.companyId, companyId));

    const total = totalResult?.count || 0;

    // Get paginated results
    const templates = await this.dbInstance
      .select()
      .from(attestTemplate)
      .where(eq(attestTemplate.companyId, companyId))
      .orderBy(desc(attestTemplate.createdAt))
      .limit(limit)
      .offset(offset);

    const templateResponses: AttestTemplateResponseType[] = templates.map(
      template => ({
        id: template.id,
        companyId: template.companyId,
        code: template.code,
        title: template.title,
        version: template.version,
        schema: template.schema as any,
        requiresEvidence: template.requiresEvidence,
        status: template.status as any,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      })
    );

    return {
      templates: templateResponses,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Create or update an attestation assignment
   */
  async upsertAssignment(
    companyId: string,
    userId: string,
    data: AttestAssignmentUpsertType
  ): Promise<AttestAssignmentResponseType> {
    // First, get the program ID from the code
    const [program] = await this.dbInstance
      .select({ id: attestProgram.id })
      .from(attestProgram)
      .where(
        and(
          eq(attestProgram.companyId, companyId),
          eq(attestProgram.code, data.programCode)
        )
      );

    if (!program) {
      throw new Error(`Program with code ${data.programCode} not found`);
    }

    const assignmentId = ulid();

    const assignmentData = {
      id: assignmentId,
      companyId,
      programId: program.id,
      scopeKey: data.scopeKey,
      assigneeId: data.assigneeId,
      approverId: data.approverId || null,
      createdBy: userId,
    };

    await this.dbInstance
      .insert(attestAssignment)
      .values(assignmentData)
      .onConflictDoUpdate({
        target: [
          attestAssignment.companyId,
          attestAssignment.programId,
          attestAssignment.scopeKey,
          attestAssignment.assigneeId,
        ],
        set: {
          approverId: assignmentData.approverId,
        },
      });

    // Return the created/updated assignment
    const [result] = await this.dbInstance
      .select()
      .from(attestAssignment)
      .where(eq(attestAssignment.id, assignmentId));

    if (!result) {
      throw new Error('Failed to create attestation assignment');
    }

    return {
      id: result.id,
      companyId: result.companyId,
      programId: result.programId,
      scopeKey: result.scopeKey,
      assigneeId: result.assigneeId,
      approverId: result.approverId,
      createdAt: result.createdAt.toISOString(),
    };
  }

  /**
   * List attestation assignments
   */
  async listAssignments(
    companyId: string,
    programCode?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    assignments: AttestAssignmentResponseType[];
    total: number;
    hasMore: boolean;
  }> {
    let conditions = [eq(attestAssignment.companyId, companyId)];

    if (programCode) {
      // Join with program table to filter by program code
      const assignments = await this.dbInstance
        .select({
          id: attestAssignment.id,
          companyId: attestAssignment.companyId,
          programId: attestAssignment.programId,
          scopeKey: attestAssignment.scopeKey,
          assigneeId: attestAssignment.assigneeId,
          approverId: attestAssignment.approverId,
          createdAt: attestAssignment.createdAt,
        })
        .from(attestAssignment)
        .innerJoin(
          attestProgram,
          eq(attestAssignment.programId, attestProgram.id)
        )
        .where(
          and(
            eq(attestAssignment.companyId, companyId),
            eq(attestProgram.code, programCode)
          )
        )
        .orderBy(desc(attestAssignment.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for this query
      const [totalResult] = await this.dbInstance
        .select({ count: count() })
        .from(attestAssignment)
        .innerJoin(
          attestProgram,
          eq(attestAssignment.programId, attestProgram.id)
        )
        .where(
          and(
            eq(attestAssignment.companyId, companyId),
            eq(attestProgram.code, programCode)
          )
        );

      const total = totalResult?.count || 0;

      const assignmentResponses: AttestAssignmentResponseType[] =
        assignments.map(assignment => ({
          id: assignment.id,
          companyId: assignment.companyId,
          programId: assignment.programId,
          scopeKey: assignment.scopeKey,
          assigneeId: assignment.assigneeId,
          approverId: assignment.approverId,
          createdAt: assignment.createdAt.toISOString(),
        }));

      return {
        assignments: assignmentResponses,
        total,
        hasMore: offset + limit < total,
      };
    }

    // Get total count
    const [totalResult] = await this.dbInstance
      .select({ count: count() })
      .from(attestAssignment)
      .where(and(...conditions));

    const total = totalResult?.count || 0;

    // Get paginated results
    const assignments = await this.dbInstance
      .select()
      .from(attestAssignment)
      .where(and(...conditions))
      .orderBy(desc(attestAssignment.createdAt))
      .limit(limit)
      .offset(offset);

    const assignmentResponses: AttestAssignmentResponseType[] = assignments.map(
      assignment => ({
        id: assignment.id,
        companyId: assignment.companyId,
        programId: assignment.programId,
        scopeKey: assignment.scopeKey,
        assigneeId: assignment.assigneeId,
        approverId: assignment.approverId,
        createdAt: assignment.createdAt.toISOString(),
      })
    );

    return {
      assignments: assignmentResponses,
      total,
      hasMore: offset + limit < total,
    };
  }
}
