import { pool } from "@/lib/db";
import { ulid } from "ulid";
import {
    ApprovalPolicyUpsertType,
    SupplierPolicyAssignType,
    SupplierLimitUpsertType,
    PayeeKycUpsertType,
    DenylistUpsertType,
    SanctionScreenRequestType,
    SanctionDecisionType,
    RunReviewType,
    RunApproveType,
    RunApprove2Type
} from "@aibos/contracts";

// --- M23.1 Dual-Control & KYC Interfaces -------------------------------------
export interface ApprovalPolicy {
    companyId: string;
    policyCode: string;
    minAmount: number;
    maxAmount?: number | undefined;
    currency?: string | undefined;
    requireReviewer: boolean;
    requireApprover: boolean;
    requireDualApprover: boolean;
    updatedAt: string;
    updatedBy: string;
}

export interface SupplierPolicy {
    companyId: string;
    supplierId: string;
    policyCode: string;
}

export interface SupplierLimit {
    companyId: string;
    supplierId: string;
    dayCap?: number | undefined;
    runCap?: number | undefined;
    yearCap?: number | undefined;
    updatedAt: string;
    updatedBy: string;
}

export interface PayeeKyc {
    companyId: string;
    supplierId: string;
    residency?: string;
    taxForm?: string;
    taxId?: string;
    docType?: string;
    docRef?: string;
    docExpires?: string;
    riskLevel?: string;
    onHold: boolean;
    notes?: string;
    updatedAt: string;
    updatedBy: string;
}

export interface SanctionHit {
    id: string;
    screenId: string;
    supplierId: string;
    nameNorm: string;
    matchScore: number;
    source: string;
    status: string;
    decidedBy?: string;
    decidedAt?: string;
    reason?: string;
}

export interface RunApproval {
    id: string;
    runId: string;
    step: string;
    actor: string;
    decidedAt: string;
    decision: string;
    reason?: string;
}

// --- Approval Policy Management (M23.1) --------------------------------------
export async function upsertApprovalPolicy(
    companyId: string,
    data: ApprovalPolicyUpsertType,
    updatedBy: string
): Promise<ApprovalPolicy> {
    await pool.query(`
        INSERT INTO ap_approval_policy (company_id, policy_code, min_amount, max_amount, currency, require_reviewer, require_approver, require_dual_approver, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (company_id, policy_code) 
        DO UPDATE SET min_amount = $3, max_amount = $4, currency = $5, require_reviewer = $6, require_approver = $7, require_dual_approver = $8, updated_by = $9, updated_at = now()
    `, [
        companyId, data.policy_code, data.min_amount, data.max_amount, data.currency,
        data.require_reviewer, data.require_approver, data.require_dual_approver, updatedBy
    ]);

    const result = await pool.query(`
        SELECT policy_code, min_amount, max_amount, currency, require_reviewer, require_approver, require_dual_approver, updated_at, updated_by
        FROM ap_approval_policy
        WHERE company_id = $1 AND policy_code = $2
    `, [companyId, data.policy_code]);

    return {
        companyId,
        policyCode: result.rows[0].policy_code,
        minAmount: Number(result.rows[0].min_amount),
        maxAmount: result.rows[0].max_amount ? Number(result.rows[0].max_amount) : undefined,
        currency: result.rows[0].currency,
        requireReviewer: result.rows[0].require_reviewer,
        requireApprover: result.rows[0].require_approver,
        requireDualApprover: result.rows[0].require_dual_approver,
        updatedAt: result.rows[0].updated_at.toISOString(),
        updatedBy: result.rows[0].updated_by
    };
}

export async function getApprovalPolicies(companyId: string): Promise<ApprovalPolicy[]> {
    const result = await pool.query(`
        SELECT policy_code, min_amount, max_amount, currency, require_reviewer, require_approver, require_dual_approver, updated_at, updated_by
        FROM ap_approval_policy
        WHERE company_id = $1
        ORDER BY policy_code
    `, [companyId]);

    return result.rows.map(row => ({
        companyId,
        policyCode: row.policy_code,
        minAmount: Number(row.min_amount),
        maxAmount: row.max_amount ? Number(row.max_amount) : undefined,
        currency: row.currency,
        requireReviewer: row.require_reviewer,
        requireApprover: row.require_approver,
        requireDualApprover: row.require_dual_approver,
        updatedAt: row.updated_at.toISOString(),
        updatedBy: row.updated_by
    }));
}

