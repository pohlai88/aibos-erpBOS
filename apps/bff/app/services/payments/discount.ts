import { pool } from "@/lib/db";
import { ulid } from "ulid";
import {
    DiscountPolicyUpsertType,
    DiscountScanReqType,
    DiscountRunReqType,
    OfferCreateReqType,
    OfferDecisionReqType,
    DiscountPolicyType,
    DiscountRunType,
    DiscountLineType,
    DiscountOfferType
} from "@aibos/contracts";

// --- M23.3 Early-Payment Discounts & Dynamic Discounting ----------------------

// --- Interfaces ---

export interface DiscountPolicy {
    companyId: string;
    hurdleApy: number;
    minSavingsAmt: number;
    minSavingsPct: number;
    liquidityBuffer: number;
    postingMode: "REDUCE_EXPENSE" | "OTHER_INCOME";
    postingAccount?: string;
    maxTenorDays: number;
    updatedAt: string;
    updatedBy: string;
}

export interface DiscountRun {
    id: string;
    companyId: string;
    presentCcy?: string;
    status: "dry_run" | "committed";
    windowFrom: string;
    windowTo: string;
    cashCap?: number;
    createdBy: string;
    createdAt: string;
    lines?: DiscountLine[];
}

export interface DiscountLine {
    id: string;
    runId: string;
    invoiceId: string;
    supplierId: string;
    invCcy: string;
    payCcy: string;
    baseAmount: number;
    discountAmt: number;
    earlyPayAmt: number;
    apr: number;
    payByDate: string;
    selected: boolean;
}

export interface DiscountOffer {
    id: string;
    companyId: string;
    supplierId: string;
    invoiceId: string;
    offerPct: number;
    payByDate: string;
    status: "proposed" | "accepted" | "declined" | "expired";
    token: string;
    createdAt: string;
    createdBy: string;
    decidedAt?: string;
    decidedBy?: string;
}

// --- Policy Management ---

export async function getDiscountPolicy(companyId: string): Promise<DiscountPolicy | null> {
    const { rows } = await pool.query(`
    SELECT company_id, hurdle_apy, min_savings_amt, min_savings_pct, liquidity_buffer,
           posting_mode, posting_account, max_tenor_days, updated_at, updated_by
    FROM ap_discount_policy
    WHERE company_id = $1
  `, [companyId]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        companyId: row.company_id,
        hurdleApy: parseFloat(row.hurdle_apy),
        minSavingsAmt: parseFloat(row.min_savings_amt),
        minSavingsPct: parseFloat(row.min_savings_pct),
        liquidityBuffer: parseFloat(row.liquidity_buffer),
        postingMode: row.posting_mode,
        postingAccount: row.posting_account,
        maxTenorDays: row.max_tenor_days,
        updatedAt: row.updated_at.toISOString(),
        updatedBy: row.updated_by
    };
}

export async function upsertDiscountPolicy(
    companyId: string,
    data: DiscountPolicyUpsertType,
    updatedBy: string
): Promise<DiscountPolicy> {
    const { rows } = await pool.query(`
    INSERT INTO ap_discount_policy(company_id, hurdle_apy, min_savings_amt, min_savings_pct, liquidity_buffer, posting_mode, posting_account, max_tenor_days, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (company_id) DO UPDATE SET
      hurdle_apy = EXCLUDED.hurdle_apy,
      min_savings_amt = EXCLUDED.min_savings_amt,
      min_savings_pct = EXCLUDED.min_savings_pct,
      liquidity_buffer = EXCLUDED.liquidity_buffer,
      posting_mode = EXCLUDED.posting_mode,
      posting_account = EXCLUDED.posting_account,
      max_tenor_days = EXCLUDED.max_tenor_days,
      updated_at = now(),
      updated_by = EXCLUDED.updated_by
    RETURNING *
  `, [
        companyId,
        data.hurdle_apy,
        data.min_savings_amt,
        data.min_savings_pct,
        data.liquidity_buffer,
        data.posting_mode,
        data.posting_account || null,
        data.max_tenor_days,
        updatedBy
    ]);

    const row = rows[0];
    return {
        companyId: row.company_id,
        hurdleApy: parseFloat(row.hurdle_apy),
        minSavingsAmt: parseFloat(row.min_savings_amt),
        minSavingsPct: parseFloat(row.min_savings_pct),
        liquidityBuffer: parseFloat(row.liquidity_buffer),
        postingMode: row.posting_mode,
        postingAccount: row.posting_account,
        maxTenorDays: row.max_tenor_days,
        updatedAt: row.updated_at.toISOString(),
        updatedBy: row.updated_by
    };
}

// --- Terms Detection & APR Calculation ---

/**
 * Parse standard payment terms (e.g., "2/10, net 30")
 * Returns { discount_pct, discount_days, net_days }
 */
