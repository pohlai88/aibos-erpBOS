import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import {
    ctrlEvidenceManifest,
    ctrlEvidenceItem,
    closeEbinder,
    ctrlEvidenceAttestation,
    ctrlControl,
    closeRun,
    closeTask
} from "@aibos/db-adapter/schema";
import type {
    EvidenceManifestUpsertType,
    EvidenceManifestQueryType,
    EvidenceItemAddType,
    EvidenceItemQueryType,
    EbinderGenerateType,
    EbinderQueryType,
    EvidenceAttestationAddType,
    EvidenceAttestationQueryType,
    EvidenceManifestResponseType,
    EvidenceItemResponseType,
    EbinderResponseType,
    EvidenceAttestationResponseType
} from "@aibos/contracts";

export class EvidenceVaultService {
    constructor(private dbInstance = db) { }

    /**
     * Create evidence manifest with SHA256 integrity
     */
    async createEvidenceManifest(
        companyId: string,
        userId: string,
        data: EvidenceManifestUpsertType
    ): Promise<EvidenceManifestResponseType> {
        const manifestId = ulid();

        // Verify control exists and belongs to company
        const controls = await this.dbInstance
            .select()
            .from(ctrlControl)
            .where(and(
                eq(ctrlControl.id, data.control_id),
                eq(ctrlControl.companyId, companyId)
            ))
            .limit(1);

        if (controls.length === 0) {
            throw new Error("Control not found");
        }

        // Calculate content hash for all evidence items
        const evidenceItems = await Promise.all(data.evidence_items.map(async item => ({
            id: ulid(),
            manifestId,
            itemName: item.item_name,
            itemType: item.item_type,
            contentHash: await this.computeSHA256(item.content),
            sizeBytes: Buffer.from(item.content, 'base64').length,
            mimeType: item.mime_type,
            metadata: item.metadata || {},
            createdBy: userId
        })));

        const totalSizeBytes = evidenceItems.reduce((sum, item) => sum + item.sizeBytes, 0);
        const contentHash = await this.computeSHA256(
            evidenceItems.map(item => `${item.itemName}:${item.contentHash}`).join('|')
        );

        // Create manifest
        const manifestData = {
            id: manifestId,
            companyId,
            controlId: data.control_id,
            runId: data.run_id || null,
            taskId: data.task_id || null,
            bundleName: data.bundle_name,
            bundleType: data.bundle_type,
            manifestHash: await this.computeSHA256(JSON.stringify({
                bundleName: data.bundle_name,
                bundleType: data.bundle_type,
                controlId: data.control_id,
                evidenceCount: evidenceItems.length,
                totalSizeBytes
            })),
            contentHash,
            sizeBytes: totalSizeBytes,
            evidenceCount: evidenceItems.length,
            createdBy: userId
        };

        await this.dbInstance.insert(ctrlEvidenceManifest).values(manifestData);
        await this.dbInstance.insert(ctrlEvidenceItem).values(evidenceItems);

        return this.getEvidenceManifest(companyId, manifestId);
    }

    /**
     * Get evidence manifest by ID
     */
    async getEvidenceManifest(companyId: string, manifestId: string): Promise<EvidenceManifestResponseType> {
        const manifests = await this.dbInstance
            .select()
            .from(ctrlEvidenceManifest)
            .where(and(
                eq(ctrlEvidenceManifest.id, manifestId),
                eq(ctrlEvidenceManifest.companyId, companyId)
            ))
            .limit(1);

        if (manifests.length === 0) {
            throw new Error("Evidence manifest not found");
        }

        const manifest = manifests[0];
        if (!manifest) {
            throw new Error("Manifest not found");
        }

        return {
            id: manifest.id,
            company_id: manifest.companyId,
            control_id: manifest.controlId,
            run_id: manifest.runId || undefined,
            task_id: manifest.taskId || undefined,
            bundle_name: manifest.bundleName,
            bundle_type: manifest.bundleType,
            manifest_hash: manifest.manifestHash,
            content_hash: manifest.contentHash,
            size_bytes: manifest.sizeBytes,
            evidence_count: manifest.evidenceCount,
            created_at: manifest.createdAt.toISOString(),
            created_by: manifest.createdBy,
            sealed_at: manifest.sealedAt.toISOString(),
            status: manifest.status
        };
    }