// --- Supplier Policy Assignment (M23.1) ---------------------------------------
export async function assignSupplierPolicy(
    companyId: string,
    data: SupplierPolicyAssignType
): Promise<SupplierPolicy> {
    await pool.query(`
        INSERT INTO ap_supplier_policy (company_id, supplier_id, policy_code)
        VALUES ($1, $2, $3)
        ON CONFLICT (company_id, supplier_id) 
        DO UPDATE SET policy_code = $3
    `, [companyId, data.supplier_id, data.policy_code]);

    return {
        companyId,
        supplierId: data.supplier_id,
        policyCode: data.policy_code
    };
}

export async function getSupplierPolicy(companyId: string, supplierId: string): Promise<SupplierPolicy | null> {
    const result = await pool.query(`
        SELECT supplier_id, policy_code
        FROM ap_supplier_policy
        WHERE company_id = $1 AND supplier_id = $2
    `, [companyId, supplierId]);

    if (result.rows.length === 0) {
        return null;
    }

    return {
        companyId,
        supplierId: result.rows[0].supplier_id,
        policyCode: result.rows[0].policy_code
    };
}

// --- Supplier Limits Management (M23.1) --------------------------------------
export async function upsertSupplierLimit(
    companyId: string,
    data: SupplierLimitUpsertType,
    updatedBy: string
): Promise<SupplierLimit> {
    await pool.query(`
        INSERT INTO ap_supplier_limit (company_id, supplier_id, day_cap, run_cap, year_cap, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (company_id, supplier_id) 
        DO UPDATE SET day_cap = $3, run_cap = $4, year_cap = $5, updated_by = $6, updated_at = now()
    `, [
        companyId, data.supplier_id, data.day_cap, data.run_cap, data.year_cap, updatedBy
    ]);

    const result = await pool.query(`
        SELECT supplier_id, day_cap, run_cap, year_cap, updated_at, updated_by
        FROM ap_supplier_limit
        WHERE company_id = $1 AND supplier_id = $2
    `, [companyId, data.supplier_id]);

    return {
        companyId,
        supplierId: result.rows[0].supplier_id,
        dayCap: result.rows[0].day_cap ? Number(result.rows[0].day_cap) : undefined,
        runCap: result.rows[0].run_cap ? Number(result.rows[0].run_cap) : undefined,
        yearCap: result.rows[0].year_cap ? Number(result.rows[0].year_cap) : undefined,
        updatedAt: result.rows[0].updated_at.toISOString(),
        updatedBy: result.rows[0].updated_by
    };
}

// --- KYC Dossier Management (M23.1) -------------------------------------------
export async function upsertPayeeKyc(
    companyId: string,
    data: PayeeKycUpsertType,
    updatedBy: string
): Promise<PayeeKyc> {
    await pool.query(`
        INSERT INTO ap_payee_kyc (company_id, supplier_id, residency, tax_form, tax_id, doc_type, doc_ref, doc_expires, risk_level, on_hold, notes, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (company_id, supplier_id) 
        DO UPDATE SET residency = $3, tax_form = $4, tax_id = $5, doc_type = $6, doc_ref = $7, doc_expires = $8, risk_level = $9, on_hold = $10, notes = $11, updated_by = $12, updated_at = now()
    `, [
        companyId, data.supplier_id, data.residency, data.tax_form, data.tax_id,
        data.doc_type, data.doc_ref, data.doc_expires, data.risk_level, data.on_hold || false, data.notes, updatedBy
    ]);

    const result = await pool.query(`
        SELECT supplier_id, residency, tax_form, tax_id, doc_type, doc_ref, doc_expires, risk_level, on_hold, notes, updated_at, updated_by
        FROM ap_payee_kyc
        WHERE company_id = $1 AND supplier_id = $2
    `, [companyId, data.supplier_id]);

    return {
        companyId,
        supplierId: result.rows[0].supplier_id,
        residency: result.rows[0].residency,
        taxForm: result.rows[0].tax_form,
        taxId: result.rows[0].tax_id,
        docType: result.rows[0].doc_type,
        docRef: result.rows[0].doc_ref,
        docExpires: result.rows[0].doc_expires,
        riskLevel: result.rows[0].risk_level,
        onHold: result.rows[0].on_hold,
        notes: result.rows[0].notes,
        updatedAt: result.rows[0].updated_at.toISOString(),
        updatedBy: result.rows[0].updated_by
    };
}

