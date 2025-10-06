import { pool } from '@/lib/db';

export async function cleanCompany(companyId: string) {
  // Delete children first, then parents
  await pool.query(
    `DELETE FROM ic_match_line WHERE match_id IN (SELECT id FROM ic_match WHERE company_id = $1)`,
    [companyId]
  );
  await pool.query(`DELETE FROM ic_match WHERE company_id = $1`, [companyId]);
  await pool.query(`DELETE FROM ic_link WHERE company_id = $1`, [companyId]);

  await pool.query(`DELETE FROM bank_job_log WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(
    `DELETE FROM bank_ack_map WHERE ack_id IN (SELECT id FROM bank_ack WHERE company_id = $1)`,
    [companyId]
  );
  await pool.query(`DELETE FROM bank_ack WHERE company_id = $1`, [companyId]);
  await pool.query(`DELETE FROM bank_inbox_audit WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM bank_outbox WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM bank_fetch_cursor WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM bank_reason_norm WHERE bank_code LIKE $1`, [
    `%${companyId.slice(-6)}%`,
  ]);

  await pool.query(
    `DELETE FROM ap_pay_line WHERE run_id IN (SELECT id FROM ap_pay_run WHERE company_id = $1)`,
    [companyId]
  );
  await pool.query(`DELETE FROM ap_pay_run WHERE company_id = $1`, [companyId]);

  // Clean up discount-related tables
  await pool.query(
    `DELETE FROM ap_discount_line WHERE run_id IN (SELECT id FROM ap_discount_run WHERE company_id = $1)`,
    [companyId]
  );
  await pool.query(`DELETE FROM ap_discount_run WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ap_discount_offer WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ap_discount_post WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ap_discount_policy WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ap_invoice WHERE company_id = $1`, [companyId]);

  await pool.query(`DELETE FROM bank_conn_profile WHERE company_id = $1`, [
    companyId,
  ]);

  // Clean up AR Collections tables
  await pool.query(
    `DELETE FROM ar_cash_app_link WHERE cash_app_id IN (SELECT id FROM ar_cash_app WHERE company_id = $1)`,
    [companyId]
  );
  await pool.query(`DELETE FROM ar_cash_app WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ar_remittance_import WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ar_ptp WHERE company_id = $1`, [companyId]);
  await pool.query(`DELETE FROM ar_dispute WHERE company_id = $1`, [companyId]);
  await pool.query(`DELETE FROM ar_dunning_log WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ar_age_snapshot WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM cf_receipt_signal WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM comm_template WHERE company_id = $1`, [
    companyId,
  ]);
  await pool.query(`DELETE FROM ar_dunning_policy WHERE company_id = $1`, [
    companyId,
  ]);
}
