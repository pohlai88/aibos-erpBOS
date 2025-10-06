import { pool } from '@/lib/db';
import { idFor } from './ids';

export async function ensureBankProfile({
  companyId,
  bankCode,
}: {
  companyId: string;
  bankCode: string;
}) {
  await pool.query(
    `
    INSERT INTO bank_conn_profile (company_id, bank_code, kind, config, active, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (company_id, bank_code) DO UPDATE SET active = EXCLUDED.active
  `,
    [
      companyId,
      bankCode,
      'SFTP',
      JSON.stringify({
        host: 'sftp.hsbc.my',
        port: 22,
        username: 'acme',
        key_ref: 'HSBC_SSH_KEY',
        out_dir: '/out',
        in_dir: '/in',
      }),
      true,
      'test-user',
    ]
  );
}

export async function ensureExportedRun({
  companyId,
  runId,
}: {
  companyId: string;
  runId: string;
}) {
  await pool.query(
    `
    INSERT INTO ap_pay_run (id, company_id, year, month, status, ccy, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET status = 'exported'
  `,
    [runId, companyId, 2024, 1, 'exported', 'MYR', 'test-user']
  );
}

export async function seedPayLines({
  companyId,
  runId,
  invoiceIds,
}: {
  companyId: string;
  runId: string;
  invoiceIds: string[];
}) {
  for (const inv of invoiceIds) {
    await pool.query(
      `
      INSERT INTO ap_pay_line (id, run_id, supplier_id, invoice_id, due_date, gross_amount, pay_amount, inv_ccy, pay_ccy, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (run_id, invoice_id) DO NOTHING
    `,
      [
        idFor(`line:${runId}:${inv}`),
        runId,
        `supplier-${inv}`,
        inv,
        '2024-01-15',
        1000,
        1000,
        'MYR',
        'MYR',
        'selected',
      ]
    );
  }
}
