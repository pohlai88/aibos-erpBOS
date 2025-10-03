// Idempotency utility for M24.2 Customer Portal
// Provides simple idempotency checking for portal operations

import { pool } from "@/lib/db";

export interface IdempotencyRecord {
    key: string;
    company_id: string;
    operation: string;
    result: any;
    created_at: Date;
    expires_at: Date;
}

const IDEMPOTENCY_TTL_HOURS = 24; // 24 hours TTL for portal operations

export async function checkIdempotency(
    key: string,
    companyId: string
): Promise<IdempotencyRecord | null> {
    try {
        const result = await pool.query(
            `SELECT key, company_id, operation, result, created_at, expires_at
       FROM portal_idempotency 
       WHERE key = $1 AND company_id = $2 AND expires_at > NOW()`,
            [key, companyId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error(`❌ Failed to check idempotency:`, error);
        return null; // Don't throw - idempotency should not break main flow
    }
}

export async function recordIdempotency(
    key: string,
    companyId: string,
    operation: string,
    result: any
): Promise<void> {
    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000));

        await pool.query(
            `INSERT INTO portal_idempotency 
       (key, company_id, operation, result, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (key, company_id) DO UPDATE SET
       operation = $3,
       result = $4,
       created_at = $5,
       expires_at = $6`,
            [key, companyId, operation, JSON.stringify(result), now, expiresAt]
        );

        console.log(`🔒 Portal idempotency recorded: ${key} (expires in ${IDEMPOTENCY_TTL_HOURS}h)`);
    } catch (error) {
        console.error(`❌ Failed to record idempotency:`, error);
        // Don't throw - idempotency recording should not break the main flow
    }
}

export function generateIdempotencyKey(operation: string, data: any): string {
    // Simple hash-based key generation
    const dataStr = JSON.stringify(data);
    const hash = require('crypto').createHash('sha256').update(dataStr).digest('hex');
    return `${operation}:${hash.substring(0, 16)}`;
}
