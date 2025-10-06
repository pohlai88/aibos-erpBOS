import { pool } from '../../lib/db';

export async function upsertRate(
  companyId: string,
  actor: string,
  r: { as_of_date: string; src_ccy: string; dst_ccy: string; rate: number }
) {
  await pool.query(
    `INSERT INTO fx_admin_rates (company_id, as_of_date, src_ccy, dst_ccy, rate, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (company_id, as_of_date, src_ccy, dst_ccy)
     DO UPDATE SET rate = EXCLUDED.rate, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [companyId, r.as_of_date, r.src_ccy, r.dst_ccy, r.rate, actor]
  );
  return { ok: true };
}

export async function listRates(
  companyId: string,
  ym?: { year: number; month: number }
) {
  if (!ym) {
    const { rows } = await pool.query(
      `SELECT as_of_date, src_ccy, dst_ccy, rate, updated_at, updated_by
       FROM fx_admin_rates
       WHERE company_id = $1
       ORDER BY as_of_date DESC, src_ccy, dst_ccy`,
      [companyId]
    );
    return rows;
  }

  const asOf = new Date(Date.UTC(ym.year, ym.month, 0)); // month-end
  const { rows } = await pool.query(
    `SELECT as_of_date, src_ccy, dst_ccy, rate, updated_at, updated_by
     FROM fx_admin_rates
     WHERE company_id = $1 AND as_of_date = $2
     ORDER BY src_ccy, dst_ccy`,
    [companyId, asOf.toISOString().split('T')[0]]
  );
  return rows;
}
