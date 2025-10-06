// M15.2: Idempotency service for cash alert dispatch
// Prevents duplicate alerts within a dedupe window

import { pool } from '../../lib/db';

export interface IdempotencyKey {
  company_id: string;
  period: string; // "2026-01" format
  scenario_code: string;
}

export interface IdempotencyRecord {
  key: string;
  company_id: string;
  period: string;
  scenario_code: string;
  breaches_count: number;
  dispatched_at: Date;
  expires_at: Date;
}

const DEDUPE_WINDOW_HOURS = parseInt(
  process.env.CASH_ALERTS_DEDUPE_WINDOW_HOURS || '24'
);

export function generateIdempotencyKey(data: IdempotencyKey): string {
  return `cash_alerts:${data.company_id}:${data.period}:${data.scenario_code}`;
}

export async function checkIdempotency(
  key: string
): Promise<IdempotencyRecord | null> {
  try {
    const result = await pool.query(
      `SELECT key, company_id, period, scenario_code, breaches_count, dispatched_at, expires_at
             FROM cash_alert_idempotency 
             WHERE key = $1 AND expires_at > NOW()`,
      [key]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(`❌ Failed to check idempotency:`, error);
    return null; // Fail open - don't block alerts if idempotency check fails
  }
}

export async function recordIdempotency(
  key: string,
  companyId: string,
  period: string,
  scenarioCode: string,
  breachesCount: number
): Promise<void> {
  try {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + DEDUPE_WINDOW_HOURS * 60 * 60 * 1000
    );

    await pool.query(
      `INSERT INTO cash_alert_idempotency 
             (key, company_id, period, scenario_code, breaches_count, dispatched_at, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (key) DO UPDATE SET
             breaches_count = $5,
             dispatched_at = $6,
             expires_at = $7`,
      [key, companyId, period, scenarioCode, breachesCount, now, expiresAt]
    );

    console.log(
      `🔒 Idempotency recorded: ${key} (expires in ${DEDUPE_WINDOW_HOURS}h)`
    );
  } catch (error) {
    console.error(`❌ Failed to record idempotency:`, error);
    // Don't throw - idempotency recording should not break the main flow
  }
}

export async function cleanupExpiredIdempotency(): Promise<number> {
  try {
    const result = await pool.query(
      `DELETE FROM cash_alert_idempotency WHERE expires_at <= NOW()`
    );

    const deleted = result.rowCount ?? 0;
    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} expired idempotency records`);
    }

    return deleted;
  } catch (error) {
    console.error(`❌ Failed to cleanup expired idempotency:`, error);
    return 0;
  }
}