export function parsePaymentTerms(termsText: string): { discount_pct: number; discount_days: number; net_days: number } | null {
    // Match patterns like "2/10, net 30" or "2/10 net 30"
    const match = termsText.match(/(\d+(?:\.\d+)?)\/(\d+)[\s,]*net\s*(\d+)/i);
    if (!match) return null;

    return {
        discount_pct: parseFloat(match[1]!) / 100,  // Convert 2 to 0.02
        discount_days: parseInt(match[2]!),
        net_days: parseInt(match[3]!)
    };
}

/**
 * Calculate APR (Annualized Percentage Rate) for early payment discount
 * Formula: APR = (discount_pct / (1 - discount_pct)) * (360 / (net_days - discount_days))
 */
export function calculateAPR(discountPct: number, discountDays: number, netDays: number): number {
    if (netDays <= discountDays) return 0;
    return (discountPct / (1 - discountPct)) * (360 / (netDays - discountDays));
}

// --- Candidate Scanning ---

export async function scanDiscountCandidates(
    companyId: string,
    data: DiscountScanReqType,
    createdBy: string
): Promise<DiscountRun> {
    const policy = await getDiscountPolicy(companyId);
    if (!policy) {
        throw new Error("No discount policy configured for company");
    }

    // Get eligible invoices with discount terms
    const { rows: invoices } = await pool.query(`
    SELECT id, supplier_id, gross_amount, disc_amount, ccy, discount_pct, discount_days, net_days, discount_due_date
    FROM ap_invoice
    WHERE company_id = $1 
      AND status = 'OPEN'
      AND discount_pct IS NOT NULL
      AND discount_due_date >= $2
      AND discount_due_date <= $3
    ORDER BY discount_due_date
  `, [companyId, data.window_from, data.window_to]);

    // Create run
    const runId = ulid();
    await pool.query(`
    INSERT INTO ap_discount_run(id, company_id, present_ccy, status, window_from, window_to, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [runId, companyId, data.present || null, "dry_run", data.window_from, data.window_to, createdBy]);

    // Process each invoice and create discount lines
    for (const inv of invoices) {
        const discountPct = parseFloat(inv.discount_pct);
        const discountDays = inv.discount_days;
        const netDays = inv.net_days;
        const grossAmount = parseFloat(inv.gross_amount);

        // Skip if required fields are missing
        if (!discountPct || !discountDays || !netDays) continue;

        // Calculate APR
        const apr = calculateAPR(discountPct, discountDays, netDays);

        // Check if meets hurdle rate
        if (apr < policy.hurdleApy) continue;

        // Calculate discount amount
        const discountAmt = grossAmount * discountPct;
        const earlyPayAmt = grossAmount - discountAmt;

        // Check minimum savings thresholds
        if (discountAmt < policy.minSavingsAmt) continue;
        if (discountAmt / grossAmount < policy.minSavingsPct) continue;

        // Check max tenor
        const tenorDays = netDays - discountDays;
        if (tenorDays > policy.maxTenorDays) continue;

        // Create discount line
        const lineId = ulid();
        await pool.query(`
      INSERT INTO ap_discount_line(id, run_id, invoice_id, supplier_id, inv_ccy, pay_ccy, base_amount, discount_amt, early_pay_amt, apr, pay_by_date, selected)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
            lineId,
            runId,
            inv.id,
            inv.supplier_id,
            inv.ccy,
            inv.ccy,  // TODO: FX conversion if present currency different
            grossAmount,
            discountAmt,
            earlyPayAmt,
            apr,
            inv.discount_due_date,
            false  // Not selected yet
        ]);
    }

    return getDiscountRun(companyId, runId);
}

// --- Optimizer (Greedy by APR with Cash Cap) ---

export async function optimizeAndCommitDiscountRun(
    companyId: string,
    data: DiscountRunReqType,
    createdBy: string
): Promise<DiscountRun> {
    const policy = await getDiscountPolicy(companyId);
    if (!policy) {
        throw new Error("No discount policy configured for company");
    }

    // Check if we need to create a new run or use existing
    let runId: string;
    let run: DiscountRun;

    // For simplicity, always create new run (can optimize to reuse existing dry_run)
    run = await scanDiscountCandidates(companyId, {
        window_from: data.window_from,
        window_to: data.window_to,
        present: data.present
    }, createdBy);
    runId = run.id;

    // Get available cash (TODO: integrate with M22 liquidity)
    const availableCash = data.cash_cap || 1000000000;  // Default to very high if no cap

    // Apply liquidity buffer
    const effectiveCap = availableCash - policy.liquidityBuffer;

    // Get all lines sorted by APR descending
    const { rows: lines } = await pool.query(`
    SELECT id, early_pay_amt, apr
    FROM ap_discount_line
    WHERE run_id = $1
    ORDER BY apr DESC
  `, [runId]);

    // Greedy selection until cash cap hit
    let totalSpent = 0;
    const selectedIds: string[] = [];

    for (const line of lines) {
        const earlyPayAmt = parseFloat(line.early_pay_amt);
        if (totalSpent + earlyPayAmt <= effectiveCap) {
            selectedIds.push(line.id);
            totalSpent += earlyPayAmt;
        }
    }

    // Mark selected lines
    if (selectedIds.length > 0) {
        await pool.query(`
      UPDATE ap_discount_line
      SET selected = true
      WHERE id = ANY($1)
    `, [selectedIds]);
    }

    // Update run with cash cap
    await pool.query(`
    UPDATE ap_discount_run
    SET cash_cap = $1
    WHERE id = $2
  `, [data.cash_cap || null, runId]);

    // If not dry run, commit
    if (!data.dry_run) {
        await commitDiscountRun(companyId, runId, createdBy);
    }

    return getDiscountRun(companyId, runId);
}

