import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import {
    evdObject,
    evdRecord,
    evdRedactionRule,
    evdLink,
    evdManifest,
    evdManifestLine,
    evdBinder,
    evdAttestation
} from "@aibos/db-adapter/schema";
import type {
    EvidenceUploadReqType,
    EvidenceLinkReqType,
    RedactionRuleUpsertType,
    ManifestBuildReqType,
    BinderBuildReqType,
    AttestReqType,
    EvidenceObjectResponseType,
    EvidenceRecordResponseType,
    RedactionRuleResponseType,
    ManifestResponseType,
    BinderResponseType,
    AttestationResponseType
} from "@aibos/contracts";
import { createHash } from "crypto";
import { Readable } from "stream";

export class EnhancedEvidenceService {
    constructor(private dbInstance = db) { }

    /**
     * Upload evidence object with content-addressed storage
     */
    async uploadEvidence(
        companyId: string,
        userId: string,
        data: EvidenceUploadReqType,
        fileStream?: Readable
    ): Promise<{ record_id: string; object_id: string; sha256_hex: string }> {
        // Verify claimed SHA256 if file stream provided
        if (fileStream) {
            const computedHash = await this.computeStreamSHA256(fileStream);
            if (computedHash !== data.sha256_hex) {
                throw new Error("SHA256 mismatch: claimed hash does not match computed hash");
            }
        }

        // Check if object already exists (dedupe)
        const existingObjects = await this.dbInstance
            .select()
            .from(evdObject)
            .where(and(
                eq(evdObject.companyId, companyId),
                eq(evdObject.sha256Hex, data.sha256_hex)
            ))
            .limit(1);

        let objectId: string;
        if (existingObjects.length > 0) {
            objectId = existingObjects[0]!.id;
        } else {
            // Create new object
            const newObject = await this.dbInstance
                .insert(evdObject)
                .values({
                    companyId,
                    sha256Hex: data.sha256_hex,
                    sizeBytes: data.size_bytes,
                    mime: data.mime,
                    storageUri: data.storage_hint || `file://evidence/${data.sha256_hex}`,
                    uploadedBy: userId
                })
                .returning();

            objectId = newObject[0]!.id;
        }

        // Create evidence record
        const recordId = ulid();
        await this.dbInstance
            .insert(evdRecord)
            .values({
                id: recordId,
                companyId,
                objectId,
                source: data.source,
                sourceId: data.source_id,
                title: data.title,
                note: data.note,
                tags: data.tags || [],
                piiLevel: data.pii_level,
                createdBy: userId
            });

        return {
            record_id: recordId,
            object_id: objectId,
            sha256_hex: data.sha256_hex
        };
    }

    /**
     * Link evidence record to business objects
     */
    async linkEvidence(
        companyId: string,
        userId: string,
        data: EvidenceLinkReqType
    ): Promise<{ link_id: string }> {
        // Verify record exists and belongs to company
        const records = await this.dbInstance
            .select()
            .from(evdRecord)
            .where(and(
                eq(evdRecord.id, data.record_id),
                eq(evdRecord.companyId, companyId)
            ))
            .limit(1);

        if (records.length === 0) {
            throw new Error("Evidence record not found");
        }

        const linkId = ulid();
        await this.dbInstance
            .insert(evdLink)
            .values({
                id: linkId,
                companyId,
                recordId: data.record_id,
                kind: data.kind,
                refId: data.ref_id,
                addedBy: userId
            });

        return { link_id: linkId };
    }

    /**
     * Manage redaction rules
     */
    async upsertRedactionRule(
        companyId: string,
        userId: string,
        data: RedactionRuleUpsertType
    ): Promise<RedactionRuleResponseType> {
        const ruleId = ulid();
        const [rule] = await this.dbInstance
            .insert(evdRedactionRule)
            .values({
                id: ruleId,
                companyId,
                code: data.code,
                description: data.description,
                rule: data.rule,
                enabled: data.enabled,
                updatedBy: userId
            })
            .returning();

        const ruleData = rule!;
        return {
            id: ruleData.id,
            code: ruleData.code,
            description: ruleData.description ?? undefined,
            rule: ruleData.rule as Record<string, any>,
            enabled: ruleData.enabled,
            updated_by: ruleData.updatedBy,
            updated_at: ruleData.updatedAt.toISOString()
        };
    }

