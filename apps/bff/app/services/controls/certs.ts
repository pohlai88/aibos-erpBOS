import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import {
  certStatement,
  certSignoff,
  closeRun,
  outbox,
} from '@aibos/db-adapter/schema';
import type {
  CertTemplateUpsertType,
  CertTemplateQueryType,
  CertSignQueryType,
  CertTemplateResponseType,
  CertSignoffResponseType,
} from '@aibos/contracts';

export class CertificationsService {
  constructor(private dbInstance = db) {}

  /**
   * Upsert certification statement template
   */
  async upsertCertTemplate(
    companyId: string,
    userId: string,
    data: CertTemplateUpsertType
  ): Promise<CertTemplateResponseType> {
    const templateId = ulid();

    const templateData = {
      id: templateId,
      companyId,
      code: data.code,
      text: data.text,
      level: data.level,
      active: data.active,
      createdBy: userId,
      updatedBy: userId,
    };

    await this.dbInstance
      .insert(certStatement)
      .values(templateData)
      .onConflictDoUpdate({
        target: [certStatement.companyId, certStatement.code],
        set: {
          text: templateData.text,
          level: templateData.level,
          active: templateData.active,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

    return this.getCertTemplate(companyId, templateId);
  }

  /**
   * Get certification template by ID
   */
  async getCertTemplate(
    companyId: string,
    templateId: string
  ): Promise<CertTemplateResponseType> {
    const templates = await this.dbInstance
      .select()
      .from(certStatement)
      .where(
        and(
          eq(certStatement.id, templateId),
          eq(certStatement.companyId, companyId)
        )
      )
      .limit(1);

    if (templates.length === 0) {
      throw new Error('Certification template not found');
    }

    const template = templates[0];
    if (!template) {
      throw new Error('Template not found');
    }

    return {
      id: template.id,
      company_id: template.companyId,
      code: template.code,
      text: template.text,
      level: template.level,
      active: template.active,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
      created_by: template.createdBy,
      updated_by: template.updatedBy,
    };
  }

  /**
   * Query certification templates with filters
   */
  async queryCertTemplates(
    companyId: string,
    query: CertTemplateQueryType
  ): Promise<CertTemplateResponseType[]> {
    const conditions = [eq(certStatement.companyId, companyId)];

    if (query.level) {
      conditions.push(eq(certStatement.level, query.level));
    }
    if (query.active !== undefined) {
      conditions.push(eq(certStatement.active, query.active));
    }

    const templates = await this.dbInstance
      .select()
      .from(certStatement)
      .where(and(...conditions))
      .orderBy(asc(certStatement.code))
      .limit(query.limit)
      .offset(query.offset);

    return templates.map(template => ({
      id: template.id,
      company_id: template.companyId,
      code: template.code,
      text: template.text,
      level: template.level,
      active: template.active,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
      created_by: template.createdBy,
      updated_by: template.updatedBy,
    }));
  }

  /**
   * Sign certification for a close run
   */
  async signCertification(
    companyId: string,
    userId: string,
    data: any
  ): Promise<CertSignoffResponseType> {
    // Verify the close run exists and belongs to the company
    const runs = await this.dbInstance
      .select()
      .from(closeRun)
      .where(
        and(eq(closeRun.id, data.run_id), eq(closeRun.companyId, companyId))
      )
      .limit(1);

    if (runs.length === 0) {
      throw new Error('Close run not found');
    }

    const _run = runs[0];

    // Verify the certification statement exists
    const statements = await this.dbInstance
      .select()
      .from(certStatement)
      .where(
        and(
          eq(certStatement.id, data.statement_id),
          eq(certStatement.companyId, companyId),
          eq(certStatement.active, true)
        )
      )
      .limit(1);

    if (statements.length === 0) {
      throw new Error('Certification statement not found');
    }

    const _certStatementRecord = statements[0];

    // Check if this sign-off already exists
    const existingSignoffs = await this.dbInstance
      .select()
      .from(certSignoff)
      .where(
        and(
          eq(certSignoff.runId, data.run_id),
          eq(certSignoff.level, data.level),
          eq(certSignoff.signerRole, data.signer_role)
        )
      )
      .limit(1);

    if (existingSignoffs.length > 0) {
      throw new Error(
        'Certification sign-off already exists for this run/level/role combination'
      );
    }

    // Generate immutable snapshot URI (in a real implementation, this would create an actual snapshot)
    const snapshotUri =
      data.snapshot_uri ||
      `snapshot://${data.run_id}/${data.level}/${data.signer_role}/${Date.now()}`;

    const signoffId = ulid();
    const certStatementTemplate = statements[0];
    if (!certStatementTemplate) {
      throw new Error('Statement not found');
    }

    const signoffData = {
      id: signoffId,
      companyId,
      runId: data.run_id,
      level: data.level,
      signerRole: data.signer_role,
      signerName: data.signer_name,
      statementId: data.statement_id,
      statementText: certStatementTemplate.text, // Snapshot of statement text at time of signing
      snapshotUri: snapshotUri,
      checksum: data.checksum,
      createdBy: userId,
    };

    await this.dbInstance.insert(certSignoff).values(signoffData);

    // Emit certification signed event
    await this.emitCertificationSignedEvent(companyId, signoffData);

    return {
      id: signoffId,
      company_id: companyId,
      run_id: data.run_id,
      level: data.level,
      signer_role: data.signer_role,
      signer_name: data.signer_name,
      signed_at: new Date().toISOString(),
      statement_id: data.statement_id,
      statement_text: certStatementTemplate.text,
      snapshot_uri: snapshotUri,
      checksum: data.checksum,
      created_at: new Date().toISOString(),
      created_by: userId,
    };
  }

  /**
   * Get certification sign-off by ID
   */
  async getCertSignoff(
    companyId: string,
    signoffId: string
  ): Promise<CertSignoffResponseType> {
    const signoffs = await this.dbInstance
      .select()
      .from(certSignoff)
      .where(
        and(eq(certSignoff.id, signoffId), eq(certSignoff.companyId, companyId))
      )
      .limit(1);

    if (signoffs.length === 0) {
      throw new Error('Certification sign-off not found');
    }

    const signoff = signoffs[0];
    if (!signoff) {
      throw new Error('Signoff not found');
    }

    return {
      id: signoff.id,
      company_id: signoff.companyId,
      run_id: signoff.runId,
      level: signoff.level,
      signer_role: signoff.signerRole,
      signer_name: signoff.signerName,
      signed_at: signoff.signedAt.toISOString(),
      statement_id: signoff.statementId,
      statement_text: signoff.statementText,
      snapshot_uri: signoff.snapshotUri || undefined,
      checksum: signoff.checksum,
      created_at: signoff.createdAt.toISOString(),
      created_by: signoff.createdBy,
    };
  }

  /**
   * Query certification sign-offs with filters
   */
  async queryCertSignoffs(
    companyId: string,
    query: CertSignQueryType
  ): Promise<CertSignoffResponseType[]> {
    const conditions = [eq(certSignoff.companyId, companyId)];

    if (query.run_id) {
      conditions.push(eq(certSignoff.runId, query.run_id));
    }
    if (query.level) {
      conditions.push(eq(certSignoff.level, query.level));
    }
    if (query.signer_role) {
      conditions.push(eq(certSignoff.signerRole, query.signer_role));
    }
    if (query.signed_from) {
      conditions.push(sql`${certSignoff.signedAt} >= ${query.signed_from}`);
    }
    if (query.signed_to) {
      conditions.push(sql`${certSignoff.signedAt} <= ${query.signed_to}`);
    }

    const signoffs = await this.dbInstance
      .select()
      .from(certSignoff)
      .where(and(...conditions))
      .orderBy(desc(certSignoff.signedAt))
      .limit(query.limit)
      .offset(query.offset);

    return signoffs.map(signoff => ({
      id: signoff.id,
      run_id: signoff.runId,
      company_id: signoff.companyId,
      created_at: signoff.createdAt.toISOString(),
      created_by: signoff.createdBy,
      checksum: signoff.checksum,
      level: signoff.level,
      statement_id: signoff.statementId,
      signer_role: signoff.signerRole,
      signer_name: signoff.signerName,
      signed_at: signoff.signedAt.toISOString(),
      statement_text: signoff.statementText,
      snapshot_uri: signoff.snapshotUri || undefined,
    }));
  }

  /**
   * Get certification status for a close run
   */
  async getCertificationStatus(
    companyId: string,
    runId: string
  ): Promise<{
    run_id: string;
    entity_level: {
      manager_signed: boolean;
      controller_signed: boolean;
      manager_signer?: string;
      controller_signer?: string;
      manager_signed_at?: string;
      controller_signed_at?: string;
    };
    consolidated_level: {
      cfo_signed: boolean;
      cfo_signer?: string;
      cfo_signed_at?: string;
    };
    all_required_signed: boolean;
  }> {
    const signoffs = await this.dbInstance
      .select()
      .from(certSignoff)
      .where(
        and(eq(certSignoff.runId, runId), eq(certSignoff.companyId, companyId))
      );

    const entitySignoffs = signoffs.filter(s => s.level === 'ENTITY');
    const consolidatedSignoffs = signoffs.filter(
      s => s.level === 'CONSOLIDATED'
    );

    const managerSignoff = entitySignoffs.find(s => s.signerRole === 'MANAGER');
    const controllerSignoff = entitySignoffs.find(
      s => s.signerRole === 'CONTROLLER'
    );
    const cfoSignoff = consolidatedSignoffs.find(s => s.signerRole === 'CFO');

    return {
      run_id: runId,
      entity_level: {
        manager_signed: !!managerSignoff,
        controller_signed: !!controllerSignoff,
        ...(managerSignoff?.signerName && {
          manager_signer: managerSignoff.signerName,
        }),
        ...(controllerSignoff?.signerName && {
          controller_signer: controllerSignoff.signerName,
        }),
        ...(managerSignoff?.signedAt && {
          manager_signed_at: managerSignoff.signedAt.toISOString(),
        }),
        ...(controllerSignoff?.signedAt && {
          controller_signed_at: controllerSignoff.signedAt.toISOString(),
        }),
      },
      consolidated_level: {
        cfo_signed: !!cfoSignoff,
        ...(cfoSignoff?.signerName && { cfo_signer: cfoSignoff.signerName }),
        ...(cfoSignoff?.signedAt && {
          cfo_signed_at: cfoSignoff.signedAt.toISOString(),
        }),
      },
      all_required_signed: !!(
        managerSignoff &&
        controllerSignoff &&
        cfoSignoff
      ),
    };
  }

  /**
   * Generate certification snapshot for a close run
   */
  async generateCertificationSnapshot(
    companyId: string,
    runId: string,
    level: 'ENTITY' | 'CONSOLIDATED'
  ): Promise<{ snapshot_uri: string; checksum: string }> {
    // In a real implementation, this would generate an actual snapshot
    // For now, we'll create a placeholder snapshot
    const snapshotData = {
      company_id: companyId,
      run_id: runId,
      level: level,
      generated_at: new Date().toISOString(),
      financial_statements: {
        // This would contain actual financial statement data
        balance_sheet: {},
        income_statement: {},
        cash_flow_statement: {},
      },
    };

    const snapshotUri = `snapshot://${companyId}/${runId}/${level}/${Date.now()}`;
    const checksum = await this.computeChecksum(JSON.stringify(snapshotData));

    return {
      snapshot_uri: snapshotUri,
      checksum: checksum,
    };
  }

  /**
   * Compute SHA256 checksum for data integrity
   */
  private async computeChecksum(data: string): Promise<string> {
    // In a real implementation, you'd use crypto.createHash('sha256')
    // For now, we'll create a simple hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Emit certification signed event to outbox
   */
  private async emitCertificationSignedEvent(
    companyId: string,
    signoffData: any
  ): Promise<void> {
    const eventId = ulid();

    await this.dbInstance.insert(outbox).values({
      id: eventId,
      topic: 'CERT_SIGNED',
      payload: JSON.stringify({
        company_id: companyId,
        run_id: signoffData.runId,
        level: signoffData.level,
        signer_role: signoffData.signerRole,
        signer_name: signoffData.signerName,
        statement_id: signoffData.statementId,
        snapshot_uri: signoffData.snapshotUri,
        checksum: signoffData.checksum,
        signed_at: new Date().toISOString(),
      }),
    });
  }
}
