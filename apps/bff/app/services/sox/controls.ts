import { pool } from '@/lib/db';
import { logLine } from '@/lib/log';
import {
  KeyControlUpsertType,
  ControlScopeUpsertType,
  KeyControlResponseType,
  ControlScopeResponseType,
  SOXQueryParamsType,
} from '@aibos/contracts';

export class SOXControlsService {
  // Create or update key control
  async upsertKeyControl(
    companyId: string,
    userId: string,
    data: KeyControlUpsertType
  ): Promise<KeyControlResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if control exists
      const existingResult = await client.query(
        `SELECT id FROM sox_key_control WHERE company_id = $1 AND code = $2`,
        [companyId, data.code]
      );

      let controlId: string;
      if (existingResult.rows.length > 0) {
        // Update existing
        controlId = existingResult.rows[0].id;
        await client.query(
          `UPDATE sox_key_control SET 
                        name = $1, process = $2, risk_stmt = $3, assertion = $4,
                        frequency = $5, automation = $6, owner_id = $7, active = $8
                     WHERE id = $9`,
          [
            data.name,
            data.process,
            data.risk_stmt,
            data.assertion,
            data.frequency,
            data.automation,
            data.owner_id,
            data.active,
            controlId,
          ]
        );
      } else {
        // Insert new
        const insertResult = await client.query(
          `INSERT INTO sox_key_control 
                        (company_id, code, name, process, risk_stmt, assertion, frequency, automation, owner_id, active, created_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                     RETURNING id`,
          [
            companyId,
            data.code,
            data.name,
            data.process,
            data.risk_stmt,
            data.assertion,
            data.frequency,
            data.automation,
            data.owner_id,
            data.active,
            userId,
          ]
        );
        controlId = insertResult.rows[0].id;
      }

      // Get the final result
      const result = await client.query(
        `SELECT id, code, name, process, risk_stmt, assertion, frequency, automation, owner_id, active, created_at
                 FROM sox_key_control WHERE id = $1`,
        [controlId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        process: row.process,
        risk_stmt: row.risk_stmt,
        assertion: row.assertion,
        frequency: row.frequency,
        automation: row.automation,
        owner_id: row.owner_id,
        active: row.active,
        created_at: row.created_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXControlsService.upsertKeyControl failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // List key controls with filtering
  async listKeyControls(
    companyId: string,
    params: SOXQueryParamsType
  ): Promise<KeyControlResponseType[]> {
    const client = await pool.connect();
    try {
      let query = `
                SELECT id, code, name, process, risk_stmt, assertion, frequency, automation, owner_id, active, created_at
                FROM sox_key_control 
                WHERE company_id = $1
            `;
      const queryParams: any[] = [companyId];
      let paramIndex = 2;

      if (params.process) {
        query += ` AND process = $${paramIndex}`;
        queryParams.push(params.process);
        paramIndex++;
      }

      if (params.status) {
        query += ` AND active = $${paramIndex}`;
        queryParams.push(params.status === 'active');
        paramIndex++;
      }

      query += ` ORDER BY process, code LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(params.limit, params.offset);

      const result = await client.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        process: row.process,
        risk_stmt: row.risk_stmt,
        assertion: row.assertion,
        frequency: row.frequency,
        automation: row.automation,
        owner_id: row.owner_id,
        active: row.active,
        created_at: row.created_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXControlsService.listKeyControls failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Upsert control scope
  async upsertControlScope(
    companyId: string,
    userId: string,
    data: ControlScopeUpsertType
  ): Promise<ControlScopeResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if scope exists
      const existingResult = await client.query(
        `SELECT id FROM sox_control_scope WHERE control_id = $1 AND period = $2`,
        [data.control_id, data.period]
      );

      let scopeId: string;
      if (existingResult.rows.length > 0) {
        // Update existing
        scopeId = existingResult.rows[0].id;
        await client.query(
          `UPDATE sox_control_scope SET 
                        in_scope = $1, materiality = $2, updated_by = $3, updated_at = now()
                     WHERE id = $4`,
          [data.in_scope, data.materiality, userId, scopeId]
        );
      } else {
        // Insert new
        const insertResult = await client.query(
          `INSERT INTO sox_control_scope 
                        (company_id, control_id, period, in_scope, materiality, updated_by)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id`,
          [
            companyId,
            data.control_id,
            data.period,
            data.in_scope,
            data.materiality,
            userId,
          ]
        );
        scopeId = insertResult.rows[0].id;
      }

      // Get the final result
      const result = await client.query(
        `SELECT id, control_id, period, in_scope, materiality, updated_at
                 FROM sox_control_scope WHERE id = $1`,
        [scopeId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        control_id: row.control_id,
        period: row.period,
        in_scope: row.in_scope,
        materiality: row.materiality,
        updated_at: row.updated_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXControlsService.upsertControlScope failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // List control scopes
  async listControlScopes(
    companyId: string,
    params: SOXQueryParamsType
  ): Promise<ControlScopeResponseType[]> {
    const client = await pool.connect();
    try {
      let query = `
                SELECT id, control_id, period, in_scope, materiality, updated_at
                FROM sox_control_scope 
                WHERE company_id = $1
            `;
      const queryParams: any[] = [companyId];
      let paramIndex = 2;

      if (params.period) {
        query += ` AND period = $${paramIndex}`;
        queryParams.push(params.period);
        paramIndex++;
      }

      query += ` ORDER BY period DESC, control_id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(params.limit, params.offset);

      const result = await client.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        control_id: row.control_id,
        period: row.period,
        in_scope: row.in_scope,
        materiality: row.materiality,
        updated_at: row.updated_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXControlsService.listControlScopes failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }
}