    /**
     * Build evidence manifest with filters and redaction
     */
    async buildManifest(
        companyId: string,
        userId: string,
        data: ManifestBuildReqType
    ): Promise<ManifestResponseType> {
        // Get all evidence records linked to the scope
        const links = await this.dbInstance
            .select({
                recordId: evdLink.recordId,
                record: evdRecord,
                object: evdObject
            })
            .from(evdLink)
            .innerJoin(evdRecord, eq(evdLink.recordId, evdRecord.id))
            .innerJoin(evdObject, eq(evdRecord.objectId, evdObject.id))
            .where(and(
                eq(evdLink.companyId, companyId),
                eq(evdLink.kind, data.scope_kind),
                eq(evdLink.refId, data.scope_id)
            ));

        // Apply filters
        let filteredRecords = links.map(link => link.record);

        if (data.filters) {
            if (data.filters.pii_level_max) {
                const piiLevels = ["NONE", "LOW", "MEDIUM", "HIGH"];
                const maxIndex = piiLevels.indexOf(data.filters.pii_level_max);
                filteredRecords = filteredRecords.filter(record =>
                    piiLevels.indexOf(record.piiLevel) <= maxIndex
                );
            }

            if (data.filters.exclude_tags?.length) {
                filteredRecords = filteredRecords.filter(record =>
                    !record.tags?.some(tag => data.filters!.exclude_tags!.includes(tag))
                );
            }
        }

        // Create manifest
        const manifestId = ulid();
        const manifestPayload = {
            scope_kind: data.scope_kind,
            scope_id: data.scope_id,
            filters: data.filters || {},
            records: filteredRecords.map(record => ({
                id: record.id,
                title: record.title,
                pii_level: record.piiLevel,
                tags: record.tags
            }))
        };

        const manifestHash = this.computeSHA256(JSON.stringify(manifestPayload, null, 2));
        const totalBytes = filteredRecords.reduce((sum, record) => {
            const link = links.find(l => l.recordId === record.id);
            return sum + (link?.object.sizeBytes || 0);
        }, 0);

        await this.dbInstance
            .insert(evdManifest)
            .values({
                id: manifestId,
                companyId,
                scopeKind: data.scope_kind,
                scopeId: data.scope_id,
                filters: data.filters || {},
                objectCount: filteredRecords.length,
                totalBytes,
                sha256Hex: manifestHash,
                createdBy: userId
            });

        // Create manifest lines
        for (const record of filteredRecords) {
            const link = links.find(l => l.recordId === record.id);
            if (link) {
                await this.dbInstance
                    .insert(evdManifestLine)
                    .values({
                        manifestId,
                        recordId: record.id,
                        objectSha256: link.object.sha256Hex,
                        objectBytes: link.object.sizeBytes,
                        title: record.title,
                        tags: record.tags ?? undefined
                    });
            }
        }

        return {
            id: manifestId,
            scope_kind: data.scope_kind,
            scope_id: data.scope_id,
            filters: data.filters || {},
            object_count: filteredRecords.length,
            total_bytes: totalBytes,
            sha256_hex: manifestHash,
            created_by: userId,
            created_at: new Date().toISOString()
        };
    }

    /**
     * Build eBinder ZIP from manifest
     */
    async buildBinder(
        companyId: string,
        userId: string,
        data: BinderBuildReqType
    ): Promise<BinderResponseType> {
        // Get manifest and lines
        const manifests = await this.dbInstance
            .select()
            .from(evdManifest)
            .where(and(
                eq(evdManifest.id, data.manifest_id),
                eq(evdManifest.companyId, companyId)
            ))
            .limit(1);

        if (manifests.length === 0) {
            throw new Error("Manifest not found");
        }

        const manifest = manifests[0]!;
        const lines = await this.dbInstance
            .select({
                line: evdManifestLine,
                record: evdRecord,
                object: evdObject
            })
            .from(evdManifestLine)
            .innerJoin(evdRecord, eq(evdManifestLine.recordId, evdRecord.id))
            .innerJoin(evdObject, eq(evdRecord.objectId, evdObject.id))
            .where(eq(evdManifestLine.manifestId, data.manifest_id));

        // Build ZIP content (simplified - in real implementation, use archiver)
        const zipContent = await this.buildZipContent(manifest, lines);
        const zipHash = this.computeSHA256(zipContent);
        const zipSize = Buffer.byteLength(zipContent);

        const binderId = ulid();
        await this.dbInstance
            .insert(evdBinder)
            .values({
                id: binderId,
                companyId,
                scopeKind: manifest.scopeKind,
                scopeId: manifest.scopeId,
                manifestId: data.manifest_id,
                format: data.format,
                storageUri: `file://binders/${binderId}.zip`,
                sizeBytes: zipSize,
                sha256Hex: zipHash,
                builtBy: userId
            });

        return {
            id: binderId,
            scope_kind: manifest.scopeKind,
            scope_id: manifest.scopeId,
            manifest_id: data.manifest_id,
            format: data.format,
            storage_uri: `file://binders/${binderId}.zip`,
            size_bytes: zipSize,
            sha256_hex: zipHash,
            built_by: userId,
            built_at: new Date().toISOString()
        };
    }

