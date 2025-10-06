import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, inArray, count } from 'drizzle-orm';
import { createHash } from 'crypto';
import {
  attestTask,
  attestResponse,
  attestEvidenceLink,
  attestTemplate,
  attestPack,
  attestCampaign,
  attestProgram,
  outbox,
} from '@aibos/db-adapter/schema';
import type {
  PackSignReqType,
  PackDownloadReqType,
  PackResponseType,
  PackManifestType,
} from '@aibos/contracts';

export class AttestPackService {
  constructor(private dbInstance = db) {}

  /**
   * Build and sign an attestation pack
   */
  async buildPack(
    taskId: string,
    companyId: string,
    signerId: string
  ): Promise<PackResponseType> {
    // Get task with all related data
    const [task] = await this.dbInstance
      .select()
      .from(attestTask)
      .where(
        and(eq(attestTask.id, taskId), eq(attestTask.companyId, companyId))
      );

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.state !== 'APPROVED') {
      throw new Error(`Task is in ${task.state} state and cannot be packed`);
    }

    // Check if pack already exists
    const [existingPack] = await this.dbInstance
      .select()
      .from(attestPack)
      .where(eq(attestPack.taskId, taskId));

    if (existingPack) {
      throw new Error('Pack already exists for this task');
    }

    // Get template and campaign data
    const [template] = await this.dbInstance
      .select()
      .from(attestTemplate)
      .innerJoin(
        attestCampaign,
        eq(attestTemplate.id, attestCampaign.templateId)
      )
      .where(eq(attestCampaign.id, task.campaignId));

    if (!template) {
      throw new Error('Template not found');
    }

    // Get response data
    const [response] = await this.dbInstance
      .select()
      .from(attestResponse)
      .where(eq(attestResponse.taskId, taskId));

    if (!response) {
      throw new Error('Response not found');
    }

    // Get evidence links
    const evidenceLinks = await this.dbInstance
      .select()
      .from(attestEvidenceLink)
      .where(eq(attestEvidenceLink.taskId, taskId));

    // Build manifest
    const manifest: PackManifestType = {
      taskId,
      template: {
        code: template.attest_template.code,
        version: template.attest_template.version,
      },
      answers: response.answers as any,
      evidence: evidenceLinks.map(link => ({
        evdRecordId: link.evdRecordId,
        sha256: '', // Would be populated from evidence vault
        name: '', // Would be populated from evidence vault
      })),
      assignee: {
        id: task.assigneeId,
        display: '', // Would be populated from user service
      },
      timestamps: {
        issued: task.createdAt.toISOString(),
        submitted: task.submittedAt?.toISOString() || null,
        approved: task.approvedAt?.toISOString() || null,
      },
      sha256: '', // Will be computed below
    };

    // Compute deterministic hash
    const manifestJson = JSON.stringify(manifest, null, 2);
    const sha256 = createHash('sha256').update(manifestJson).digest('hex');
    manifest.sha256 = sha256;

    // Create pack record
    const packId = ulid();
    const packData = {
      id: packId,
      taskId,
      manifest: manifest as any,
      sha256,
      signerId,
    };

    await this.dbInstance.insert(attestPack).values(packData);

    // Emit outbox event
    await this.emitPackSignedEvent(taskId, companyId, signerId, sha256);

    // Return the created pack
    const [result] = await this.dbInstance
      .select()
      .from(attestPack)
      .where(eq(attestPack.id, packId));

    if (!result) {
      throw new Error('Failed to create attestation pack');
    }

    return {
      id: result.id,
      taskId: result.taskId,
      manifest: result.manifest as any,
      sha256: result.sha256,
      signerId: result.signerId,
      signedAt: result.signedAt.toISOString(),
    };
  }

  /**
   * Download an attestation pack
   */
  async downloadPack(
    taskId: string,
    companyId: string,
    format: 'json' | 'zip' = 'json'
  ): Promise<{ data: any; contentType: string; filename: string }> {
    // Get pack data
    const [pack] = await this.dbInstance
      .select()
      .from(attestPack)
      .innerJoin(attestTask, eq(attestPack.taskId, attestTask.id))
      .where(
        and(eq(attestPack.taskId, taskId), eq(attestTask.companyId, companyId))
      );

    if (!pack) {
      throw new Error('Pack not found');
    }

    if (format === 'json') {
      return {
        data: pack.attest_pack.manifest,
        contentType: 'application/json',
        filename: `attestation-pack-${taskId}.json`,
      };
    } else if (format === 'zip') {
      // For ZIP format, we would create a ZIP file with:
      // - index.html (readable version)
      // - manifest.json (raw data)
      // - evidence/ folder with linked evidence files
      // This would integrate with M26.4 evidence vault

      // For now, return the manifest as JSON
      return {
        data: pack.attest_pack.manifest,
        contentType: 'application/zip',
        filename: `attestation-pack-${taskId}.zip`,
      };
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Get pack by task ID
   */
  async getPack(
    taskId: string,
    companyId: string
  ): Promise<PackResponseType | null> {
    const [pack] = await this.dbInstance
      .select()
      .from(attestPack)
      .innerJoin(attestTask, eq(attestPack.taskId, attestTask.id))
      .where(
        and(eq(attestPack.taskId, taskId), eq(attestTask.companyId, companyId))
      );

    if (!pack) {
      return null;
    }

    return {
      id: pack.attest_pack.id,
      taskId: pack.attest_pack.taskId,
      manifest: pack.attest_pack.manifest as any,
      sha256: pack.attest_pack.sha256,
      signerId: pack.attest_pack.signerId,
      signedAt: pack.attest_pack.signedAt.toISOString(),
    };
  }

  /**
   * Private helper to emit pack signed event
   */
  private async emitPackSignedEvent(
    taskId: string,
    companyId: string,
    signerId: string,
    sha256: string
  ): Promise<void> {
    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'ATTEST_PACK_SIGNED',
      payload: JSON.stringify({
        taskId,
        companyId,
        signerId,
        sha256,
      }),
    });
  }
}