export async function getPayeeKyc(companyId: string, supplierId: string): Promise<PayeeKyc | null> {
    const result = await pool.query(`
        SELECT supplier_id, residency, tax_form, tax_id, doc_type, doc_ref, doc_expires, risk_level, on_hold, notes, updated_at, updated_by
        FROM ap_payee_kyc
        WHERE company_id = $1 AND supplier_id = $2
    `, [companyId, supplierId]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        companyId,
        supplierId: row.supplier_id,
        residency: row.residency,
        taxForm: row.tax_form,
        taxId: row.tax_id,
        docType: row.doc_type,
        docRef: row.doc_ref,
        docExpires: row.doc_expires,
        riskLevel: row.risk_level,
        onHold: row.on_hold,
        notes: row.notes,
        updatedAt: row.updated_at.toISOString(),
        updatedBy: row.updated_by
    };
}

// --- Sanctions Screening (M23.1) ---------------------------------------------
export async function upsertDenylist(
    companyId: string,
    data: DenylistUpsertType
): Promise<void> {
    const nameNorm = normalizeName(data.name);

    await pool.query(`
        INSERT INTO sanction_denylist (company_id, name_norm, country, source)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id, name_norm, COALESCE(country,'')) 
        DO UPDATE SET source = $4, listed_at = now()
    `, [companyId, nameNorm, data.country, data.source]);
}

export async function getDenylist(companyId: string): Promise<any[]> {
    const result = await pool.query(`
        SELECT name_norm, country, source, listed_at
        FROM sanction_denylist
        WHERE company_id = $1
        ORDER BY listed_at DESC
    `, [companyId]);

    return result.rows.map(row => ({
        nameNorm: row.name_norm,
        country: row.country,
        source: row.source,
        listedAt: row.listed_at.toISOString()
    }));
}

