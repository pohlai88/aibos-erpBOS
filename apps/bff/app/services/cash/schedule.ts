// M15.2: Cash Alert Schedule Service Helpers
// Database operations for per-company schedule management

import { pool } from '../../lib/db';
import { logScheduleAuditEvent } from './schedule-audit';

export async function getSchedule(companyId: string) {
  const query = `
        SELECT 
            company_id,
            enabled,
            hour_local,
            minute_local,
            timezone,
            scenario_code,
            updated_at,
            updated_by
        FROM cash_alert_schedule 
        WHERE company_id = $1
    `;

  const result = await pool.query(query, [companyId]);
  return result.rows[0] ?? null;
}

export async function ensureScenarioExists(companyId: string, code: string) {
  const query = `
        SELECT id 
        FROM cash_forecast_version 
        WHERE company_id = $1 AND code = $2
        LIMIT 1
    `;

  const result = await pool.query(query, [companyId, code]);
  return result.rows.length > 0;
}

export async function upsertSchedule(
  companyId: string,
  actor: string,
  input: {
    enabled: boolean;
    hour_local: number;
    minute_local: number;
    timezone: string;
    scenario_code: string;
  }
) {
  const now = new Date();

  // Check if schedule exists
  const existing = await getSchedule(companyId);

  if (existing) {
    // Update existing schedule
    const updateQuery = `
            UPDATE cash_alert_schedule 
            SET 
                enabled = $2,
                hour_local = $3,
                minute_local = $4,
                timezone = $5,
                scenario_code = $6,
                updated_at = $7,
                updated_by = $8
            WHERE company_id = $1
        `;

    await pool.query(updateQuery, [
      companyId,
      input.enabled,
      input.hour_local,
      input.minute_local,
      input.timezone,
      input.scenario_code,
      now,
      actor,
    ]);

    // Log audit event
    await logScheduleAuditEvent({
      type: 'CashAlertScheduleUpdated',
      company_id: companyId,
      actor,
      changes: {
        enabled: input.enabled,
        hour_local: input.hour_local,
        minute_local: input.minute_local,
        timezone: input.timezone,
        scenario_code: input.scenario_code,
      },
      previous_values: {
        enabled: existing.enabled,
        hour_local: existing.hour_local,
        minute_local: existing.minute_local,
        timezone: existing.timezone,
        scenario_code: existing.scenario_code,
      },
      timestamp: now.toISOString(),
    });

    return { updated: true };
  } else {
    // Insert new schedule
    const insertQuery = `
            INSERT INTO cash_alert_schedule (
                company_id,
                enabled,
                hour_local,
                minute_local,
                timezone,
                scenario_code,
                updated_at,
                updated_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

    await pool.query(insertQuery, [
      companyId,
      input.enabled,
      input.hour_local,
      input.minute_local,
      input.timezone,
      input.scenario_code,
      now,
      actor,
    ]);

    // Log audit event
    await logScheduleAuditEvent({
      type: 'CashAlertScheduleCreated',
      company_id: companyId,
      actor,
      changes: {
        enabled: input.enabled,
        hour_local: input.hour_local,
        minute_local: input.minute_local,
        timezone: input.timezone,
        scenario_code: input.scenario_code,
      },
      timestamp: now.toISOString(),
    });

    return { created: true };
  }
}

export async function deleteSchedule(companyId: string, actor: string) {
  // Get existing schedule for audit
  const existing = await getSchedule(companyId);

  const query = `DELETE FROM cash_alert_schedule WHERE company_id = $1`;
  const result = await pool.query(query, [companyId]);

  if (existing && (result.rowCount ?? 0) > 0) {
    // Log audit event
    await logScheduleAuditEvent({
      type: 'CashAlertScheduleDeleted',
      company_id: companyId,
      actor,
      previous_values: {
        enabled: existing.enabled,
        hour_local: existing.hour_local,
        minute_local: existing.minute_local,
        timezone: existing.timezone,
        scenario_code: existing.scenario_code,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return { deleted: (result.rowCount ?? 0) > 0 };
}

export async function getAllSchedules() {
  const query = `
        SELECT 
            company_id,
            enabled,
            hour_local,
            minute_local,
            timezone,
            scenario_code,
            updated_at,
            updated_by
        FROM cash_alert_schedule 
        ORDER BY company_id
    `;

  const result = await pool.query(query);
  return result.rows;
}
