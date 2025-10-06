import { Pool } from 'pg';

export async function resolveTaxRule(
  db: Pool,
  companyId: string,
  codeId: string,
  onISO: string
) {
  const { rows } = await db.query(
    `select r.override_rate, c.rate, c.rounding, c.precision
       from tax_rule r
       join tax_code c on c.id = r.tax_code_id
      where r.company_id=$1 and r.tax_code_id=$2 and r.effective_from <= $3::date
        and (r.effective_to is null or r.effective_to >= $3::date)
      order by r.effective_from desc
      limit 1`,
    [companyId, codeId, onISO]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    rate: r.override_rate ?? Number(r.rate),
    rounding: (r.rounding as 'half_up' | 'bankers') ?? 'half_up',
    precision: Number(r.precision ?? 2),
  };
}

export async function mapTaxAccount(
  db: Pool,
  companyId: string,
  codeId: string,
  kind: 'output' | 'input'
) {
  const { rows } = await db.query(
    `select output_account_code, input_account_code
       from tax_account_map where company_id=$1 and tax_code_id=$2`,
    [companyId, codeId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return kind === 'output' ? r.output_account_code : r.input_account_code;
}