    /**
     * Query evidence manifests with filters
     */
    async queryEvidenceManifests(
        companyId: string,
        query: EvidenceManifestQueryType
    ): Promise<EvidenceManifestResponseType[]> {
        const conditions = [eq(ctrlEvidenceManifest.companyId, companyId)];

        if (query.control_id) {
            conditions.push(eq(ctrlEvidenceManifest.controlId, query.control_id));
        }
        if (query.run_id) {
            conditions.push(eq(ctrlEvidenceManifest.runId, query.run_id));
        }
        if (query.task_id) {
            conditions.push(eq(ctrlEvidenceManifest.taskId, query.task_id));
        }
        if (query.bundle_type) {
            conditions.push(eq(ctrlEvidenceManifest.bundleType, query.bundle_type));
        }
        if (query.status) {
            conditions.push(eq(ctrlEvidenceManifest.status, query.status));
        }
        if (query.created_from) {
            conditions.push(sql`${ctrlEvidenceManifest.createdAt} >= ${query.created_from}`);
        }
        if (query.created_to) {
            conditions.push(sql`${ctrlEvidenceManifest.createdAt} <= ${query.created_to}`);
        }

        const manifests = await this.dbInstance
            .select()
            .from(ctrlEvidenceManifest)
            .where(and(...conditions))
            .orderBy(desc(ctrlEvidenceManifest.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return manifests.map(manifest => ({
            id: manifest.id,
            company_id: manifest.companyId,
            control_id: manifest.controlId,
            run_id: manifest.runId || undefined,
            task_id: manifest.taskId || undefined,
            bundle_name: manifest.bundleName,
            bundle_type: manifest.bundleType,
            manifest_hash: manifest.manifestHash,
            content_hash: manifest.contentHash,
            size_bytes: manifest.sizeBytes,
            evidence_count: manifest.evidenceCount,
            created_at: manifest.createdAt.toISOString(),
            created_by: manifest.createdBy,
            sealed_at: manifest.sealedAt.toISOString(),
            status: manifest.status
        }));
    }

    /**
     * Add evidence item to existing manifest
     */
    async addEvidenceItem(
        companyId: string,
        userId: string,
        data: EvidenceItemAddType
    ): Promise<EvidenceItemResponseType> {
        // Verify manifest exists and belongs to company
        const manifests = await this.dbInstance
            .select()
            .from(ctrlEvidenceManifest)
            .where(and(
                eq(ctrlEvidenceManifest.id, data.manifest_id),
                eq(ctrlEvidenceManifest.companyId, companyId)
            ))
            .limit(1);

        if (manifests.length === 0) {
            throw new Error("Evidence manifest not found");
        }

        const manifest = manifests[0];
        if (!manifest) {
            throw new Error("Manifest not found");
        }

        if (manifest.status !== 'ACTIVE') {
            throw new Error("Cannot add items to archived or redacted manifest");
        }

        const itemId = ulid();
        const contentHash = await this.computeSHA256(data.content);
        const sizeBytes = Buffer.from(data.content, 'base64').length;

        const itemData = {
            id: itemId,
            manifestId: data.manifest_id,
            itemName: data.item_name,
            itemType: data.item_type,
            contentHash,
            sizeBytes,
            mimeType: data.mime_type || null,
            metadata: data.metadata || {},
            createdBy: userId
        };

        await this.dbInstance.insert(ctrlEvidenceItem).values(itemData);

        // Update manifest totals
        await this.dbInstance
            .update(ctrlEvidenceManifest)
            .set({
                sizeBytes: manifest.sizeBytes + sizeBytes,
                evidenceCount: manifest.evidenceCount + 1,
                contentHash: await this.computeSHA256(`${manifest.contentHash}:${contentHash}`)
            })
            .where(eq(ctrlEvidenceManifest.id, data.manifest_id));

        return {
            id: itemId,
            manifest_id: data.manifest_id,
            item_name: data.item_name,
            item_type: data.item_type,
            file_path: undefined,
            content_hash: contentHash,
            size_bytes: sizeBytes,
            mime_type: data.mime_type || undefined,
            metadata: data.metadata || {},
            redacted: false,
            redaction_reason: undefined,
            created_at: new Date().toISOString(),
            created_by: userId
        };
    }

    /**
     * Generate eBinder (monthly/quarterly audit package)
     */
    async generateEbinder(
        companyId: string,
        userId: string,
        data: EbinderGenerateType
    ): Promise<EbinderResponseType> {
        const binderId = ulid();

        // Auto-discover manifests if not provided
        let manifestIds = data.manifest_ids;
        if (!manifestIds || manifestIds.length === 0) {
            const conditions = [eq(ctrlEvidenceManifest.companyId, companyId)];

            if (data.run_id) {
                conditions.push(eq(ctrlEvidenceManifest.runId, data.run_id));
            }

            conditions.push(sql`${ctrlEvidenceManifest.createdAt} >= ${data.period_start}`);
            conditions.push(sql`${ctrlEvidenceManifest.createdAt} <= ${data.period_end}`);

            if (!data.include_redacted) {
                conditions.push(eq(ctrlEvidenceManifest.status, 'ACTIVE'));
            }

            const manifests = await this.dbInstance
                .select({ id: ctrlEvidenceManifest.id })
                .from(ctrlEvidenceManifest)
                .where(and(...conditions));

            manifestIds = manifests.map(m => m.id);
        }

        if (manifestIds.length === 0) {
            throw new Error("No evidence manifests found for the specified period");
        }

        // Calculate binder totals
        const manifestDetails = await this.dbInstance
            .select({
                sizeBytes: ctrlEvidenceManifest.sizeBytes,
                evidenceCount: ctrlEvidenceManifest.evidenceCount
            })
            .from(ctrlEvidenceManifest)
            .where(and(
                eq(ctrlEvidenceManifest.companyId, companyId),
                inArray(ctrlEvidenceManifest.id, manifestIds)
            ));

        const totalSizeBytes = manifestDetails.reduce((sum, m) => sum + m.sizeBytes, 0);
        const totalEvidenceItems = manifestDetails.reduce((sum, m) => sum + m.evidenceCount, 0);
        const binderHash = await this.computeSHA256(manifestIds.join('|'));

        const binderData = {
            id: binderId,
            companyId,
            runId: data.run_id || null,
            binderName: data.binder_name,
            binderType: data.binder_type,
            periodStart: data.period_start,
            periodEnd: data.period_end,
            manifestIds,
            totalManifests: manifestIds.length,
            totalEvidenceItems,
            totalSizeBytes,
            binderHash,
            generatedBy: userId
        };

        await this.dbInstance.insert(closeEbinder).values(binderData);

        return {
            id: binderId,
            company_id: companyId,
            run_id: data.run_id || undefined,
            binder_name: data.binder_name,
            binder_type: data.binder_type,
            period_start: data.period_start,
            period_end: data.period_end,
            manifest_ids: manifestIds,
            total_manifests: manifestIds.length,
            total_evidence_items: totalEvidenceItems,
            total_size_bytes: totalSizeBytes,
            binder_hash: binderHash,
            generated_at: new Date().toISOString(),
            generated_by: userId,
            download_count: 0,
            last_downloaded_at: undefined,
            status: 'GENERATED'
        };
    }

    /**
     * Add digital attestation to evidence manifest
     */
    async addEvidenceAttestation(
        companyId: string,
        userId: string,
        data: EvidenceAttestationAddType
    ): Promise<EvidenceAttestationResponseType> {
        // Verify manifest exists and belongs to company
        const manifests = await this.dbInstance
            .select()
            .from(ctrlEvidenceManifest)
            .where(and(
                eq(ctrlEvidenceManifest.id, data.manifest_id),
                eq(ctrlEvidenceManifest.companyId, companyId)
            ))
            .limit(1);

        if (manifests.length === 0) {
            throw new Error("Evidence manifest not found");
        }

        const attestationId = ulid();
        const attestationData = {
            id: attestationId,
            manifestId: data.manifest_id,
            attestorName: data.attestor_name,
            attestorRole: data.attestor_role,
            attestationType: data.attestation_type,
            digitalSignature: data.digital_signature,
            expiresAt: data.expires_at ? new Date(data.expires_at) : null,
            createdBy: userId
        };

        await this.dbInstance.insert(ctrlEvidenceAttestation).values(attestationData);

        return {
            id: attestationId,
            manifest_id: data.manifest_id,
            attestor_name: data.attestor_name,
            attestor_role: data.attestor_role,
            attestation_type: data.attestation_type,
            digital_signature: data.digital_signature,
            signed_at: new Date().toISOString(),
            expires_at: data.expires_at || undefined,
            created_at: new Date().toISOString(),
            created_by: userId
        };
    }

    /**
     * Get eBinder download URL and update download count
     */
    async getEbinderDownload(companyId: string, binderId: string): Promise<{
        download_url: string;
        binder_hash: string;
        total_size_bytes: number;
    }> {
        const binders = await this.dbInstance
            .select()
            .from(closeEbinder)
            .where(and(
                eq(closeEbinder.id, binderId),
                eq(closeEbinder.companyId, companyId)
            ))
            .limit(1);

        if (binders.length === 0) {
            throw new Error("eBinder not found");
        }

        const binder = binders[0];
        if (!binder) {
            throw new Error("Binder not found");
        }

        // Update download count
        await this.dbInstance
            .update(closeEbinder)
            .set({
                downloadCount: binder.downloadCount + 1,
                lastDownloadedAt: new Date()
            })
            .where(eq(closeEbinder.id, binderId));

        // In a real implementation, this would generate a signed URL for download
        const downloadUrl = `/api/evidence/ebinder/${binderId}/download`;

        return {
            download_url: downloadUrl,
            binder_hash: binder.binderHash,
            total_size_bytes: binder.totalSizeBytes
        };
    }

    /**
     * Compute SHA256 checksum for data integrity
     */
    private async computeSHA256(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
