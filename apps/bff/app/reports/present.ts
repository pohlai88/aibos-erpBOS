import { pool } from '@/lib/db';

type GetRateParams = {
  companyId: string;
  asOf: Date; // pick last day of (year,month)
  src: string;
  dst: string;
};

export async function getAdminRateOr1(p: GetRateParams): Promise<number> {
  if (!p.dst || p.src === p.dst) return 1;
  const y = p.asOf.getUTCFullYear(),
    m = p.asOf.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0));

  const { rows } = await pool.query(
    `SELECT rate FROM fx_admin_rates 
     WHERE company_id = $1 AND as_of_date = $2 AND src_ccy = $3 AND dst_ccy = $4
     LIMIT 1`,
    [p.companyId, lastDay.toISOString().split('T')[0], p.src, p.dst]
  );

  return rows.length > 0 ? Number(rows[0].rate) : 1;
}

// apply conversion on the pivot-matrix result; amounts keyed by columns
export async function convertMatrix(
  companyId: string,
  asOf: Date,
  dst: string,
  baseCcy: string,
  matrix: any
) {
  if (!dst || dst === baseCcy) return matrix;

  // If your rows carry original currency info per cell, map per-cell. If books are in base only, use single rate.
  const rate = await getAdminRateOr1({ companyId, asOf, src: baseCcy, dst });

  const rows = matrix.rows.map((r: any) => ({
    ...r,
    values: Object.fromEntries(
      Object.entries(r.values).map(([k, v]) => [k, num(v) * rate])
    ),
    total:
      matrix.grand_total != null && r.total != null
        ? num(r.total) * rate
        : r.total,
  }));

  const grand_total =
    matrix.grand_total != null ? num(matrix.grand_total) * rate : undefined;
  return { ...matrix, rows, grand_total };
}

function num(v: any): number {
  return typeof v === 'number' ? v : Number(v || 0);
}