async function commitDiscountRun(companyId: string, runId: string, createdBy: string): Promise<void> {
    // Update run status
    await pool.query(`
    UPDATE ap_discount_run
    SET status = 'committed'
    WHERE id = $1 AND company_id = $2
  `, [runId, companyId]);

    // Get selected lines
    const { rows: lines } = await pool.query(`
    SELECT invoice_id, supplier_id, early_pay_amt, pay_by_date, inv_ccy
    FROM ap_discount_line
    WHERE run_id = $1 AND selected = true
  `, [runId]);

    if (lines.length === 0) return;

    // Create or update payment run for early payment
    // For simplicity, create a dedicated discount payment run
    const payRunId = ulid();
    const firstPayDate = new Date(lines[0].pay_by_date);

    await pool.query(`
    INSERT INTO ap_pay_run(id, company_id, year, month, status, ccy, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
        payRunId,
        companyId,
        firstPayDate.getFullYear(),
        firstPayDate.getMonth() + 1,
        "draft",
        lines[0].inv_ccy,
        createdBy
    ]);

    // Add lines to payment run
    for (const line of lines) {
        const payLineId = ulid();
        await pool.query(`
      INSERT INTO ap_pay_line(id, run_id, supplier_id, invoice_id, due_date, gross_amount, disc_amount, pay_amount, inv_ccy, pay_ccy, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
            payLineId,
            payRunId,
            line.supplier_id,
            line.invoice_id,
            line.pay_by_date,
            parseFloat(line.early_pay_amt),
            0,
            parseFloat(line.early_pay_amt),
            line.inv_ccy,
            line.inv_ccy,
            "selected"
        ]);
    }
}

// --- Get Runs ---

export async function getDiscountRun(companyId: string, runId: string): Promise<DiscountRun> {
    const { rows: runRows } = await pool.query(`
    SELECT id, company_id, present_ccy, status, window_from, window_to, cash_cap, created_by, created_at
    FROM ap_discount_run
    WHERE id = $1 AND company_id = $2
  `, [runId, companyId]);

    if (runRows.length === 0) {
        throw new Error("Discount run not found");
    }

    const row = runRows[0];

    // Get lines
    const { rows: lineRows } = await pool.query(`
    SELECT id, run_id, invoice_id, supplier_id, inv_ccy, pay_ccy, base_amount, discount_amt, early_pay_amt, apr, pay_by_date, selected
    FROM ap_discount_line
    WHERE run_id = $1
    ORDER BY apr DESC
  `, [runId]);

    const lines: DiscountLine[] = lineRows.map(l => ({
        id: l.id,
        runId: l.run_id,
        invoiceId: l.invoice_id,
        supplierId: l.supplier_id,
        invCcy: l.inv_ccy,
        payCcy: l.pay_ccy,
        baseAmount: parseFloat(l.base_amount),
        discountAmt: parseFloat(l.discount_amt),
        earlyPayAmt: parseFloat(l.early_pay_amt),
        apr: parseFloat(l.apr),
        payByDate: l.pay_by_date.toISOString().split('T')[0],
        selected: l.selected
    }));

    return {
        id: row.id,
        companyId: row.company_id,
        presentCcy: row.present_ccy,
        status: row.status,
        windowFrom: row.window_from.toISOString().split('T')[0],
        windowTo: row.window_to.toISOString().split('T')[0],
        cashCap: row.cash_cap ? parseFloat(row.cash_cap) : undefined,
        createdBy: row.created_by,
        createdAt: row.created_at.toISOString(),
        lines
    } as DiscountRun;
}

