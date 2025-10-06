import { db, pool } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import {
  auditAuditor,
  auditGrant,
  auditSession,
  auditAccessLog,
  auditRequest,
  auditRequestMsg,
  auditWatermarkPolicy,
  auditDlKey,
  outbox,
} from '@aibos/db-adapter/schema';
import type {
  AuditorUpsert,
  GrantUpsert,
  GrantRevoke,
  AuditorQuery,
  GrantQuery,
} from '@aibos/contracts';
import { AuditorResponseType, GrantResponseType } from '@aibos/contracts';
import { z } from 'zod';
import { logLine } from '@/lib/log';
import { createHash } from 'crypto';

export class AuditAdminService {
  constructor(private dbInstance = db) {}

  /**
   * Create or update auditor account
   */
  async upsertAuditor(
    companyId: string,
    userId: string,
    data: any
  ): Promise<z.infer<typeof AuditorResponseType>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if auditor already exists
      const existingAuditor = await client.query(
        `SELECT id FROM audit_auditor WHERE company_id = $1 AND email = $2`,
        [companyId, data.email]
      );

      let auditorId: string;
      if (existingAuditor.rows.length > 0) {
        // Update existing auditor
        auditorId = existingAuditor.rows[0].id;
        await client.query(
          `UPDATE audit_auditor 
                     SET display_name = $1, status = $2, updated_at = now()
                     WHERE id = $3`,
          [data.display_name, data.status, auditorId]
        );
      } else {
        // Create new auditor
        auditorId = ulid();
        await client.query(
          `INSERT INTO audit_auditor (id, company_id, email, display_name, status, created_at)
                     VALUES ($1, $2, $3, $4, $5, now())`,
          [auditorId, companyId, data.email, data.display_name, data.status]
        );
      }

