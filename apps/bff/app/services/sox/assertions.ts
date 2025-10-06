import { pool } from '@/lib/db';
import { logLine } from '@/lib/log';
import * as crypto from 'crypto';
import {
  AssertionCreateType,
  AssertionResponseType,
  SOXQueryParamsType,
} from '@aibos/contracts';

export class SOXAssertionsService {
  // Create and sign management assertion
  async createAssertion(
    companyId: string,
    userId: string,
    data: AssertionCreateType
  ): Promise<AssertionResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if assertion already exists for this signer
      const existingResult = await client.query(
        `SELECT id FROM sox_assertion 
                 WHERE company_id = $1 AND type = $2 AND period = $3 AND signed_by = $4`,
        [companyId, data.type, data.period, userId]
      );

      if (existingResult.rows.length > 0) {
        throw new Error(
          `Assertion already exists for ${data.type} period ${data.period} by user ${userId}`
        );
      }

      // Create canonical payload for hashing
      const canonicalPayload = {
        company_id: companyId,
        period: data.period,
        type: data.type,
        statement: data.statement,
        signed_role: data.signed_role,
        timestamp: new Date().toISOString(),
      };

      const payloadString = JSON.stringify(
        canonicalPayload,
        Object.keys(canonicalPayload).sort()
      );
      const sha256Hex = crypto
        .createHash('sha256')
        .update(payloadString)
        .digest('hex');

      const insertResult = await client.query(
        `INSERT INTO sox_assertion 
                    (company_id, period, type, statement, ebinder_id, signed_by, signed_role, sha256_hex)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
        [
          companyId,
          data.period,
          data.type,
          JSON.stringify(data.statement),
          data.ebinder_id,
          userId,
          data.signed_role,
          sha256Hex,
        ]
      );

      const assertionId = insertResult.rows[0].id;

      // Get the final result
      const result = await client.query(
        `SELECT id, period, type, statement, ebinder_id, signed_by, signed_role, sha256_hex, signed_at
                 FROM sox_assertion WHERE id = $1`,
        [assertionId]
      );

      await client.query('COMMIT');

      // Emit outbox event for assertion signed
      await this.emitAssertionSignedEvent(
        companyId,
        assertionId,
        data.type,
        data.period
      );

      const row = result.rows[0];
      return {
        id: row.id,
        period: row.period,
        type: row.type,
        statement: JSON.parse(row.statement),
        ebinder_id: row.ebinder_id,
        signed_by: row.signed_by,
        signed_role: row.signed_role,
        sha256_hex: row.sha256_hex,
        signed_at: row.signed_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXAssertionsService.createAssertion failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // List assertions
  async listAssertions(
    companyId: string,
    params: SOXQueryParamsType
  ): Promise<AssertionResponseType[]> {
    const client = await pool.connect();
    try {
      let query = `
                SELECT id, period, type, statement, ebinder_id, signed_by, signed_role, sha256_hex, signed_at
                FROM sox_assertion 
                WHERE company_id = $1
            `;
      const queryParams: any[] = [companyId];
      let paramIndex = 2;

      if (params.period) {
        query += ` AND period = $${paramIndex}`;
        queryParams.push(params.period);
        paramIndex++;
      }

      if (params.type) {
        query += ` AND type = $${paramIndex}`;
        queryParams.push(params.type);
        paramIndex++;
      }

      query += ` ORDER BY signed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(params.limit, params.offset);

      const result = await client.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        period: row.period,
        type: row.type,
        statement: JSON.parse(row.statement),
        ebinder_id: row.ebinder_id,
        signed_by: row.signed_by,
        signed_role: row.signed_role,
        sha256_hex: row.sha256_hex,
        signed_at: row.signed_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXAssertionsService.listAssertions failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Get assertion status summary
  async getAssertionStatus(companyId: string): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
                SELECT 
                    COUNT(CASE WHEN type = '302' THEN 1 END) as q302_total,
                    COUNT(CASE WHEN type = '302' AND signed_at IS NOT NULL THEN 1 END) as q302_signed,
                    COUNT(CASE WHEN type = '404' THEN 1 END) as q404_total,
                    COUNT(CASE WHEN type = '404' AND signed_at IS NOT NULL THEN 1 END) as q404_signed
                FROM sox_assertion 
                WHERE company_id = $1
            `,
        [companyId]
      );

      const row = result.rows[0];
      return {
        q302_signed: row.q302_signed,
        q302_pending: row.q302_total - row.q302_signed,
        q404_signed: row.q404_signed,
        q404_pending: row.q404_total - row.q404_signed,
      };
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXAssertionsService.getAssertionStatus failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Emit outbox event for assertion signed
  private async emitAssertionSignedEvent(
    companyId: string,
    assertionId: string,
    type: string,
    period: string
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO outbox (company_id, category, payload)
                 VALUES ($1, 'SOX_ASSERT_SIGNED', $2)`,
        [
          companyId,
          JSON.stringify({
            assertion_id: assertionId,
            type: type,
            period: period,
            timestamp: new Date().toISOString(),
          }),
        ]
      );
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXAssertionsService.emitAssertionSignedEvent failed: ${error}`,
      });
      // Don't throw - this is not critical for the main operation
    } finally {
      client.release();
    }
  }
}