export async function runSanctionsScreen(
    companyId: string,
    data: SanctionScreenRequestType,
    createdBy: string
): Promise<{ screenId: string; hits: SanctionHit[] }> {
    const screenId = ulid();

    // Create screen run
    await pool.query(`
        INSERT INTO sanction_screen_run (id, company_id, run_id, supplier_id, created_by)
        VALUES ($1, $2, $3, $4, $5)
    `, [screenId, companyId, data.run_id, data.supplier_id, createdBy]);

    // Get suppliers to screen
    let suppliers: any[] = [];
    if (data.supplier_id) {
        const { rows } = await pool.query(`
            SELECT supplier_id FROM ap_supplier_bank WHERE company_id = $1 AND supplier_id = $2
        `, [companyId, data.supplier_id]);
        suppliers = rows;
    } else if (data.run_id) {
        const { rows } = await pool.query(`
            SELECT DISTINCT supplier_id FROM ap_pay_line WHERE run_id = $1
        `, [data.run_id]);
        suppliers = rows;
    }

    const hits: SanctionHit[] = [];

    // Screen each supplier
    for (const supplier of suppliers) {
        const supplierKyc = await getPayeeKyc(companyId, supplier.supplier_id);
        if (!supplierKyc) continue;

        const normalizedName = normalizeName(supplierKyc.supplierId);

        // Check local denylist
        const { rows: denylistRows } = await pool.query(`
            SELECT name_norm, country, source FROM sanction_denylist
            WHERE company_id = $1 AND name_norm = $2
        `, [companyId, normalizedName]);

        for (const denylistRow of denylistRows) {
            const hitId = ulid();
            await pool.query(`
                INSERT INTO sanction_hit (id, screen_id, supplier_id, name_norm, match_score, source, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [hitId, screenId, supplier.supplier_id, normalizedName, 1.0, denylistRow.source, 'potential']);

            hits.push({
                id: hitId,
                screenId,
                supplierId: supplier.supplier_id,
                nameNorm: normalizedName,
                matchScore: 1.0,
                source: denylistRow.source,
                status: 'potential'
            });
        }
    }

    return { screenId, hits };
}

export async function decideSanctionHit(
    companyId: string,
    data: SanctionDecisionType,
    decidedBy: string
): Promise<void> {
    await pool.query(`
        UPDATE sanction_hit 
        SET status = $1, decided_by = $2, decided_at = now(), reason = $3
        WHERE id = $4
    `, [data.decision, decidedBy, data.reason, data.hit_id]);
}

// --- Dual-Control Approval Workflow (M23.1) ----------------------------------
export async function reviewPayRun(
    companyId: string,
    data: RunReviewType,
    actor: string
): Promise<void> {
    // Check if already reviewed
    const { rows: gateRows } = await pool.query(`
        SELECT 1 FROM ap_run_gate WHERE company_id = $1 AND run_id = $2 AND gate = 'reviewed'
    `, [companyId, data.run_id]);

    if (gateRows.length > 0) {
        return; // Already reviewed
    }

    // Validate policy requirements
    await validatePolicyRequirements(companyId, data.run_id, 'review');

    // Record approval
    const approvalId = ulid();
    await pool.query(`
        INSERT INTO ap_run_approval (id, run_id, step, actor, decision, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [approvalId, data.run_id, 'review', actor, data.decision, data.reason]);

    if (data.decision === 'approve') {
        // Set gate
        await pool.query(`
            INSERT INTO ap_run_gate (company_id, run_id, gate)
            VALUES ($1, $2, $3)
        `, [companyId, data.run_id, 'reviewed']);
    } else {
        // Reject - update run status
        await pool.query(`
            UPDATE ap_pay_run SET status = 'cancelled' WHERE id = $1 AND company_id = $2
        `, [data.run_id, companyId]);
    }
}

export async function approvePayRun(
    companyId: string,
    data: RunApproveType,
    actor: string
): Promise<void> {
    // Check if reviewed
    const { rows: gateRows } = await pool.query(`
        SELECT 1 FROM ap_run_gate WHERE company_id = $1 AND run_id = $2 AND gate = 'reviewed'
    `, [companyId, data.run_id]);

    if (gateRows.length === 0) {
        throw new Error('Run must be reviewed before approval');
    }

    // Check if already approved
    const { rows: approvedRows } = await pool.query(`
        SELECT 1 FROM ap_run_gate WHERE company_id = $1 AND run_id = $2 AND gate = 'approved'
    `, [companyId, data.run_id]);

    if (approvedRows.length > 0) {
        return; // Already approved
    }

    // Validate policy requirements
    await validatePolicyRequirements(companyId, data.run_id, 'approve');

    // Check for pending sanctions hits
    await validateSanctionsClearance(companyId, data.run_id);

    // Record approval
    const approvalId = ulid();
    await pool.query(`
        INSERT INTO ap_run_approval (id, run_id, step, actor, decision, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [approvalId, data.run_id, 'approve', actor, data.decision, data.reason]);

    if (data.decision === 'approve') {
        // Set gate
        await pool.query(`
            INSERT INTO ap_run_gate (company_id, run_id, gate)
            VALUES ($1, $2, $3)
        `, [companyId, data.run_id, 'approved']);

        // Update run status
        await pool.query(`
            UPDATE ap_pay_run SET status = 'approved', approved_by = $1, approved_at = now()
            WHERE id = $2 AND company_id = $3
        `, [actor, data.run_id, companyId]);
    } else {
        // Reject - update run status
        await pool.query(`
            UPDATE ap_pay_run SET status = 'cancelled' WHERE id = $1 AND company_id = $2
        `, [data.run_id, companyId]);
    }
}

export async function approve2PayRun(
    companyId: string,
    data: RunApprove2Type,
    actor: string
): Promise<void> {
    // Check if approved
    const { rows: gateRows } = await pool.query(`
        SELECT 1 FROM ap_run_gate WHERE company_id = $1 AND run_id = $2 AND gate = 'approved'
    `, [companyId, data.run_id]);

    if (gateRows.length === 0) {
        throw new Error('Run must be approved before second approval');
    }

    // Check if already second approved
    const { rows: approved2Rows } = await pool.query(`
        SELECT 1 FROM ap_run_gate WHERE company_id = $1 AND run_id = $2 AND gate = 'approved2'
    `, [companyId, data.run_id]);

    if (approved2Rows.length > 0) {
        return; // Already second approved
    }

    // Record approval
    const approvalId = ulid();
    await pool.query(`
        INSERT INTO ap_run_approval (id, run_id, step, actor, decision, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [approvalId, data.run_id, 'approve2', actor, data.decision, data.reason]);

    if (data.decision === 'approve') {
        // Set gate
        await pool.query(`
            INSERT INTO ap_run_gate (company_id, run_id, gate)
            VALUES ($1, $2, $3)
        `, [companyId, data.run_id, 'approved2']);
    } else {
        // Reject - update run status
        await pool.query(`
            UPDATE ap_pay_run SET status = 'cancelled' WHERE id = $1 AND company_id = $2
        `, [data.run_id, companyId]);
    }
}

// --- Helper Functions (M23.1) ------------------------------------------------
function normalizeName(name: string): string {
    return name.toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function validatePolicyRequirements(
    companyId: string,
    runId: string,
    step: string
): Promise<void> {
    // Get run details
    const { rows: runRows } = await pool.query(`
        SELECT id, ccy, created_by FROM ap_pay_run WHERE id = $1 AND company_id = $2
    `, [runId, companyId]);

    if (runRows.length === 0) {
        throw new Error('Payment run not found');
    }

    const run = runRows[0];

    // Get run lines
    const { rows: lineRows } = await pool.query(`
        SELECT supplier_id, pay_amount FROM ap_pay_line WHERE run_id = $1
    `, [runId]);

    // Check each supplier's policy
    for (const line of lineRows) {
        const supplierPolicy = await getSupplierPolicy(companyId, line.supplier_id);
        const policyCode = supplierPolicy?.policyCode || 'DEFAULT';

        const { rows: policyRows } = await pool.query(`
            SELECT min_amount, max_amount, currency, require_reviewer, require_approver, require_dual_approver
            FROM ap_approval_policy
            WHERE company_id = $1 AND policy_code = $2
        `, [companyId, policyCode]);

        if (policyRows.length === 0) {
            throw new Error(`Policy not found: ${policyCode}`);
        }

        const policy = policyRows[0];
        const amount = Number(line.pay_amount);

        // Check amount limits
        if (amount < Number(policy.min_amount)) {
            throw new Error(`Amount ${amount} below minimum ${policy.min_amount} for policy ${policyCode}`);
        }

        if (policy.max_amount && amount > Number(policy.max_amount)) {
            throw new Error(`Amount ${amount} exceeds maximum ${policy.max_amount} for policy ${policyCode}`);
        }

        // Check currency
        if (policy.currency && policy.currency !== run.ccy) {
            throw new Error(`Currency ${run.ccy} not allowed for policy ${policyCode}`);
        }

        // Check KYC requirements
        const kyc = await getPayeeKyc(companyId, line.supplier_id);
        if (kyc?.onHold) {
            throw new Error(`Supplier ${line.supplier_id} is on hold`);
        }

        if (kyc?.docExpires && new Date(kyc.docExpires) <= new Date()) {
            throw new Error(`Supplier ${line.supplier_id} KYC document expired`);
        }

        // Check supplier limits
        await validateSupplierLimits(companyId, line.supplier_id, amount);
    }
}

async function validateSupplierLimits(
    companyId: string,
    supplierId: string,
    amount: number
): Promise<void> {
    const { rows: limitRows } = await pool.query(`
        SELECT day_cap, run_cap, year_cap FROM ap_supplier_limit
        WHERE company_id = $1 AND supplier_id = $2
    `, [companyId, supplierId]);

    if (limitRows.length === 0) {
        return; // No limits set
    }

    const limits = limitRows[0];

    // Check day cap
    if (limits.day_cap) {
        const { rows: dayRows } = await pool.query(`
            SELECT SUM(pay_amount) as total FROM ap_pay_line apl
            JOIN ap_pay_run apr ON apl.run_id = apr.id
            WHERE apr.company_id = $1 AND apl.supplier_id = $2 AND apr.created_at >= CURRENT_DATE
        `, [companyId, supplierId]);

        const dayTotal = Number(dayRows[0].total) || 0;
        if (dayTotal + amount > Number(limits.day_cap)) {
            throw new Error(`Day cap exceeded: ${dayTotal + amount} > ${limits.day_cap}`);
        }
    }

    // Check run cap
    if (limits.run_cap && amount > Number(limits.run_cap)) {
        throw new Error(`Run cap exceeded: ${amount} > ${limits.run_cap}`);
    }

    // Check year cap
    if (limits.year_cap) {
        const { rows: yearRows } = await pool.query(`
            SELECT SUM(pay_amount) as total FROM ap_pay_line apl
            JOIN ap_pay_run apr ON apl.run_id = apr.id
            WHERE apr.company_id = $1 AND apl.supplier_id = $2 AND apr.year = EXTRACT(YEAR FROM CURRENT_DATE)
        `, [companyId, supplierId]);

        const yearTotal = Number(yearRows[0].total) || 0;
        if (yearTotal + amount > Number(limits.year_cap)) {
            throw new Error(`Year cap exceeded: ${yearTotal + amount} > ${limits.year_cap}`);
        }
    }
}

async function validateSanctionsClearance(
    companyId: string,
    runId: string
): Promise<void> {
    const { rows: hitRows } = await pool.query(`
        SELECT COUNT(*) as count FROM sanction_hit sh
        JOIN sanction_screen_run ssr ON sh.screen_id = ssr.id
        WHERE ssr.company_id = $1 AND ssr.run_id = $2 AND sh.status = 'potential'
    `, [companyId, runId]);

    if (Number(hitRows[0].count) > 0) {
        throw new Error('Pending sanctions hits must be resolved before approval');
    }
}
