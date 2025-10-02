import { pool } from "../../lib/db";
import { ulid } from "ulid";
import { TaxPartnerUpsert, TaxTemplateUpsert, TaxBoxMapUpsert, TaxReturnRunRequest, TaxAdjustmentUpsert, TaxPartnerUpsertType, TaxTemplateUpsertType, TaxBoxMapUpsertType, TaxReturnRunRequestType, TaxAdjustmentUpsertType } from "@aibos/contracts";

// Tax Partner Management
export async function upsertTaxPartner(companyId: string, input: TaxPartnerUpsertType, updatedBy: string) {
    const validated = TaxPartnerUpsert.parse(input);

    await pool.query(
        `INSERT INTO tax_partner (company_id, code, name, frequency, base_ccy)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id, code) 
         DO UPDATE SET name = EXCLUDED.name, frequency = EXCLUDED.frequency, base_ccy = EXCLUDED.base_ccy`,
        [companyId, validated.code, validated.name, validated.frequency, validated.base_ccy]
    );

    return { code: validated.code };
}

export async function getTaxPartners(companyId: string) {
    const { rows } = await pool.query(
        `SELECT code, name, frequency, base_ccy FROM tax_partner WHERE company_id = $1 ORDER BY code`,
        [companyId]
    );
    return rows;
}

// Tax Template Management
export async function upsertTaxTemplate(companyId: string, input: TaxTemplateUpsertType, updatedBy: string) {
    const validated = TaxTemplateUpsert.parse(input);

    // Delete existing template boxes
    await pool.query(
        `DELETE FROM tax_return_template WHERE company_id = $1 AND partner_code = $2 AND version = $3`,
        [companyId, validated.partner_code, validated.version]
    );

    // Insert new boxes
    for (const box of validated.boxes) {
        await pool.query(
            `INSERT INTO tax_return_template (company_id, partner_code, version, box_id, box_label, sign, ordinal)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [companyId, validated.partner_code, validated.version, box.box_id, box.box_label, box.sign, box.ordinal]
        );
    }

    return { partner_code: validated.partner_code, version: validated.version };
}

export async function getTaxTemplate(companyId: string, partnerCode: string, version: string) {
    const { rows } = await pool.query(
        `SELECT box_id, box_label, sign, ordinal FROM tax_return_template 
         WHERE company_id = $1 AND partner_code = $2 AND version = $3 
         ORDER BY ordinal`,
        [companyId, partnerCode, version]
    );
    return rows;
}

// Tax Box Mapping Management
export async function upsertTaxBoxMap(companyId: string, input: TaxBoxMapUpsertType, updatedBy: string) {
    const validated = TaxBoxMapUpsert.parse(input);

    // Delete existing mapping rules
    await pool.query(
        `DELETE FROM tax_return_box_map WHERE company_id = $1 AND partner_code = $2 AND version = $3`,
        [companyId, validated.partner_code, validated.version]
    );

    // Insert new rules
    for (const rule of validated.rules) {
        const id = ulid();
        await pool.query(
            `INSERT INTO tax_return_box_map (id, company_id, partner_code, version, box_id, tax_code, direction, rate_name, account_like, cc_like, project_like, priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [id, companyId, validated.partner_code, validated.version, rule.box_id, rule.tax_code, rule.direction, rule.rate_name, rule.account_like, rule.cc_like, rule.project_like, rule.priority]
        );
    }

    return { partner_code: validated.partner_code, version: validated.version };
}

export async function getTaxBoxMap(companyId: string, partnerCode: string, version: string) {
    const { rows } = await pool.query(
        `SELECT box_id, tax_code, direction, rate_name, account_like, cc_like, project_like, priority 
         FROM tax_return_box_map 
         WHERE company_id = $1 AND partner_code = $2 AND version = $3 
         ORDER BY box_id, priority`,
        [companyId, partnerCode, version]
    );
    return rows;
}

// Tax Return Run (Core Builder)
export async function runTaxReturn(companyId: string, input: TaxReturnRunRequestType, actor: string) {
    const validated = TaxReturnRunRequest.parse(input);

    // Load template and mapping
    const template = await getTaxTemplate(companyId, validated.partner_code, validated.version);
    const boxMap = await getTaxBoxMap(companyId, validated.partner_code, validated.version);

    if (template.length === 0) {
        throw new Error(`No template found for ${validated.partner_code} version ${validated.version}`);
    }

    // Create run record
    const runId = ulid();
    const periodKey = `${validated.year}-${String(validated.month).padStart(2, "0")}`;

    await pool.query(
        `INSERT INTO tax_return_run (id, company_id, partner_code, version, year, month, period_key, mode, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [runId, companyId, validated.partner_code, validated.version, validated.year, validated.month, periodKey, validated.dry_run ? "dry_run" : "commit", actor]
    );

    // Build box totals from GL/tax data
    const boxTotals = new Map<string, number>();
    const details: any[] = [];

    for (const box of template) {
        boxTotals.set(box.box_id, 0);
    }

    // Extract tax data from journals (using existing tax engine tags)
    const { rows: taxRows } = await pool.query(
        `SELECT 
            jl.account_code,
            jl.cost_center_id,
            jl.project_id,
            jl.amount,
            j.id as journal_id
         FROM journal_line jl
         JOIN journal j ON j.id = jl.journal_id
         WHERE j.company_id = $1 
         AND j.posting_date >= $2 
         AND j.posting_date <= $3
         AND jl.account_code LIKE '2%'`, // Tax accounts (liability accounts)
        [
            companyId,
            new Date(Date.UTC(validated.year, validated.month - 1, 1)).toISOString().split('T')[0],
            new Date(Date.UTC(validated.year, validated.month, 0)).toISOString().split('T')[0]
        ]
    );

    // Apply mapping rules (simplified for now - map by account pattern)
    for (const taxRow of taxRows) {
        const matchingRules = boxMap.filter(rule => {
            if (rule.account_like && !taxRow.account_code.includes(rule.account_like.replace('%', ''))) return false;
            if (rule.cc_like && taxRow.cost_center_id && !taxRow.cost_center_id.includes(rule.cc_like.replace('%', ''))) return false;
            if (rule.project_like && taxRow.project_id && !taxRow.project_id.includes(rule.project_like.replace('%', ''))) return false;
            return true;
        });

        if (matchingRules.length > 0) {
            // Use highest priority rule
            const rule = matchingRules.sort((a, b) => a.priority - b.priority)[0];
            const templateBox = template.find(b => b.box_id === rule.box_id);

            if (templateBox) {
                const amount = Number(taxRow.amount);
                const sign = templateBox.sign === '+' ? 1 : -1;
                const contribution = amount * sign;

                boxTotals.set(rule.box_id, (boxTotals.get(rule.box_id) || 0) + contribution);

                if (validated.include_detail) {
                    details.push({
                        id: ulid(),
                        runId,
                        boxId: rule.box_id,
                        sourceRef: taxRow.journal_id,
                        amount: contribution
                    });
                }
            }
        }
    }

    // Apply manual adjustments
    const { rows: adjustments } = await pool.query(
        `SELECT box_id, amount FROM tax_return_adjustment 
         WHERE company_id = $1 AND partner_code = $2 AND year = $3 AND month = $4`,
        [companyId, validated.partner_code, validated.year, validated.month]
    );

    for (const adj of adjustments) {
        boxTotals.set(adj.box_id, (boxTotals.get(adj.box_id) || 0) + Number(adj.amount));
    }

    // Create return lines
    const lines: any[] = [];
    for (const [boxId, amount] of boxTotals) {
        if (Math.abs(amount) > 0.01) { // Only include non-zero amounts
            const lineId = ulid();
            lines.push({
                id: lineId,
                runId,
                boxId,
                amount: Number(amount.toFixed(2)),
                note: validated.memo
            });

            if (!validated.dry_run) {
                await pool.query(
                    `INSERT INTO tax_return_line (id, run_id, box_id, amount, note)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [lineId, runId, boxId, amount, validated.memo]
                );
            }
        }
    }

    // Insert details if requested
    if (validated.include_detail && details.length > 0) {
        for (const detail of details) {
            await pool.query(
                `INSERT INTO tax_return_detail (id, run_id, box_id, source_ref, amount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [detail.id, detail.runId, detail.boxId, detail.sourceRef, detail.amount]
            );
        }
    }

    // Create lock for commit runs
    if (!validated.dry_run) {
        await pool.query(
            `INSERT INTO tax_return_lock (company_id, partner_code, year, month)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [companyId, validated.partner_code, validated.year, validated.month]
        );
    }

    return {
        run_id: runId,
        lines: lines.length,
        boxes: Array.from(boxTotals.entries()).map(([boxId, amount]) => ({
            box_id: boxId,
            amount: Number(amount.toFixed(2))
        })),
        details: details.length
    };
}

