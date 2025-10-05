import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { parse } from "csv-parse/sync";
import {
    CfDriverWeekUpsertType,
    CfAdjustWeekUpsertType,
    BankAccountUpsertType
} from "@aibos/contracts";

// --- Import Interfaces (M22) -------------------------------------------------
export interface ImportResult {
    success: boolean;
    rowsProcessed: number;
    rowsImported: number;
    rowsSkipped: number;
    errors: string[];
    auditId: string;
}

export interface BankTxnImport {
    id: string;
    companyId: string;
    acctCode: string;
    txnDate: string;
    amount: number;
    memo?: string;
    source: string;
    importedAt: string;
    uniqHash: string;
}

// --- Driver Data Import (M22) -------------------------------------------------
export async function importDriverData(
    companyId: string,
    csvData: string,
    mapping: Record<string, string>,
    scenario: string,
    createdBy: string
): Promise<ImportResult> {
    const auditId = ulid();
    const errors: string[] = [];
    let rowsProcessed = 0;
    let rowsImported = 0;
    let rowsSkipped = 0;

    try {
        // Parse CSV data
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        rowsProcessed = records.length;

        // Process each record
        for (const record of records) {
            try {
                const recordObj = record as Record<string, string>;
                const driverData: CfDriverWeekUpsertType = {
                    year: parseInt(recordObj[mapping.year || 'year'] || recordObj['year'] || '0'),
                    iso_week: parseInt(recordObj[mapping.iso_week || 'iso_week'] || recordObj['iso_week'] || '0'),
                    driver_code: recordObj[mapping.driver_code || 'driver_code'] || recordObj['driver_code'] || '',
                    cost_center: recordObj[mapping.cost_center || 'cost_center'] || recordObj['cost_center'],
                    project: recordObj[mapping.project || 'project'] || recordObj['project'],
                    amount: parseFloat(recordObj[mapping.amount || 'amount'] || recordObj['amount'] || '0'),
                    scenario
                };

                // Validate required fields
                if (!driverData.year || !driverData.iso_week || !driverData.driver_code || isNaN(driverData.amount)) {
                    errors.push(`Row ${rowsProcessed}: Missing required fields`);
                    rowsSkipped++;
                    continue;
                }

                // Validate week range
                if (driverData.iso_week < 1 || driverData.iso_week > 53) {
                    errors.push(`Row ${rowsProcessed}: Invalid ISO week ${driverData.iso_week}`);
                    rowsSkipped++;
                    continue;
                }

                // Import driver data
                await upsertDriverWeek(companyId, driverData, createdBy);
                rowsImported++;

            } catch (error) {
                errors.push(`Row ${rowsProcessed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                rowsSkipped++;
            }
        }

        // Create audit record
        await pool.query(`
            INSERT INTO cf_import_audit (id, company_id, kind, filename, rows_ok, rows_err, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [auditId, companyId, 'DRIVER', 'csv_import', rowsImported, rowsSkipped, createdBy]);

        return {
            success: errors.length === 0,
            rowsProcessed,
            rowsImported,
            rowsSkipped,
            errors,
            auditId
        };

    } catch (error) {
        errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Create audit record for failed import
        await pool.query(`
            INSERT INTO cf_import_audit (id, company_id, kind, filename, rows_ok, rows_err, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [auditId, companyId, 'DRIVER', 'csv_import', 0, rowsProcessed, createdBy]);

        return {
            success: false,
            rowsProcessed,
            rowsImported: 0,
            rowsSkipped: rowsProcessed,
            errors,
            auditId
        };
    }
}

async function upsertDriverWeek(
    companyId: string,
    data: CfDriverWeekUpsertType,
    updatedBy: string
): Promise<void> {
    await pool.query(`
        INSERT INTO cf_driver_week (company_id, year, iso_week, driver_code, cost_center, project, amount, scenario, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (company_id, year, iso_week, driver_code, COALESCE(cost_center,''), COALESCE(project,''), scenario)
        DO UPDATE SET amount = $7, updated_by = $9, updated_at = now()
    `, [
        companyId, data.year, data.iso_week, data.driver_code,
        data.cost_center, data.project, data.amount, data.scenario, updatedBy
    ]);
}

// --- Bank Data Import (M22) --------------------------------------------------
export async function importBankData(
    companyId: string,
    csvData: string,
    mapping: Record<string, string>,
    acctCode: string,
    createdBy: string
): Promise<ImportResult> {
    const auditId = ulid();
    const errors: string[] = [];
    let rowsProcessed = 0;
    let rowsImported = 0;
    let rowsSkipped = 0;

    try {
        // Parse CSV data
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        rowsProcessed = records.length;

        // Process each record
        for (const record of records) {
            try {
                const recordObj = record as Record<string, string>;
                const txnData = {
                    txnDate: recordObj[mapping.txn_date || 'txn_date'] || recordObj['txn_date'] || '',
                    amount: parseFloat(recordObj[mapping.amount || 'amount'] || recordObj['amount'] || '0'),
                    memo: recordObj[mapping.memo || 'memo'] || recordObj['memo']
                };

                // Validate required fields
                if (!txnData.txnDate || isNaN(txnData.amount)) {
                    errors.push(`Row ${rowsProcessed}: Missing required fields`);
                    rowsSkipped++;
                    continue;
                }

                // Validate date format
                const date = new Date(txnData.txnDate);
                if (isNaN(date.getTime())) {
                    errors.push(`Row ${rowsProcessed}: Invalid date format`);
                    rowsSkipped++;
                    continue;
                }

                // Create unique hash for idempotency
                const uniqHash = createTransactionHash(acctCode, txnData.txnDate, txnData.amount, txnData.memo);

                // Import bank transaction
                await importBankTransaction(companyId, {
                    acctCode,
                    txnDate: txnData.txnDate,
                    amount: txnData.amount,
                    memo: txnData.memo || '',
                    uniqHash
                }, createdBy);

                rowsImported++;

            } catch (error) {
                errors.push(`Row ${rowsProcessed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                rowsSkipped++;
            }
        }

        // Update bank balances after import
        await updateBankBalances(companyId, acctCode);

        // Create audit record
        await pool.query(`
            INSERT INTO cf_import_audit (id, company_id, kind, filename, rows_ok, rows_err, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [auditId, companyId, 'BANK_TXN', 'csv_import', rowsImported, rowsSkipped, createdBy]);

        return {
            success: errors.length === 0,
            rowsProcessed,
            rowsImported,
            rowsSkipped,
            errors,
            auditId
        };

    } catch (error) {
        errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Create audit record for failed import
        await pool.query(`
            INSERT INTO cf_import_audit (id, company_id, kind, filename, rows_ok, rows_err, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [auditId, companyId, 'BANK_TXN', 'csv_import', 0, rowsProcessed, createdBy]);

        return {
            success: false,
            rowsProcessed,
            rowsImported: 0,
            rowsSkipped: rowsProcessed,
            errors,
            auditId
        };
    }
}

async function importBankTransaction(
    companyId: string,
    data: {
        acctCode: string;
        txnDate: string;
        amount: number;
        memo?: string;
        uniqHash: string;
    },
    createdBy: string
): Promise<void> {
    const txnId = ulid();

    await pool.query(`
        INSERT INTO bank_txn_import (id, company_id, acct_code, txn_date, amount, memo, source, uniq_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (company_id, acct_code, uniq_hash) DO NOTHING
    `, [
        txnId, companyId, data.acctCode, data.txnDate, data.amount,
        data.memo, 'CSV', data.uniqHash
    ]);
}

async function updateBankBalances(companyId: string, acctCode: string): Promise<void> {
    // Get all transactions for this account
    const { rows: txnRows } = await pool.query(`
        SELECT txn_date, amount
        FROM bank_txn_import
        WHERE company_id = $1 AND acct_code = $2
        ORDER BY txn_date
    `, [companyId, acctCode]);

    // Calculate running balance for each day
    const dailyBalances = new Map<string, number>();
    let runningBalance = 0;

    for (const row of txnRows) {
        const date = row.txn_date;
        runningBalance += Number(row.amount);

        // Store the end-of-day balance
        dailyBalances.set(date, runningBalance);
    }

    // Update bank_balance_day table
    for (const [date, balance] of dailyBalances) {
        await pool.query(`
            INSERT INTO bank_balance_day (company_id, acct_code, as_of_date, balance)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (company_id, acct_code, as_of_date)
            DO UPDATE SET balance = $4
        `, [companyId, acctCode, date, balance]);
    }
}

function createTransactionHash(
    acctCode: string,
    txnDate: string,
    amount: number,
    memo?: string
): string {
    const data = `${acctCode}|${txnDate}|${amount}|${memo || ''}`;
    return Buffer.from(data).toString('base64');
}

// --- Bank Account Management (M22) -------------------------------------------
export async function upsertBankAccount(
    companyId: string,
    data: BankAccountUpsertType,
    updatedBy: string
): Promise<void> {
    await pool.query(`
        INSERT INTO bank_account (company_id, acct_code, name, ccy)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id, acct_code)
        DO UPDATE SET name = $3, ccy = $4
    `, [companyId, data.acct_code, data.name, data.ccy]);
}

export async function getBankAccounts(companyId: string): Promise<any[]> {
    const { rows } = await pool.query(`
        SELECT acct_code, name, ccy
        FROM bank_account
        WHERE company_id = $1
        ORDER BY acct_code
    `, [companyId]);

    return rows.map(row => ({
        acct_code: row.acct_code,
        name: row.name,
        ccy: row.ccy
    }));
}

export async function getBankBalances(
    companyId: string,
    acctCode?: string,
    startDate?: string,
    endDate?: string
): Promise<any[]> {
    let query = `
        SELECT acct_code, as_of_date, balance
        FROM bank_balance_day
        WHERE company_id = $1
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (acctCode) {
        query += ` AND acct_code = $${paramIndex}`;
        params.push(acctCode);
        paramIndex++;
    }

    if (startDate) {
        query += ` AND as_of_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        query += ` AND as_of_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
    }

    query += ` ORDER BY acct_code, as_of_date`;

    const { rows } = await pool.query(query, params);

    return rows.map(row => ({
        acct_code: row.acct_code,
        as_of_date: row.as_of_date,
        balance: Number(row.balance)
    }));
}

// --- Manual Adjustments (M22) ------------------------------------------------
export async function upsertAdjustmentWeek(
    companyId: string,
    data: CfAdjustWeekUpsertType,
    createdBy: string
): Promise<string> {
    const adjustmentId = ulid();

    await pool.query(`
        INSERT INTO cf_adjust_week (id, company_id, year, iso_week, bucket, memo, amount, scenario, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
        adjustmentId, companyId, data.year, data.iso_week, data.bucket,
        data.memo, data.amount, data.scenario, createdBy
    ]);

    return adjustmentId;
}

export async function getAdjustmentWeeks(
    companyId: string,
    year?: number,
    scenario?: string
): Promise<any[]> {
    let query = `
        SELECT id, year, iso_week, bucket, memo, amount, scenario, created_at, created_by
        FROM cf_adjust_week
        WHERE company_id = $1
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (year) {
        query += ` AND year = $${paramIndex}`;
        params.push(year);
        paramIndex++;
    }

    if (scenario) {
        query += ` AND scenario = $${paramIndex}`;
        params.push(scenario);
        paramIndex++;
    }

    query += ` ORDER BY year, iso_week, bucket`;

    const { rows } = await pool.query(query, params);

    return rows.map(row => ({
        id: row.id,
        year: row.year,
        iso_week: row.iso_week,
        bucket: row.bucket,
        memo: row.memo,
        amount: Number(row.amount),
        scenario: row.scenario,
        created_at: row.created_at.toISOString(),
        created_by: row.created_by
    }));
}