      // Get the final result
      const result = await client.query(
        `SELECT id, email, display_name, status, last_login_at, created_at
                 FROM audit_auditor WHERE id = $1`,
        [auditorId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        display_name: row.display_name,
        status: row.status,
        last_login_at: row.last_login_at?.toISOString() || null,
        created_at: row.created_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        msg: `Failed to upsert auditor: ${error}`,
        companyId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Issue grant to auditor for specific object
   */
  async issueGrant(
    companyId: string,
    userId: string,
    data: any
  ): Promise<z.infer<typeof GrantResponseType>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate auditor exists
      const auditorResult = await client.query(
        `SELECT id FROM audit_auditor WHERE company_id = $1 AND email = $2`,
        [companyId, data.auditor_email]
      );

      if (auditorResult.rows.length === 0) {
        throw new Error(`Auditor with email ${data.auditor_email} not found`);
      }

      const auditorId = auditorResult.rows[0].id;

      // Validate object exists based on scope
      await this.validateObjectExists(client, data.scope, data.object_id);

      // Check if grant already exists
      const existingGrant = await client.query(
        `SELECT id FROM audit_grant WHERE auditor_id = $1 AND scope = $2 AND object_id = $3`,
        [auditorId, data.scope, data.object_id]
      );

      let grantId: string;
      if (existingGrant.rows.length > 0) {
        // Update existing grant
        grantId = existingGrant.rows[0].id;
        await client.query(
          `UPDATE audit_grant 
                     SET can_download = $1, expires_at = $2, updated_at = now()
                     WHERE id = $3`,
          [data.can_download, data.expires_at, grantId]
        );
      } else {
        // Create new grant
        grantId = ulid();
        await client.query(
          `INSERT INTO audit_grant (id, company_id, auditor_id, scope, object_id, can_download, expires_at, created_by, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
          [
            grantId,
            companyId,
            auditorId,
            data.scope,
            data.object_id,
            data.can_download,
            data.expires_at,
            userId,
          ]
        );
      }

      // Emit outbox event
      await client.query(
        `INSERT INTO outbox (id, topic, payload, created_at)
                 VALUES ($1, 'AUDIT_GRANT_ISSUED', $2, now())`,
        [
          ulid(),
          JSON.stringify({
            company_id: companyId,
            auditor_id: auditorId,
            grant_id: grantId,
            scope: data.scope,
            object_id: data.object_id,
            can_download: data.can_download,
            expires_at: data.expires_at,
          }),
        ]
      );

      // Get the final result
      const result = await client.query(
        `SELECT id, auditor_id, scope, object_id, can_download, expires_at, created_at
                 FROM audit_grant WHERE id = $1`,
        [grantId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        auditor_id: row.auditor_id,
        scope: row.scope,
        object_id: row.object_id,
        can_download: row.can_download,
        expires_at: row.expires_at.toISOString(),
        created_at: row.created_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        msg: `Failed to issue grant: ${error}`,
        companyId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Revoke grant
   */
  async revokeGrant(grantId: string, userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get grant details for outbox event
      const grantResult = await client.query(
        `SELECT company_id, auditor_id, scope, object_id FROM audit_grant WHERE id = $1`,
        [grantId]
      );

      if (grantResult.rows.length === 0) {
        throw new Error(`Grant ${grantId} not found`);
      }

      const grant = grantResult.rows[0];

      // Delete the grant
      await client.query(`DELETE FROM audit_grant WHERE id = $1`, [grantId]);

      // Emit outbox event
      await client.query(
        `INSERT INTO outbox (id, topic, payload, created_at)
                 VALUES ($1, 'AUDIT_GRANT_REVOKED', $2, now())`,
        [
          ulid(),
          JSON.stringify({
            company_id: grant.company_id,
            auditor_id: grant.auditor_id,
            grant_id: grantId,
            scope: grant.scope,
            object_id: grant.object_id,
          }),
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        msg: `Failed to revoke grant: ${error}`,
        grantId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query auditors
   */
  async queryAuditors(
    companyId: string,
    query: any
  ): Promise<z.infer<typeof AuditorResponseType>[]> {
    const client = await pool.connect();
    try {
      let whereClause = 'WHERE company_id = $1';
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (query.status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(query.status);
        paramIndex++;
      }

      if (query.email) {
        whereClause += ` AND email ILIKE $${paramIndex}`;
        params.push(`%${query.email}%`);
        paramIndex++;
      }

      const result = await client.query(
        `SELECT id, email, display_name, status, last_login_at, created_at
                 FROM audit_auditor ${whereClause}
                 ORDER BY created_at DESC
                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, query.limit, query.offset]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        display_name: row.display_name,
        status: row.status,
        last_login_at: row.last_login_at?.toISOString() || null,
        created_at: row.created_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        msg: `Failed to query auditors: ${error}`,
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query grants
   */
  async queryGrants(
    companyId: string,
    query: any
  ): Promise<z.infer<typeof GrantResponseType>[]> {
    const client = await pool.connect();
    try {
      let whereClause = 'WHERE ag.company_id = $1';
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (query.auditor_id) {
        whereClause += ` AND ag.auditor_id = $${paramIndex}`;
        params.push(query.auditor_id);
        paramIndex++;
      }

      if (query.scope) {
        whereClause += ` AND ag.scope = $${paramIndex}`;
        params.push(query.scope);
        paramIndex++;
      }

      if (query.object_id) {
        whereClause += ` AND ag.object_id = $${paramIndex}`;
        params.push(query.object_id);
        paramIndex++;
      }

      if (query.can_download !== undefined) {
        whereClause += ` AND ag.can_download = $${paramIndex}`;
        params.push(query.can_download);
        paramIndex++;
      }

      if (query.expires_after) {
        whereClause += ` AND ag.expires_at > $${paramIndex}`;
        params.push(query.expires_after);
        paramIndex++;
      }

      const result = await client.query(
        `SELECT ag.id, ag.auditor_id, ag.scope, ag.object_id, ag.can_download, ag.expires_at, ag.created_at,
                        aa.email as auditor_email, aa.display_name as auditor_name
                 FROM audit_grant ag
                 JOIN audit_auditor aa ON aa.id = ag.auditor_id
                 ${whereClause}
                 ORDER BY ag.created_at DESC
                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, query.limit, query.offset]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        auditor_id: row.auditor_id,
        scope: row.scope,
        object_id: row.object_id,
        can_download: row.can_download,
        expires_at: row.expires_at.toISOString(),
        created_at: row.created_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        msg: `Failed to query grants: ${error}`,
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create or update watermark policy
   */
  async upsertWatermarkPolicy(
    companyId: string,
    userId: string,
    data: any
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if policy already exists
      const existingPolicy = await client.query(
        `SELECT company_id FROM audit_watermark_policy WHERE company_id = $1`,
        [companyId]
      );

      if (existingPolicy.rows.length > 0) {
        // Update existing policy
        await client.query(
          `UPDATE audit_watermark_policy 
                     SET text_template = $1, diagonal = $2, opacity = $3, 
                         font_size = $4, font_color = $5, updated_by = $6, updated_at = now()
                     WHERE company_id = $7`,
          [
            data.text_template,
            data.diagonal,
            data.opacity,
            data.font_size,
            data.font_color,
            userId,
            companyId,
          ]
        );
      } else {
        // Create new policy
        await client.query(
          `INSERT INTO audit_watermark_policy 
                     (company_id, text_template, diagonal, opacity, font_size, font_color, created_by, created_at, updated_by, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $7, now())`,
          [
            companyId,
            data.text_template,
            data.diagonal,
            data.opacity,
            data.font_size,
            data.font_color,
            userId,
          ]
        );
      }

      // Get the final result
      const result = await client.query(
        `SELECT company_id, text_template, diagonal, opacity, font_size, font_color, created_at, updated_at
                 FROM audit_watermark_policy WHERE company_id = $1`,
        [companyId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        company_id: row.company_id,
        text_template: row.text_template,
        diagonal: row.diagonal,
        opacity: parseFloat(row.opacity),
        font_size: parseInt(row.font_size),
        font_color: row.font_color,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        msg: `Failed to upsert watermark policy: ${error}`,
        companyId,
        userId,
        error: error instanceof Error ? error.message : String(error),
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
          text_template: 'CONFIDENTIAL • {company} • {auditor_email} • {ts}',
          diagonal: true,
          opacity: 0.15,
          font_size: 24,
          font_color: '#FF0000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const row = result.rows[0];
      return {
        company_id: row.company_id,
        text_template: row.text_template,
        diagonal: row.diagonal,
        opacity: parseFloat(row.opacity),
        font_size: parseInt(row.font_size),
        font_color: row.font_color,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      };
    } catch (error) {
      logLine({
        msg: `Failed to get watermark policy: ${error}`,
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate that object exists based on scope
   */
  private async validateObjectExists(
    client: any,
    scope: string,
    objectId: string
  ): Promise<void> {
    switch (scope) {
      case 'ATTEST_PACK': {
        const attestResult = await client.query(
          `SELECT id FROM attest_pack WHERE id = $1`,
          [objectId]
        );
        if (attestResult.rows.length === 0) {
          throw new Error(`Attestation pack ${objectId} not found`);
        }
        break;
      }
      case 'CTRL_RUN': {
        const ctrlResult = await client.query(
          `SELECT id FROM ctrl_run WHERE id = $1`,
          [objectId]
        );
        if (ctrlResult.rows.length === 0) {
          throw new Error(`Control run ${objectId} not found`);
        }
        break;
      }
      case 'EVIDENCE': {
        const evdResult = await client.query(
          `SELECT id FROM evd_record WHERE id = $1`,
          [objectId]
        );
        if (evdResult.rows.length === 0) {
          throw new Error(`Evidence record ${objectId} not found`);
        }
        break;
      }
      default:
        throw new Error(`Invalid scope: ${scope}`);
    }
  }
}
