import { pool } from '@/lib/db';
import { logLine } from '@/lib/log';
import {
  TestPlanUpsertType,
  TestPlanApproveType,
  SampleUpsertType,
  TestResultUpsertType,
  TestPlanResponseType,
  TestResultResponseType,
  SOXQueryParamsType,
} from '@aibos/contracts';

export class SOXTestingService {
  // Create test plan
  async createTestPlan(
    companyId: string,
    userId: string,
    data: TestPlanUpsertType
  ): Promise<TestPlanResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if plan already exists for this control and period
      const existingResult = await client.query(
        `SELECT id FROM sox_test_plan WHERE control_id = $1 AND period = $2`,
        [data.control_id, data.period]
      );

      if (existingResult.rows.length > 0) {
        throw new Error(
          `Test plan already exists for control ${data.control_id} in period ${data.period}`
        );
      }

      const insertResult = await client.query(
        `INSERT INTO sox_test_plan 
                    (company_id, control_id, period, attributes, sample_method, sample_size, prepared_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
        [
          companyId,
          data.control_id,
          data.period,
          JSON.stringify(data.attributes),
          data.sample_method,
          data.sample_size,
          userId,
        ]
      );

      const planId = insertResult.rows[0].id;

      // Get the final result
      const result = await client.query(
        `SELECT id, control_id, period, attributes, sample_method, sample_size, status, prepared_at, approved_at
                 FROM sox_test_plan WHERE id = $1`,
        [planId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        control_id: row.control_id,
        period: row.period,
        attributes: JSON.parse(row.attributes),
        sample_method: row.sample_method,
        sample_size: row.sample_size,
        status: row.status,
        prepared_at: row.prepared_at.toISOString(),
        approved_at: row.approved_at?.toISOString() || null,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXTestingService.createTestPlan failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Approve test plan
  async approveTestPlan(
    companyId: string,
    userId: string,
    data: TestPlanApproveType
  ): Promise<TestPlanResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update plan status
      const result = await client.query(
        `UPDATE sox_test_plan SET 
                    status = 'APPROVED', approved_by = $1, approved_at = now()
                 WHERE id = $2 AND company_id = $3
                 RETURNING id, control_id, period, attributes, sample_method, sample_size, status, prepared_at, approved_at`,
        [userId, data.plan_id, companyId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Test plan ${data.plan_id} not found`);
      }

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        control_id: row.control_id,
        period: row.period,
        attributes: JSON.parse(row.attributes),
        sample_method: row.sample_method,
        sample_size: row.sample_size,
        status: row.status,
        prepared_at: row.prepared_at.toISOString(),
        approved_at: row.approved_at?.toISOString() || null,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXTestingService.approveTestPlan failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Add test samples
  async addTestSamples(
    companyId: string,
    samples: SampleUpsertType[]
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const sample of samples) {
        await client.query(
          `INSERT INTO sox_test_sample (company_id, plan_id, ref, picked_reason)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (plan_id, ref) DO NOTHING`,
          [companyId, sample.plan_id, sample.ref, sample.picked_reason]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXTestingService.addTestSamples failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Record test result
  async recordTestResult(
    companyId: string,
    userId: string,
    data: TestResultUpsertType
  ): Promise<TestResultResponseType> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertResult = await client.query(
        `INSERT INTO sox_test_result 
                    (company_id, plan_id, sample_id, attribute, outcome, note, evd_record_id, tested_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
        [
          companyId,
          data.plan_id,
          data.sample_id,
          data.attribute,
          data.outcome,
          data.note,
          data.evd_record_id,
          userId,
        ]
      );

      const resultId = insertResult.rows[0].id;

      // Get the final result
      const result = await client.query(
        `SELECT id, plan_id, sample_id, attribute, outcome, note, evd_record_id, tested_at
                 FROM sox_test_result WHERE id = $1`,
        [resultId]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id,
        plan_id: row.plan_id,
        sample_id: row.sample_id,
        attribute: row.attribute,
        outcome: row.outcome,
        note: row.note,
        evd_record_id: row.evd_record_id,
        tested_at: row.tested_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logLine({
        level: 'error',
        msg: `SOXTestingService.recordTestResult failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // List test plans
  async listTestPlans(
    companyId: string,
    params: SOXQueryParamsType
  ): Promise<TestPlanResponseType[]> {
    const client = await pool.connect();
    try {
      let query = `
                SELECT tp.id, tp.control_id, tp.period, tp.attributes, tp.sample_method, tp.sample_size, tp.status, tp.prepared_at, tp.approved_at
                FROM sox_test_plan tp
                JOIN sox_key_control kc ON kc.id = tp.control_id
                WHERE tp.company_id = $1
            `;
      const queryParams: any[] = [companyId];
      let paramIndex = 2;

      if (params.period) {
        query += ` AND tp.period = $${paramIndex}`;
        queryParams.push(params.period);
        paramIndex++;
      }

      if (params.process) {
        query += ` AND kc.process = $${paramIndex}`;
        queryParams.push(params.process);
        paramIndex++;
      }

      query += ` ORDER BY tp.period DESC, tp.prepared_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(params.limit, params.offset);

      const result = await client.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        control_id: row.control_id,
        period: row.period,
        attributes: JSON.parse(row.attributes),
        sample_method: row.sample_method,
        sample_size: row.sample_size,
        status: row.status,
        prepared_at: row.prepared_at.toISOString(),
        approved_at: row.approved_at?.toISOString() || null,
      }));
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXTestingService.listTestPlans failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // List test results
  async listTestResults(
    companyId: string,
    params: SOXQueryParamsType
  ): Promise<TestResultResponseType[]> {
    const client = await pool.connect();
    try {
      let query = `
                SELECT tr.id, tr.plan_id, tr.sample_id, tr.attribute, tr.outcome, tr.note, tr.evd_record_id, tr.tested_at
                FROM sox_test_result tr
                JOIN sox_test_plan tp ON tp.id = tr.plan_id
                WHERE tr.company_id = $1
            `;
      const queryParams: any[] = [companyId];
      let paramIndex = 2;

      if (params.period) {
        query += ` AND tp.period = $${paramIndex}`;
        queryParams.push(params.period);
        paramIndex++;
      }

      query += ` ORDER BY tr.tested_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(params.limit, params.offset);

      const result = await client.query(query, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        plan_id: row.plan_id,
        sample_id: row.sample_id,
        attribute: row.attribute,
        outcome: row.outcome,
        note: row.note,
        evd_record_id: row.evd_record_id,
        tested_at: row.tested_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        level: 'error',
        msg: `SOXTestingService.listTestResults failed: ${error}`,
      });
      throw error;
    } finally {
      client.release();
    }
  }
}