export async function listDiscountRuns(companyId: string, status?: string): Promise<DiscountRun[]> {
    let query = `
    SELECT id, company_id, present_ccy, status, window_from, window_to, cash_cap, created_by, created_at
    FROM ap_discount_run
    WHERE company_id = $1
  `;
    const params: any[] = [companyId];

    if (status) {
        query += ` AND status = $2`;
        params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, params);

    return rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        presentCcy: row.present_ccy,
        status: row.status,
        windowFrom: row.window_from.toISOString().split('T')[0],
        windowTo: row.window_to.toISOString().split('T')[0],
        cashCap: row.cash_cap ? parseFloat(row.cash_cap) : undefined,
        createdBy: row.created_by,
        createdAt: row.created_at.toISOString()
    } as DiscountRun));
}

// --- Dynamic Offers ---

export async function createDiscountOffer(
    companyId: string,
    data: OfferCreateReqType,
    createdBy: string
): Promise<DiscountOffer> {
    const offerId = ulid();
    const token = ulid();  // Simple token generation

    const { rows } = await pool.query(`
    INSERT INTO ap_discount_offer(id, company_id, supplier_id, invoice_id, offer_pct, pay_by_date, status, token, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
        offerId,
        companyId,
        data.supplier_id,
        data.invoice_id,
        data.offer_pct,
        data.pay_by_date,
        "proposed",
        token,
        createdBy
    ]);

    const row = rows[0];

    // TODO: Send offer via dispatcher (email/webhook)

    return {
        id: row.id,
        companyId: row.company_id,
        supplierId: row.supplier_id,
        invoiceId: row.invoice_id,
        offerPct: parseFloat(row.offer_pct),
        payByDate: row.pay_by_date.toISOString().split('T')[0],
        status: row.status,
        token: row.token,
        createdAt: row.created_at.toISOString(),
        createdBy: row.created_by
    };
}

export async function decideDiscountOffer(
    data: OfferDecisionReqType,
    decidedBy?: string
): Promise<DiscountOffer> {
    // Find offer by token
    const { rows: offerRows } = await pool.query(`
    SELECT * FROM ap_discount_offer WHERE token = $1 AND status = 'proposed'
  `, [data.token]);

    if (offerRows.length === 0) {
        throw new Error("Offer not found or already decided");
    }

    const offer = offerRows[0];

    // Update status
    await pool.query(`
    UPDATE ap_discount_offer
    SET status = $1, decided_at = now(), decided_by = $2
    WHERE id = $3
  `, [data.decision, decidedBy || "supplier", offer.id]);

    // If accepted, update invoice terms for next scan
    if (data.decision === "accepted") {
        const offerPct = parseFloat(offer.offer_pct);
        // Calculate discount_days as some reasonable window (e.g., 7 days from now)
        const discountDays = 7;
        const netDays = 30;  // Default

        await pool.query(`
      UPDATE ap_invoice
      SET discount_pct = $1, discount_days = $2, net_days = $3, discount_due_date = $4
      WHERE id = $5
    `, [offerPct, discountDays, netDays, offer.pay_by_date, offer.invoice_id]);
    }

    // Return updated offer
    const { rows } = await pool.query(`
    SELECT * FROM ap_discount_offer WHERE id = $1
  `, [offer.id]);

    const row = rows[0];
    return {
        id: row.id,
        companyId: row.company_id,
        supplierId: row.supplier_id,
        invoiceId: row.invoice_id,
        offerPct: parseFloat(row.offer_pct),
        payByDate: row.pay_by_date.toISOString().split('T')[0],
        status: row.status,
        token: row.token,
        createdAt: row.created_at.toISOString(),
        createdBy: row.created_by,
        decidedAt: row.decided_at?.toISOString(),
        decidedBy: row.decided_by
    };
}

// --- Posting ---

export async function postDiscountSavings(
    companyId: string,
    runId: string,
    postedBy: string
): Promise<void> {
    const policy = await getDiscountPolicy(companyId);
    if (!policy) {
        throw new Error("No discount policy configured");
    }

    // Get total savings from selected lines
    const { rows } = await pool.query(`
    SELECT SUM(discount_amt) as total_savings
    FROM ap_discount_line
    WHERE run_id = $1 AND selected = true
  `, [runId]);

    const totalSavings = parseFloat(rows[0].total_savings || 0);
    if (totalSavings === 0) return;

    // Create journal entry (simplified - would integrate with actual posting service)
    const journalId = ulid();

    // TODO: Create actual journal entry based on posting_mode
    // REDUCE_EXPENSE: Credit original expense account
    // OTHER_INCOME: Credit posting_account (e.g., "4905-DISCOUNT-INCOME")

    // Record posting
    await pool.query(`
    INSERT INTO ap_discount_post(id, company_id, run_id, total_savings, journal_id, posted_at, posted_by)
    VALUES ($1, $2, $3, $4, $5, now(), $6)
  `, [ulid(), companyId, runId, totalSavings, journalId, postedBy]);
}

