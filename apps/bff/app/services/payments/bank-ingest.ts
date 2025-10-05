import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { createHash } from "crypto";
import { BankFileImportType } from "@aibos/contracts";

// --- Bank Ingestion Interfaces (M23) ----------------------------------------
export interface BankFileImport {
    id: string;
    companyId: string;
    kind: string;
    filename: string;
    payload: string;
    importedAt: string;
    uniqHash: string;
}

export interface BankTxnMap {
    id: string;
    companyId: string;
    bankDate: string;
    amount: number;
    ccy: string;
    counterparty?: string;
    memo?: string;
    matchedRunId?: string;
    matchedLineId?: string;
    status: string;
    createdAt: string;
}

export interface BankImportResult {
    success: boolean;
    transactionsImported: number;
    transactionsMatched: number;
    transactionsUnmatched: number;
    runsUpdated: number;
    errors: string[];
}

// --- Bank File Import (M23) -------------------------------------------------
export async function importBankFile(
    companyId: string,
    data: BankFileImportType,
    importedBy: string
): Promise<BankImportResult> {
    const importId = ulid();
    const uniqHash = createHash('sha256').update(data.payload).digest('hex');
    const errors: string[] = [];

    try {
        // Check for duplicate import
        const { rows: existingRows } = await pool.query(`
            SELECT id FROM bank_file_import 
            WHERE company_id = $1 AND uniq_hash = $2
        `, [companyId, uniqHash]);

        if (existingRows.length > 0) {
            return {
                success: false,
                transactionsImported: 0,
                transactionsMatched: 0,
                transactionsUnmatched: 0,
                runsUpdated: 0,
                errors: ['File already imported']
            };
        }

        // Save import record
        await pool.query(`
            INSERT INTO bank_file_import (id, company_id, kind, filename, payload, uniq_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [importId, companyId, data.kind, data.filename, data.payload, uniqHash]);

        // Parse bank file based on type
        let transactions: any[] = [];
        if (data.kind === 'CAMT053') {
            transactions = parseCamt053Xml(data.payload);
        } else if (data.kind === 'CSV') {
            transactions = parseCsvBankFile(data.payload);
        } else {
            throw new Error(`Unsupported bank file format: ${data.kind}`);
        }

        // Import transactions
        let transactionsImported = 0;
        for (const txn of transactions) {
            try {
                const txnId = ulid();
                await pool.query(`
                    INSERT INTO bank_txn_map (id, company_id, bank_date, amount, ccy, counterparty, memo, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    txnId, companyId, txn.date, txn.amount, txn.ccy,
                    txn.counterparty, txn.memo, 'unmatched'
                ]);
                transactionsImported++;
            } catch (error) {
                errors.push(`Transaction import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        // Match transactions to payment runs
        const matchResult = await matchTransactionsToRuns(companyId);

        return {
            success: errors.length === 0,
            transactionsImported,
            transactionsMatched: matchResult.matched,
            transactionsUnmatched: matchResult.unmatched,
            runsUpdated: matchResult.runsUpdated,
            errors
        };

    } catch (error) {
        errors.push(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        return {
            success: false,
            transactionsImported: 0,
            transactionsMatched: 0,
            transactionsUnmatched: 0,
            runsUpdated: 0,
            errors
        };
    }
}

// --- Transaction Matching (M23) ----------------------------------------------
async function matchTransactionsToRuns(companyId: string): Promise<{
    matched: number;
    unmatched: number;
    runsUpdated: number;
}> {
    // Get unmatched transactions
    const { rows: txnRows } = await pool.query(`
        SELECT id, bank_date, amount, ccy, counterparty, memo
        FROM bank_txn_map
        WHERE company_id = $1 AND status = 'unmatched'
        ORDER BY bank_date DESC
    `, [companyId]);

    let matched = 0;
    let unmatched = 0;
    const updatedRuns = new Set<string>();

    for (const txn of txnRows) {
        // Try to match with payment lines
        const { rows: lineRows } = await pool.query(`
            SELECT pl.id, pl.run_id, pl.pay_amount, pl.pay_ccy, pl.bank_ref, pr.status
            FROM ap_pay_line pl
            JOIN ap_pay_run pr ON pl.run_id = pr.id
            WHERE pr.company_id = $1 
            AND pl.pay_amount = $2 
            AND pl.pay_ccy = $3
            AND pl.status = 'selected'
            AND pr.status IN ('exported', 'executed')
        `, [companyId, Math.abs(txn.amount), txn.ccy]);

        if (lineRows.length > 0) {
            // Found match - use first one
            const line = lineRows[0];

            await pool.query(`
                UPDATE bank_txn_map 
                SET matched_run_id = $1, matched_line_id = $2, status = 'matched'
                WHERE id = $3
            `, [line.run_id, line.id, txn.id]);

            // Update payment line status
            await pool.query(`
                UPDATE ap_pay_line SET status = 'paid' WHERE id = $1
            `, [line.id]);

            updatedRuns.add(line.run_id);
            matched++;
        } else {
            // No match found
            unmatched++;
        }
    }

    // Update run statuses for fully matched runs
    let runsUpdated = 0;
    for (const runId of updatedRuns) {
        const { rows: runRows } = await pool.query(`
            SELECT COUNT(*) as total_lines,
                   COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_lines
            FROM ap_pay_line
            WHERE run_id = $1
        `, [runId]);

        if (runRows.length > 0) {
            const { total_lines, paid_lines } = runRows[0];
            if (Number(total_lines) === Number(paid_lines)) {
                await pool.query(`
                    UPDATE ap_pay_run SET status = 'executed' WHERE id = $1
                `, [runId]);
                runsUpdated++;
            }
        }
    }

    return { matched, unmatched, runsUpdated };
}

// --- Bank File Parsers (M23) ------------------------------------------------
function parseCamt053Xml(payload: string): any[] {
    // Simplified CAMT.053 XML parser
    // In a real implementation, you'd use a proper XML parser
    const transactions: any[] = [];

    // Extract transaction data from XML
    // This is a simplified version - real implementation would parse XML properly
    const lines = payload.split('\n');
    let inTransaction = false;
    let currentTxn: any = {};

    for (const line of lines) {
        if (line.includes('<Ntry>')) {
            inTransaction = true;
            currentTxn = {};
        } else if (line.includes('</Ntry>')) {
            if (currentTxn.date && currentTxn.amount && currentTxn.ccy) {
                transactions.push(currentTxn);
            }
            inTransaction = false;
        } else if (inTransaction) {
            if (line.includes('<BookgDt>')) {
                const dateMatch = line.match(/<BookgDt>.*?<Dt>(.*?)<\/Dt>/);
                if (dateMatch) {
                    currentTxn.date = dateMatch[1];
                }
            } else if (line.includes('<Amt')) {
                const amountMatch = line.match(/<Amt.*?Ccy="([^"]+)".*?>(.*?)<\/Amt>/);
                if (amountMatch && amountMatch[1] && amountMatch[2]) {
                    currentTxn.ccy = amountMatch[1];
                    currentTxn.amount = parseFloat(amountMatch[2]);
                }
            } else if (line.includes('<RmtInf>')) {
                const memoMatch = line.match(/<RmtInf>.*?<Ustrd>(.*?)<\/Ustrd>/);
                if (memoMatch) {
                    currentTxn.memo = memoMatch[1];
                }
            }
        }
    }

    return transactions;
}

function parseCsvBankFile(payload: string): any[] {
    const transactions: any[] = [];
    const lines = payload.split('\n');

    if (lines.length < 2) {
        return transactions;
    }

    const headers = lines[0]?.split(',').map(h => h.trim()) || [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i]?.split(',').map(v => v.trim()) || [];
        if (values.length !== headers.length) continue;

        const txn: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
            txn[headers[j]?.toLowerCase() || ''] = values[j] || '';
        }

        // Map common CSV fields
        if (txn.date && txn.amount && txn.currency) {
            transactions.push({
                date: txn.date,
                amount: parseFloat(txn.amount),
                ccy: txn.currency,
                counterparty: txn.counterparty || txn.payee || '',
                memo: txn.memo || txn.description || ''
            });
        }
    }

    return transactions;
}

// --- Bank Transaction Management (M23) ---------------------------------------
export async function getBankTransactions(
    companyId: string,
    status?: string,
    startDate?: string,
    endDate?: string
): Promise<BankTxnMap[]> {
    let query = `
        SELECT id, bank_date, amount, ccy, counterparty, memo, matched_run_id, matched_line_id, status, created_at
        FROM bank_txn_map
        WHERE company_id = $1
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    if (startDate) {
        query += ` AND bank_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        query += ` AND bank_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
    }

    query += ` ORDER BY bank_date DESC`;

    const { rows } = await pool.query(query, params);

    return rows.map(row => ({
        id: row.id,
        companyId,
        bankDate: row.bank_date,
        amount: Number(row.amount),
        ccy: row.ccy,
        counterparty: row.counterparty,
        memo: row.memo,
        matchedRunId: row.matched_run_id,
        matchedLineId: row.matched_line_id,
        status: row.status,
        createdAt: row.created_at.toISOString()
    }));
}

export async function getUnmatchedTransactions(companyId: string): Promise<BankTxnMap[]> {
    return await getBankTransactions(companyId, 'unmatched');
}

export async function getMatchedTransactions(companyId: string): Promise<BankTxnMap[]> {
    return await getBankTransactions(companyId, 'matched');
}

// --- Manual Transaction Matching (M23) --------------------------------------
export async function manuallyMatchTransaction(
    companyId: string,
    txnId: string,
    runId: string,
    lineId: string
): Promise<void> {
    // Update transaction
    await pool.query(`
        UPDATE bank_txn_map 
        SET matched_run_id = $1, matched_line_id = $2, status = 'matched'
        WHERE id = $3 AND company_id = $4
    `, [runId, lineId, txnId, companyId]);

    // Update payment line
    await pool.query(`
        UPDATE ap_pay_line SET status = 'paid' WHERE id = $1
    `, [lineId]);

    // Check if run is fully matched
    const { rows: runRows } = await pool.query(`
        SELECT COUNT(*) as total_lines,
               COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_lines
        FROM ap_pay_line
        WHERE run_id = $1
    `, [runId]);

    if (runRows.length > 0) {
        const { total_lines, paid_lines } = runRows[0];
        if (Number(total_lines) === Number(paid_lines)) {
            await pool.query(`
                UPDATE ap_pay_run SET status = 'executed' WHERE id = $1
            `, [runId]);
        }
    }
}

// --- Payment Run Queries (M23) -----------------------------------------------
export async function getPayRuns(
    companyId: string,
    status?: string,
    year?: number,
    month?: number
): Promise<any[]> {
    let query = `
        SELECT id, year, month, status, ccy, present_ccy, created_by, created_at, approved_by, approved_at
        FROM ap_pay_run
        WHERE company_id = $1
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    if (year) {
        query += ` AND year = $${paramIndex}`;
        params.push(year);
        paramIndex++;
    }

    if (month) {
        query += ` AND month = $${paramIndex}`;
        params.push(month);
        paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, params);

    return rows.map(row => ({
        id: row.id,
        companyId,
        year: row.year,
        month: row.month,
        status: row.status,
        ccy: row.ccy,
        presentCcy: row.present_ccy,
        createdBy: row.created_by,
        createdAt: row.created_at.toISOString(),
        approvedBy: row.approved_by,
        approvedAt: row.approved_at?.toISOString()
    }));
}