    /**
     * Attest eBinder
     */
    async attestBinder(
        companyId: string,
        userId: string,
        data: AttestReqType
    ): Promise<AttestationResponseType> {
        // Verify binder exists
        const binders = await this.dbInstance
            .select()
            .from(evdBinder)
            .where(and(
                eq(evdBinder.id, data.binder_id),
                eq(evdBinder.companyId, companyId)
            ))
            .limit(1);

        if (binders.length === 0) {
            throw new Error("Binder not found");
        }

        const attestationPayload = {
            binder_id: data.binder_id,
            signer_id: userId,
            signer_role: data.signer_role,
            statement: data.statement,
            signed_at: new Date().toISOString(),
            version: "1.0"
        };

        const payloadHash = this.computeSHA256(JSON.stringify(attestationPayload, null, 2));
        const attestationId = ulid();

        await this.dbInstance
            .insert(evdAttestation)
            .values({
                id: attestationId,
                companyId,
                binderId: data.binder_id,
                signerId: userId,
                signerRole: data.signer_role,
                payload: attestationPayload,
                sha256Hex: payloadHash
            });

        return {
            id: attestationId,
            binder_id: data.binder_id,
            signer_id: userId,
            signer_role: data.signer_role,
            payload: attestationPayload,
            sha256_hex: payloadHash,
            signed_at: new Date().toISOString()
        };
    }

    /**
     * Compute SHA256 hash of string
     */
    private computeSHA256(content: string): string {
        return createHash('sha256').update(content).digest('hex');
    }

    /**
     * Compute SHA256 hash of stream
     */
    private async computeStreamSHA256(stream: Readable): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = createHash('sha256');
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    /**
     * Build ZIP content (simplified implementation)
     */
    private async buildZipContent(manifest: any, lines: any[]): Promise<string> {
        // In a real implementation, this would use archiver to create a proper ZIP
        // For now, return a JSON representation
        const zipStructure = {
            "index.html": this.generateIndexHtml(manifest, lines),
            "manifest.json": JSON.stringify(manifest, null, 2),
            "evidence": lines.map((line, index) => ({
                [`${index + 1}_${line.line.title.replace(/[^a-zA-Z0-9]/g, '_')}.${this.getFileExtension(line.object.mime)}`]:
                    `Content from ${line.object.storageUri}`
            }))
        };

        return JSON.stringify(zipStructure, null, 2);
    }

    /**
     * Generate index.html for eBinder
     */
    private generateIndexHtml(manifest: any, lines: any[]): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>eBinder - ${manifest.scope_kind} ${manifest.scope_id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
        .manifest-info { background: #f5f5f5; padding: 20px; margin: 20px 0; }
        .evidence-list { margin-top: 20px; }
        .evidence-item { padding: 10px; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>eBinder Evidence Package</h1>
        <p><strong>Scope:</strong> ${manifest.scope_kind} - ${manifest.scope_id}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <div class="manifest-info">
        <h2>Manifest Information</h2>
        <p><strong>Object Count:</strong> ${manifest.object_count}</p>
        <p><strong>Total Size:</strong> ${manifest.total_bytes} bytes</p>
        <p><strong>Manifest Hash:</strong> ${manifest.sha256_hex}</p>
    </div>
    
    <div class="evidence-list">
        <h2>Evidence Items</h2>
        ${lines.map((line, index) => `
            <div class="evidence-item">
                <h3>${index + 1}. ${line.line.title}</h3>
                <p><strong>Size:</strong> ${line.object.size_bytes} bytes</p>
                <p><strong>Hash:</strong> ${line.object.sha256_hex}</p>
                <p><strong>Tags:</strong> ${line.line.tags.join(', ')}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    /**
     * Get file extension from MIME type
     */
    private getFileExtension(mime: string): string {
        const mimeMap: Record<string, string> = {
            'application/pdf': 'pdf',
            'text/csv': 'csv',
            'application/json': 'json',
            'text/plain': 'txt',
            'image/png': 'png',
            'image/jpeg': 'jpg'
        };
        return mimeMap[mime] || 'bin';
    }
}
