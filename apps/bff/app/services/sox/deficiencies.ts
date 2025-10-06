import { pool } from '@/lib/db';
import { logLine } from '@/lib/log';
import {
  DeficiencyUpsertType,
  DeficiencyUpdateType,
  DeficiencyLinkUpsertType,
  DeficiencyResponseType,
  SOXQueryParamsType,
} from '@aibos/contracts';

export class SOXDeficienciesService {
  // Create deficiency
  async createDeficiency(
    companyId: string,
    userId: string,
    data: DeficiencyUpsertType
  ): Promise<DeficiencyResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertResult = await client.query(
        `INSERT INTO sox_deficiency 
                    (company_id, control_id, discovered_in, type, severity, description, root_cause, 
                     aggregation_id, rem_owner_id, remediation_plan, remediation_due, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING id`,
        [
          companyId,
          data.control_id,
          data.discovered_in,
          data.type,
          data.severity,
          data.description,
          data.root_cause,
          data.aggregation_id,
          data.rem_owner_id,
          data.remediation_plan,
          data.remediation_due,
          userId,
        ]
      );

      const deficiencyId = insertResult.rows[0].id;

      // Get the final result
      const result = await client.query(
        `SELECT id, control_id, discovered_in, type, severity, description, root_cause, 
                        status, rem_owner_id, remediation_due, created_at
                 FROM sox_deficiency WHERE id = $1`,
        [deficiencyId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        control_id: row.control_id,
        discovered_in: row.discovered_in,
        type: row.type,
        severity: row.severity,
        description: row.description,
        root_cause: row.root_cause,
        status: row.status,
        rem_owner_id: row.rem_owner_id,
        remediation_due: row.remediation_due?.toISOString() || null,
        created_at: row.created_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXDeficienciesService.createDeficiency failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Update deficiency
  async updateDeficiency(
    companyId: string,
    userId: string,
    data: DeficiencyUpdateType
  ): Promise<DeficiencyResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(data.status);
        paramIndex++;
      }
      if (data.severity !== undefined) {
        updateFields.push(`severity = $${paramIndex}`);
        updateValues.push(data.severity);
        paramIndex++;
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(data.description);
        paramIndex++;
      }
      if (data.root_cause !== undefined) {
        updateFields.push(`root_cause = $${paramIndex}`);
        updateValues.push(data.root_cause);
        paramIndex++;
      }
      if (data.rem_owner_id !== undefined) {
        updateFields.push(`rem_owner_id = $${paramIndex}`);
        updateValues.push(data.rem_owner_id);
        paramIndex++;
      }
      if (data.remediation_plan !== undefined) {
        updateFields.push(`remediation_plan = $${paramIndex}`);
        updateValues.push(data.remediation_plan);
        paramIndex++;
      }
      if (data.remediation_due !== undefined) {
        updateFields.push(`remediation_due = $${paramIndex}`);
        updateValues.push(data.remediation_due);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
                UPDATE sox_deficiency SET ${updateFields.join(', ')}
                WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
                RETURNING id, control_id, discovered_in, type, severity, description, root_cause, 
                         status, rem_owner_id, remediation_due, created_at
            `;
      updateValues.push(data.deficiency_id, companyId);

      const result = await client.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new Error(`Deficiency ${data.deficiency_id} not found`);
      }

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        control_id: row.control_id,
        discovered_in: row.discovered_in,
        type: row.type,
        severity: row.severity,
        description: row.description,
        root_cause: row.root_cause,
        status: row.status,
        rem_owner_id: row.rem_owner_id,
        remediation_due: row.remediation_due?.toISOString() || null,
        created_at: row.created_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXDeficienciesService.updateDeficiency failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Link deficiency to source
  async linkDeficiency(
    companyId: string,
    data: DeficiencyLinkUpsertType
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify deficiency exists and belongs to company
      const deficiencyResult = await client.query(
        `SELECT id FROM sox_deficiency WHERE id = $1 AND company_id = $2`,
        [data.deficiency_id, companyId]
      );

      if (deficiencyResult.rows.length === 0) {
        throw new Error(`Deficiency ${data.deficiency_id} not found`);
      }

      await client.query(
        `INSERT INTO sox_deficiency_link (deficiency_id, source, source_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (deficiency_id, source, source_id) DO NOTHING`,
        [data.deficiency_id, data.source, data.source_id]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXDeficienciesService.linkDeficiency failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // List deficiencies
  async listDeficiencies(
    companyId: string,
    params: SOXQueryParamsType
  ): Promise<DeficiencyResponseType[]> {
    const client = await pool.connect();
    try {
      let query = `
                SELECT id, control_id, discovered_in, type, severity, description, root_cause, 
                       status, rem_owner_id, remediation_due, created_at
                FROM sox_deficiency 
                WHERE company_id = $1
            `;
      const queryParams: any[] = [companyId];
      let paramIndex = 2;

      if (params.period) {
        query += ` AND discovered_in = $${paramIndex}`;
        queryParams.push(params.period);
        paramIndex++;
      }

      if (params.severity) {
        query += ` AND severity = $${paramIndex}`;
        queryParams.push(params.severity);
        paramIndex++;
      }

      if (params.status) {
        query += ` AND status = $${paramIndex}`;
        queryParams.push(params.status);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(params.limit, params.offset);

      const result = await client.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        control_id: row.control_id,
        discovered_in: row.discovered_in,
        type: row.type,
        severity: row.severity,
        description: row.description,
        root_cause: row.root_cause,
        status: row.status,
        rem_owner_id: row.rem_owner_id,
        remediation_due: row.remediation_due?.toISOString() || null,
        created_at: row.created_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXDeficienciesService.listDeficiencies failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Get deficiency summary for dashboard
  async getDeficiencySummary(companyId: string): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
                SELECT 
                    COUNT(*) as total_deficiencies,
                    COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_deficiencies,
                    COUNT(CASE WHEN severity = 'SIGNIFICANT' THEN 1 END) as significant_deficiencies,
                    COUNT(CASE WHEN severity = 'MATERIAL' THEN 1 END) as material_deficiencies,
                    AVG(CASE 
                        WHEN status = 'CLOSED' THEN EXTRACT(DAYS FROM (updated_at - created_at))
                        ELSE EXTRACT(DAYS FROM (CURRENT_DATE - created_at::DATE))
                    END) as avg_age_days
                FROM sox_deficiency 
                WHERE company_id = $1
            `,
        [companyId]
      );

      return result.rows[0];
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXDeficienciesService.getDeficiencySummary failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }
}
