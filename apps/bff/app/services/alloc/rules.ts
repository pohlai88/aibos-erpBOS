import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { AllocRuleUpsertType, AllocDriverUpsertType, AllocRuleUpsert, AllocDriverUpsert } from "@aibos/contracts";

export interface AllocRule {
    id: string;
    companyId: string;
    code: string;
    name: string;
    active: boolean;
    method: 'PERCENT' | 'RATE_PER_UNIT' | 'DRIVER_SHARE';
    driverCode?: string;
    ratePerUnit?: number;
    srcAccount?: string;
    srcCcLike?: string;
    srcProject?: string;
    effFrom?: string;
    effTo?: string;
    orderNo: number;
    updatedAt: string;
    updatedBy: string;
}

export interface AllocRuleTarget {
    ruleId: string;
    targetCc: string;
    percent: number;
}

export interface AllocDriverValue {
    companyId: string;
    driverCode: string;
    year: number;
    month: number;
    costCenter?: string;
    project?: string;
    value: number;
    updatedAt: string;
    updatedBy: string;
}

export async function upsertAllocRule(
    companyId: string,
    actor: string,
    input: AllocRuleUpsertType
): Promise<{ id: string }> {
    // Validate input with Zod
    const validatedInput = AllocRuleUpsert.parse(input);

    const ruleId = validatedInput.id || ulid();

    await pool.query(`
    INSERT INTO alloc_rule (
      id, company_id, code, name, active, method, driver_code, rate_per_unit,
      src_account, src_cc_like, src_project, eff_from, eff_to, order_no, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      name = EXCLUDED.name,
      active = EXCLUDED.active,
      method = EXCLUDED.method,
      driver_code = EXCLUDED.driver_code,
      rate_per_unit = EXCLUDED.rate_per_unit,
      src_account = EXCLUDED.src_account,
      src_cc_like = EXCLUDED.src_cc_like,
      src_project = EXCLUDED.src_project,
      eff_from = EXCLUDED.eff_from,
      eff_to = EXCLUDED.eff_to,
      order_no = EXCLUDED.order_no,
      updated_at = now(),
      updated_by = EXCLUDED.updated_by
  `, [
        ruleId, companyId, validatedInput.code, validatedInput.name, validatedInput.active, validatedInput.method,
        validatedInput.driver_code, validatedInput.rate_per_unit, validatedInput.src_account, validatedInput.src_cc_like,
        validatedInput.src_project, validatedInput.eff_from, validatedInput.eff_to, validatedInput.order_no, actor
    ]);

    // Handle targets for PERCENT method
    if (validatedInput.method === 'PERCENT' && validatedInput.targets) {
        // Delete existing targets
        await pool.query('DELETE FROM alloc_rule_target WHERE rule_id = $1', [ruleId]);

        // Insert new targets
        for (const target of validatedInput.targets) {
            await pool.query(`
        INSERT INTO alloc_rule_target (rule_id, target_cc, percent)
        VALUES ($1, $2, $3)
      `, [ruleId, target.target_cc, target.percent]);
        }
    }

    return { id: ruleId };
}

export async function getActiveAllocRules(
    companyId: string,
    year: number,
    month: number
): Promise<AllocRule[]> {
    const { rows } = await pool.query(`
    SELECT * FROM alloc_rule 
    WHERE company_id = $1 
      AND active = true 
      AND (eff_from IS NULL OR eff_from <= $2)
      AND (eff_to IS NULL OR eff_to >= $2)
    ORDER BY order_no, code
  `, [companyId, `${year}-${month.toString().padStart(2, '0')}-01`]);

    return rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        code: row.code,
        name: row.name,
        active: row.active,
        method: row.method,
        driverCode: row.driver_code,
        ...(row.rate_per_unit && { ratePerUnit: Number(row.rate_per_unit) }),
        srcAccount: row.src_account,
        srcCcLike: row.src_cc_like,
        srcProject: row.src_project,
        effFrom: row.eff_from,
        effTo: row.eff_to,
        orderNo: row.order_no,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
    }));
}

export async function getAllocRuleTargets(ruleId: string): Promise<AllocRuleTarget[]> {
    const { rows } = await pool.query(`
    SELECT * FROM alloc_rule_target WHERE rule_id = $1
  `, [ruleId]);

    return rows.map(row => ({
        ruleId: row.rule_id,
        targetCc: row.target_cc,
        percent: Number(row.percent)
    }));
}

export async function upsertAllocDriverValues(
    companyId: string,
    actor: string,
    input: AllocDriverUpsertType
): Promise<{ rowsInserted: number }> {
    // Validate input with Zod
    const validatedInput = AllocDriverUpsert.parse(input);

    let rowsInserted = 0;

    for (const row of validatedInput.rows) {
        await pool.query(`
      INSERT INTO alloc_driver_value (
        company_id, driver_code, year, month, cost_center, project, value, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (company_id, driver_code, year, month, cost_center, project)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = now(),
        updated_by = EXCLUDED.updated_by
    `, [
            companyId, validatedInput.driver_code, validatedInput.year, validatedInput.month,
            row.cost_center, row.project, row.value, actor
        ]);
        rowsInserted++;
    }

    return { rowsInserted };
}

export async function getAllocDriverValues(
    companyId: string,
    driverCode: string,
    year: number,
    month: number
): Promise<AllocDriverValue[]> {
    const { rows } = await pool.query(`
    SELECT * FROM alloc_driver_value 
    WHERE company_id = $1 AND driver_code = $2 AND year = $3 AND month = $4
  `, [companyId, driverCode, year, month]);

    return rows.map(row => ({
        companyId: row.company_id,
        driverCode: row.driver_code,
        year: row.year,
        month: row.month,
        costCenter: row.cost_center,
        project: row.project,
        value: Number(row.value),
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
    }));
}

export async function deleteAllocRule(ruleId: string): Promise<void> {
    await pool.query('DELETE FROM alloc_rule WHERE id = $1', [ruleId]);
}
