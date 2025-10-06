import { db, pool } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import {
  auditRequest,
  auditRequestMsg,
  outbox,
} from '@aibos/db-adapter/schema';
import type { PbcOpen, PbcReply, RequestQuery } from '@aibos/contracts';
import { RequestResponseType } from '@aibos/contracts';
import { z } from 'zod';
import { logLine } from '@/lib/log';

export class AuditPbcService {
  constructor(private dbInstance = db) {}

  /**
   * Open PBC request
   */
  async openRequest(
    companyId: string,
    auditorId: string,
    data: any
  ): Promise<z.infer<typeof RequestResponseType>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const requestId = ulid();

      // Create request
      await client.query(
        `INSERT INTO audit_request (id, company_id, auditor_id, title, detail, state, due_at, created_at)
                 VALUES ($1, $2, $3, $4, $5, 'OPEN', $6, now())`,
        [requestId, companyId, auditorId, data.title, data.detail, data.due_at]
      );

      // Emit outbox event
      await client.query(
        `INSERT INTO outbox (id, topic, payload, created_at)
                 VALUES ($1, 'AUDIT_PBC_OPENED', $2, now())`,
        [
          ulid(),
          JSON.stringify({
            company_id: companyId,
            auditor_id: auditorId,
            request_id: requestId,
            title: data.title,
            detail: data.detail,
            due_at: data.due_at,
          }),
        ]
      );

      await client.query('COMMIT');

      // Get the created request with messages
      const result = await this.getRequestById(client, requestId);

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        msg: `Failed to open PBC request: ${error}`,
        companyId,
        auditorId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reply to PBC request
   */
  async reply(
    companyId: string,
    userId: string,
    data: any
  ): Promise<z.infer<typeof RequestResponseType>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify request exists and is open
      const requestResult = await client.query(
        `SELECT id, auditor_id, title FROM audit_request 
                 WHERE id = $1 AND company_id = $2 AND state = 'OPEN'`,
        [data.request_id, companyId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Request not found or not open');
      }

      const request = requestResult.rows[0];

      // Create reply message
      const messageId = ulid();
      await client.query(
        `INSERT INTO audit_request_msg (id, request_id, author_kind, author_id, body, evd_record_id, created_at)
                 VALUES ($1, $2, 'OWNER', $3, $4, $5, now())`,
        [messageId, data.request_id, userId, data.body, data.evd_record_id]
      );

      // Update request state to responded
      await client.query(
        `UPDATE audit_request SET state = 'RESPONDED' WHERE id = $1`,
        [data.request_id]
      );

      // Emit outbox event
      await client.query(
        `INSERT INTO outbox (id, topic, payload, created_at)
                 VALUES ($1, 'AUDIT_PBC_RESPONDED', $2, now())`,
        [
          ulid(),
          JSON.stringify({
            company_id: companyId,
            auditor_id: request.auditor_id,
            request_id: data.request_id,
            title: request.title,
            responder_id: userId,
            body: data.body,
            evd_record_id: data.evd_record_id,
          }),
        ]
      );

      await client.query('COMMIT');

      // Get the updated request with messages
      const result = await this.getRequestById(client, data.request_id);

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        msg: `Failed to reply to PBC request: ${error}`,
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
   * Query PBC requests
   */
  async queryRequests(
    companyId: string,
    query: any
  ): Promise<z.infer<typeof RequestResponseType>[]> {
    const client = await pool.connect();
    try {
      let whereClause = 'WHERE ar.company_id = $1';
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (query.auditor_id) {
        whereClause += ` AND ar.auditor_id = $${paramIndex}`;
        params.push(query.auditor_id);
        paramIndex++;
      }

      if (query.state) {
        whereClause += ` AND ar.state = $${paramIndex}`;
        params.push(query.state);
        paramIndex++;
      }

      if (query.due_after) {
        whereClause += ` AND ar.due_at > $${paramIndex}`;
        params.push(query.due_after);
        paramIndex++;
      }

      if (query.due_before) {
        whereClause += ` AND ar.due_at < $${paramIndex}`;
        params.push(query.due_before);
        paramIndex++;
      }

      const result = await client.query(
        `SELECT ar.id, ar.title, ar.detail, ar.state, ar.due_at, ar.created_at,
                        aa.email as auditor_email, aa.display_name as auditor_name
                 FROM audit_request ar
                 JOIN audit_auditor aa ON aa.id = ar.auditor_id
                 ${whereClause}
                 ORDER BY ar.created_at DESC
                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, query.limit, query.offset]
      );

      const requests = [];
      for (const row of result.rows) {
        const request = await this.getRequestById(client, row.id);
        requests.push(request);
      }

      return requests;
    } catch (error) {
      logLine({
        msg: `Failed to query PBC requests: ${error}`,
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get request by ID with messages
   */
  private async getRequestById(
    client: any,
    requestId: string
  ): Promise<z.infer<typeof RequestResponseType>> {
    const requestResult = await client.query(
      `SELECT id, title, detail, state, due_at, created_at
             FROM audit_request WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Request not found');
    }

    const request = requestResult.rows[0];

    // Get messages
    const messagesResult = await client.query(
      `SELECT id, author_kind, author_id, body, evd_record_id, created_at
             FROM audit_request_msg WHERE request_id = $1 ORDER BY created_at ASC`,
      [requestId]
    );

    const messages = messagesResult.rows.map((msg: any) => ({
      id: msg.id,
      author_kind: msg.author_kind,
      author_id: msg.author_id,
      body: msg.body,
      evd_record_id: msg.evd_record_id,
      created_at: msg.created_at.toISOString(),
    }));

    return {
      id: request.id,
      title: request.title,
      detail: request.detail,
      state: request.state,
      due_at: request.due_at?.toISOString() || null,
      created_at: request.created_at.toISOString(),
      messages: messages,
    };
  }

  /**
   * Close request
   */
  async closeRequest(
    companyId: string,
    requestId: string,
    userId: string
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify request exists
      const requestResult = await client.query(
        `SELECT id, auditor_id FROM audit_request 
                 WHERE id = $1 AND company_id = $2`,
        [requestId, companyId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Request not found');
      }

      const request = requestResult.rows[0];

      // Update request state
      await client.query(
        `UPDATE audit_request SET state = 'CLOSED' WHERE id = $1`,
        [requestId]
      );

      // Add system message
      const messageId = ulid();
      await client.query(
        `INSERT INTO audit_request_msg (id, request_id, author_kind, author_id, body, created_at)
                 VALUES ($1, $2, 'SYSTEM', NULL, 'Request closed by owner', now())`,
        [messageId, requestId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        msg: `Failed to close PBC request: ${error}`,
        companyId,
        requestId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }
}
