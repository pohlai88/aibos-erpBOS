// apps/bff/app/services/gl/periods.ts
// Global period policy enforcement

import { pool } from "../../lib/db";

export async function assertOpenPeriod(companyId: string, date: Date): Promise<void> {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;

    const { rows } = await pool.query(
        `SELECT state FROM periods 
     WHERE company_id = $1 AND year = $2 AND month = $3`,
        [companyId, year, month]
    );

    if (rows.length === 0) {
        // No period defined - allow posting (backward compatibility)
        return;
    }

    const state = rows[0].state;
    if (state !== 'open') {
        const error: any = new Error(`Posting blocked: ${year}-${String(month).padStart(2, "0")} is ${state}`);
        error.status = 423; // Locked
        throw error;
    }
}

export async function getPeriodState(companyId: string, year: number, month: number): Promise<string | null> {
    const { rows } = await pool.query(
        `SELECT state FROM periods 
     WHERE company_id = $1 AND year = $2 AND month = $3`,
        [companyId, year, month]
    );

    return rows.length > 0 ? rows[0].state : null;
}

export async function setPeriodState(
    companyId: string,
    year: number,
    month: number,
    state: 'open' | 'pending_close' | 'closed',
    updatedBy: string
): Promise<void> {
    await pool.query(
        `INSERT INTO periods (company_id, year, month, state, updated_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (company_id, year, month) 
     DO UPDATE SET state = EXCLUDED.state, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [companyId, year, month, state, updatedBy]
    );
}
