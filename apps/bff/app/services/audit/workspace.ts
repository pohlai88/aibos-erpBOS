import { db, pool } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import {
    auditGrant,
    auditAccessLog,
    auditDlKey,
    auditWatermarkPolicy
} from "@aibos/db-adapter/schema";
import type {
    PackQuery,
    PackViewReq,
    DlRequest
} from "@aibos/contracts";
import { AuditPackResponseType } from "@aibos/contracts";
import { z } from "zod";
import { logLine } from "@/lib/log";
import { createHash } from "crypto";

export class AuditWorkspaceService {
    constructor(private dbInstance = db) { }

    /**
     * List packs available to auditor
     */
    async listPacks(
        companyId: string,
        auditorId: string,
        query: any
    ): Promise<z.infer<typeof AuditPackResponseType>[]> {
        const client = await pool.connect();
        try {
            let whereClause = `WHERE ag.company_id = $1 AND ag.auditor_id = $2 AND ag.expires_at > now()`;
            const params: any[] = [companyId, auditorId];
            let paramIndex = 3;

            if (query.scope) {
                whereClause += ` AND ag.scope = $${paramIndex}`;
                params.push(query.scope);
                paramIndex++;
            }

            if (query.search) {
                whereClause += ` AND (ac.name ILIKE $${paramIndex} OR at.title ILIKE $${paramIndex})`;
                params.push(`%${query.search}%`);
                paramIndex++;
            }

            if (query.period) {
                whereClause += ` AND DATE_TRUNC('month', ap.created_at) = $${paramIndex}`;
                params.push(query.period);
                paramIndex++;
            }

            if (query.campaign_id) {
                whereClause += ` AND a.campaign_id = $${paramIndex}`;
                params.push(query.campaign_id);
                paramIndex++;
            }

            const result = await client.query(
                `SELECT ap.id, ap.sha256, ac.name as campaign_name, at.title as task_title, 
                        ap.created_at, ag.can_download, ag.scope, ag.object_id
                 FROM audit_grant ag
                 JOIN attest_pack ap ON ap.id = ag.object_id
                 JOIN attest_task t ON t.id = ap.task_id
                 JOIN attest_campaign a ON a.id = t.campaign_id
                 JOIN attest_campaign ac ON ac.id = a.id
                 JOIN attest_template at ON at.id = t.template_id
                 ${whereClause}
                 ORDER BY ap.created_at DESC
                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
                [...params, query.paging.limit, query.paging.offset]
            );

            return result.rows.map((row: any) => ({
                id: row.id,
                title: `${row.campaign_name} - ${row.task_title}`,
                sha256: row.sha256,
                campaign_name: row.campaign_name,
                task_title: row.task_title,
                assignee_id: row.assignee_id,
                created_at: row.created_at.toISOString(),
                can_download: row.can_download
            }));

        } catch (error) {
            logLine({
                msg: `Failed to list packs: ${error}`,
                companyId,
                auditorId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get pack details and manifest
     */
    async getPack(
        companyId: string,
        auditorId: string,
        packId: string
    ): Promise<any> {
        const client = await pool.connect();
        try {
            // Verify auditor has access to this pack
            const grantResult = await client.query(
                `SELECT ag.id, ag.scope, ag.object_id, ag.can_download, ag.expires_at
                 FROM audit_grant ag
                 WHERE ag.company_id = $1 AND ag.auditor_id = $2 AND ag.object_id = $3 AND ag.expires_at > now()`,
                [companyId, auditorId, packId]
            );

            if (grantResult.rows.length === 0) {
                throw new Error("Access denied to pack");
            }

            const grant = grantResult.rows[0];

            // Get pack details
            const packResult = await client.query(
                `SELECT ap.id, ap.sha256, ap.size_bytes, ap.mime, ap.created_at,
                        ac.name as campaign_name, at.title as task_title, t.assignee_id
                 FROM attest_pack ap
                 JOIN attest_task t ON t.id = ap.task_id
                 JOIN attest_campaign a ON a.id = t.campaign_id
                 JOIN attest_campaign ac ON ac.id = a.id
                 JOIN attest_template at ON at.id = t.template_id
                 WHERE ap.id = $1`,
                [packId]
            );

            if (packResult.rows.length === 0) {
                throw new Error("Pack not found");
            }

            const pack = packResult.rows[0];

            // Get evidence manifest
            const manifestResult = await client.query(
                `SELECT em.id, em.bundle_name, em.bundle_type, em.manifest_hash, em.content_hash,
                        em.size_bytes, em.evidence_count, em.created_at
                 FROM evd_manifest em
                 WHERE em.id = $1`,
                [packId]
            );

            const manifest = manifestResult.rows[0];

            return {
                id: pack.id,
                sha256: pack.sha256,
                size_bytes: pack.size_bytes,
                mime: pack.mime,
                created_at: pack.created_at.toISOString(),
                campaign_name: pack.campaign_name,
                task_title: pack.task_title,
                assignee_id: pack.assignee_id,
                can_download: grant.can_download,
                manifest: manifest ? {
                    id: manifest.id,
                    bundle_name: manifest.bundle_name,
                    bundle_type: manifest.bundle_type,
                    manifest_hash: manifest.manifest_hash,
                    content_hash: manifest.content_hash,
                    size_bytes: manifest.size_bytes,
                    evidence_count: manifest.evidence_count,
                    created_at: manifest.created_at.toISOString()
                } : null
            };

        } catch (error) {
            logLine({
                msg: `Failed to get pack: ${error}`,
                companyId,
                auditorId,
                packId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Request download key for pack
     */
    async requestDownloadKey(
        companyId: string,
        auditorId: string,
        grantId: string,
        objectId: string
    ): Promise<{ download_key: string; expires_at: string }> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Verify grant exists and allows download
            const grantResult = await client.query(
                `SELECT id, can_download, expires_at FROM audit_grant 
                 WHERE id = $1 AND company_id = $2 AND auditor_id = $3 AND object_id = $4 AND expires_at > now()`,
                [grantId, companyId, auditorId, objectId]
            );

            if (grantResult.rows.length === 0) {
                throw new Error("Grant not found or expired");
            }

            const grant = grantResult.rows[0];

            if (!grant.can_download) {
                throw new Error("Download not allowed for this grant");
            }

            // Generate download key
            const downloadKey = ulid();
            const keyHash = createHash('sha256').update(downloadKey).digest('hex');
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            // Store download key
            await client.query(
                `INSERT INTO audit_dl_key (id, grant_id, key_hash, expires_at, created_at)
                 VALUES ($1, $2, $3, $4, now())`,
                [ulid(), grantId, keyHash, expiresAt]
            );

            await client.query("COMMIT");

            return {
                download_key: downloadKey,
                expires_at: expiresAt.toISOString()
            };

        } catch (error) {
            await client.query("ROLLBACK");
            logLine({
                msg: `Failed to request download key: ${error}`,
                companyId,
                auditorId,
                grantId,
                objectId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Validate download key and get file info
     */
    async validateDownloadKey(
        downloadKey: string
    ): Promise<{ grant_id: string; object_id: string; file_path: string; company_id: string; auditor_email: string }> {
        const client = await pool.connect();
        try {
            const keyHash = createHash('sha256').update(downloadKey).digest('hex');

            // Find valid download key with auditor and company info
            const keyResult = await client.query(
                `SELECT dk.id, dk.grant_id, dk.expires_at, dk.used_at,
                        ag.object_id, ag.scope, ag.company_id, aa.email as auditor_email
                 FROM audit_dl_key dk
                 JOIN audit_grant ag ON ag.id = dk.grant_id
                 JOIN audit_auditor aa ON aa.id = ag.auditor_id
                 WHERE dk.key_hash = $1 AND dk.expires_at > now() AND dk.used_at IS NULL`,
                [keyHash]
            );

            if (keyResult.rows.length === 0) {
                throw new Error("Invalid or expired download key");
            }

            const key = keyResult.rows[0];

            // Mark key as used
            await client.query(
                `UPDATE audit_dl_key SET used_at = now() WHERE id = $1`,
                [key.id]
            );

            // Get file path based on scope
            let filePath: string;
            switch (key.scope) {
                case 'ATTEST_PACK':
                    const packResult = await client.query(
                        `SELECT storage_uri FROM attest_pack WHERE id = $1`,
                        [key.object_id]
                    );
                    if (packResult.rows.length === 0) {
                        throw new Error("Pack not found");
                    }
                    filePath = packResult.rows[0].storage_uri;
                    break;
                case 'EVIDENCE':
                    const evdResult = await client.query(
                        `SELECT eo.storage_uri FROM evd_record er
                         JOIN evd_object eo ON eo.id = er.object_id
                         WHERE er.id = $1`,
                        [key.object_id]
                    );
                    if (evdResult.rows.length === 0) {
                        throw new Error("Evidence record not found");
                    }
                    filePath = evdResult.rows[0].storage_uri;
                    break;
                default:
                    throw new Error(`Unsupported scope for download: ${key.scope}`);
            }

            return {
                grant_id: key.grant_id,
                object_id: key.object_id,
                file_path: filePath,
                company_id: key.company_id,
                auditor_email: key.auditor_email
            };

        } catch (error) {
            logLine({
                msg: `Failed to validate download key: ${error}`,
                downloadKey,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get watermark policy for company
     */
    async getWatermarkPolicy(companyId: string): Promise<any> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT company_id, text_template, diagonal, opacity, font_size, font_color, created_at, updated_at
                 FROM audit_watermark_policy WHERE company_id = $1`,
                [companyId]
            );

            if (result.rows.length === 0) {
                // Return default policy
                return {
                    company_id: companyId,
                    text_template: "CONFIDENTIAL • {company} • {auditor_email} • {ts}",
                    diagonal: true,
                    opacity: 0.15,
                    font_size: 24,
                    font_color: "#FF0000",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }

            const policy = result.rows[0];
            return {
                company_id: policy.company_id,
                text_template: policy.text_template,
                diagonal: policy.diagonal,
                opacity: parseFloat(policy.opacity),
                font_size: parseInt(policy.font_size),
                font_color: policy.font_color,
                created_at: policy.created_at.toISOString(),
                updated_at: policy.updated_at.toISOString()
            };

        } catch (error) {
            logLine({
                msg: `Failed to get watermark policy: ${error}`,
                companyId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            client.release();
        }
    }
}
