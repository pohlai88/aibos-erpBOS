import { pool } from './db';

export async function ensureDimValid(
  dimId: string | null,
  dimType: 'cost_center' | 'project'
): Promise<void> {
  if (!dimId) return; // null is allowed

  const table = dimType === 'cost_center' ? 'dim_cost_center' : 'dim_project';
  const { rows } = await pool.query(
    `select id from ${table} where id = $1 and active = true`,
    [dimId]
  );

  if (rows.length === 0) {
    throw new Error(`${dimType} ${dimId} not found or inactive`);
  }
}

export async function ensureDimsMeetAccountPolicy(
  accountCode: string,
  companyId: string,
  dims: { cc: string | null; pr: string | null }
): Promise<void> {
  const { rows } = await pool.query(
    `select require_cost_center, require_project from account 
         where code = $1 and company_id = $2`,
    [accountCode, companyId]
  );

  if (rows.length === 0) {
    throw new Error(`Account ${accountCode} not found`);
  }

  const policy = rows[0];

  if (policy.require_cost_center && !dims.cc) {
    throw new Error(`cost_center required for account ${accountCode}`);
  }

  if (policy.require_project && !dims.pr) {
    throw new Error(`project required for account ${accountCode}`);
  }
}