// Tax Adjustments
export async function upsertTaxAdjustment(companyId: string, input: TaxAdjustmentUpsertType, actor: string) {
    const validated = TaxAdjustmentUpsert.parse(input);

    const id = ulid();
    await pool.query(
        `INSERT INTO tax_return_adjustment (id, company_id, partner_code, year, month, box_id, amount, memo, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (company_id, partner_code, year, month, box_id) 
         DO UPDATE SET amount = EXCLUDED.amount, memo = EXCLUDED.memo, created_by = EXCLUDED.created_by`,
        [id, companyId, validated.partner_code, validated.year, validated.month, validated.box_id, validated.amount, validated.memo, actor]
    );

    return { id };
}

export async function getTaxAdjustments(companyId: string, partnerCode: string, year: number, month: number) {
    const { rows } = await pool.query(
        `SELECT box_id, amount, memo, created_at, created_by FROM tax_return_adjustment 
         WHERE company_id = $1 AND partner_code = $2 AND year = $3 AND month = $4 
         ORDER BY created_at`,
        [companyId, partnerCode, year, month]
    );
    return rows;
}

// Tax Return History
export async function getTaxReturns(companyId: string, partnerCode?: string, year?: number, month?: number) {
    let sql = `SELECT id, partner_code, version, year, month, period_key, mode, created_at, created_by 
               FROM tax_return_run WHERE company_id = $1`;
    const params: any[] = [companyId];

    if (partnerCode) {
        sql += ` AND partner_code = $${params.length + 1}`;
        params.push(partnerCode);
    }
    if (year) {
        sql += ` AND year = $${params.length + 1}`;
        params.push(year);
    }
    if (month) {
        sql += ` AND month = $${params.length + 1}`;
        params.push(month);
    }

    sql += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(sql, params);
    return rows;
}

export async function getTaxReturnDetails(runId: string) {
    const { rows: runRows } = await pool.query(
        `SELECT * FROM tax_return_run WHERE id = $1`,
        [runId]
    );

    if (runRows.length === 0) {
        throw new Error("Tax return run not found");
    }

    const { rows: lineRows } = await pool.query(
        `SELECT box_id, amount, note FROM tax_return_line WHERE run_id = $1 ORDER BY box_id`,
        [runId]
    );

    const { rows: detailRows } = await pool.query(
        `SELECT COUNT(*) as detail_count FROM tax_return_detail WHERE run_id = $1`,
        [runId]
    );

    return {
        run: runRows[0],
        lines: lineRows,
        detail_count: Number(detailRows[0].detail_count)
    };
}
