import { pool } from '@/lib/db';

export async function cleanCompany(companyId: string) {
    // Delete children first, then parents
    await pool.query(`DELETE FROM ic_match_line WHERE match_id IN (SELECT id FROM ic_match WHERE company_id = $1)`, [companyId]);
    await pool.query(`DELETE FROM ic_match WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM ic_link WHERE company_id = $1`, [companyId]);

    await pool.query(`DELETE FROM bank_job_log WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM bank_ack_map WHERE ack_id IN (SELECT id FROM bank_ack WHERE company_id = $1)`, [companyId]);
    await pool.query(`DELETE FROM bank_ack WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM bank_inbox_audit WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM bank_outbox WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM bank_fetch_cursor WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM bank_reason_norm WHERE bank_code LIKE $1`, [`%${companyId.slice(-6)}%`]);

    await pool.query(`DELETE FROM ap_pay_line WHERE run_id IN (SELECT id FROM ap_pay_run WHERE company_id = $1)`, [companyId]);
    await pool.query(`DELETE FROM ap_pay_run WHERE company_id = $1`, [companyId]);

    await pool.query(`DELETE FROM bank_conn_profile WHERE company_id = $1`, [companyId]);
}
