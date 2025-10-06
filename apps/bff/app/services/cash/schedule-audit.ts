// M15.2: Audit logging utilities for cash alert schedule changes
// Lightweight audit trail following the existing outbox pattern

import { pool } from '../../lib/db';

export interface ScheduleAuditEvent {
  type:
    | 'CashAlertScheduleCreated'
    | 'CashAlertScheduleUpdated'
    | 'CashAlertScheduleDeleted';
  company_id: string;
  actor: string;
  changes?: {
    enabled?: boolean;
    hour_local?: number;
    minute_local?: number;
    timezone?: string;
    scenario_code?: string;
  };
  previous_values?: {
    enabled?: boolean;
    hour_local?: number;
    minute_local?: number;
    timezone?: string;
    scenario_code?: string;
  };
  timestamp: string;
}

export async function logScheduleAuditEvent(
  event: ScheduleAuditEvent
): Promise<void> {
  try {
    await pool.query(`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, [
      event.type,
      JSON.stringify(event),
    ]);
    console.log(
      `📝 Audit logged: ${event.type} for company ${event.company_id}`
    );
  } catch (error) {
    console.error(`❌ Failed to log audit event:`, error);
    // Don't throw - audit logging should not break the main flow
  }
}

export async function getScheduleAuditHistory(
  companyId: string,
  limit: number = 50
): Promise<ScheduleAuditEvent[]> {
  try {
    const result = await pool.query(
      `SELECT payload FROM outbox 
             WHERE topic IN ('CashAlertScheduleCreated', 'CashAlertScheduleUpdated', 'CashAlertScheduleDeleted')
             AND payload::jsonb->>'company_id' = $1
             ORDER BY created_at DESC 
             LIMIT $2`,
      [companyId, limit]
    );

    return result.rows.map((row: any) => JSON.parse(row.payload));
  } catch (error) {
    console.error(`❌ Failed to fetch audit history:`, error);
    return [];
  }
}
