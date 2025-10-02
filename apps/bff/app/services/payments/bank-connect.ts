import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { createHash } from "crypto";
import {
    BankProfileUpsertType,
    DispatchRequestType,
    FetchRequestType,
    ReasonNormUpsertType
} from "@aibos/contracts";

// --- M23.2 Bank Connectivity Interfaces ----------------------------------------
export interface BankConnProfile {
    companyId: string;
    bankCode: string;
    kind: 'SFTP' | 'API';
    config: Record<string, any>;
    active: boolean;
    updatedAt: string;
    updatedBy: string;
}

export interface BankFetchCursor {
    companyId: string;
    bankCode: string;
    channel: 'pain002' | 'camt054';
    cursor?: string;
    updatedAt: string;
}

export interface BankOutbox {
    id: string;
    companyId: string;
    runId: string;
    bankCode: string;
    filename: string;
    payload: string;
    checksum: string;
    status: 'queued' | 'sent' | 'error' | 'ignored';
    attempts: number;
    lastError?: string;
    createdAt: string;
    sentAt?: string;
}

export interface BankJobLog {
    id: string;
    companyId: string;
    bankCode: string;
    kind: 'DISPATCH' | 'FETCH';
    detail: string;
    payload?: string;
    success: boolean;
    createdAt: string;
}

export interface BankAck {
    id: string;
    companyId: string;
    bankCode: string;
    ackKind: 'pain002' | 'camt054';
    filename: string;
    payload: string;
    uniqHash: string;
    createdAt: string;
}

export interface BankAckMap {
    id: string;
    ackId: string;
    runId?: string;
    lineId?: string;
    status: 'ack' | 'exec_ok' | 'exec_fail' | 'partial';
    reasonCode?: string;
    reasonLabel?: string;
}

export interface BankReasonNorm {
    bankCode: string;
    code: string;
    normStatus: 'ack' | 'exec_ok' | 'exec_fail' | 'partial';
    normLabel: string;
    updatedAt: string;
}

// --- Profile Manager Service --------------------------------------------------
export async function upsertBankProfile(
    companyId: string,
    data: BankProfileUpsertType,
    updatedBy: string
): Promise<BankConnProfile> {
    const { bank_code, kind, config, active } = data;

    // Validate config based on kind
    if (kind === 'SFTP') {
        if (!config.host || !config.port || !config.username || !config.key_ref) {
            throw new Error('SFTP config missing required fields: host, port, username, key_ref');
        }
    } else if (kind === 'API') {
        if (!config.api_base || !config.auth_ref) {
            throw new Error('API config missing required fields: api_base, auth_ref');
        }
    }

    const { rows } = await pool.query(`
        INSERT INTO bank_conn_profile (company_id, bank_code, kind, config, active, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (company_id, bank_code)
        DO UPDATE SET
            kind = EXCLUDED.kind,
            config = EXCLUDED.config,
            active = EXCLUDED.active,
            updated_at = now(),
            updated_by = EXCLUDED.updated_by
        RETURNING *
    `, [companyId, bank_code, kind, JSON.stringify(config), active, updatedBy]);

    const row = rows[0];
    return {
        companyId: row.company_id,
        bankCode: row.bank_code,
        kind: row.kind,
        config: row.config,
        active: row.active,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
    };
}

export async function getBankProfile(
    companyId: string,
    bankCode: string
): Promise<BankConnProfile | null> {
    const { rows } = await pool.query(`
        SELECT * FROM bank_conn_profile
        WHERE company_id = $1 AND bank_code = $2
    `, [companyId, bankCode]);

    if (!rows[0]) return null;
    const row = rows[0];
    return {
        companyId: row.company_id,
        bankCode: row.bank_code,
        kind: row.kind,
        config: row.config,
        active: row.active,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
    };
}

export async function listBankProfiles(companyId: string): Promise<BankConnProfile[]> {
    const { rows } = await pool.query(`
        SELECT * FROM bank_conn_profile
        WHERE company_id = $1
        ORDER BY bank_code
    `, [companyId]);

    return rows.map(row => ({
        companyId: row.company_id,
        bankCode: row.bank_code,
        kind: row.kind,
        config: row.config,
        active: row.active,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
    }));
}

// --- Dispatcher Service (Outbound) --------------------------------------------
export async function dispatchPaymentRun(
    companyId: string,
    data: DispatchRequestType
): Promise<BankOutbox> {
    const { run_id, bank_code, dry_run } = data;

    // Get payment run details
    const { rows: runRows } = await pool.query(`
        SELECT id, company_id, status, ccy FROM ap_pay_run
        WHERE id = $1 AND company_id = $2
    `, [run_id, companyId]);

    if (runRows.length === 0) {
        throw new Error('Payment run not found');
    }

    const run = runRows[0];
    if (run.status !== 'exported') {
        throw new Error(`Run status must be 'exported', got '${run.status}'`);
    }

    // Get bank profile
    const profile = await getBankProfile(companyId, bank_code);
    if (!profile || !profile.active) {
        throw new Error(`Bank profile not found or inactive: ${bank_code}`);
    }

    // Generate PAIN.001 content (simplified for now)
    const pain001Content = await generatePain001Content(run_id);
    // For idempotency, use a deterministic checksum based on run data, not content with timestamps
    const checksum = createHash('sha256').update(`${run_id}_${bank_code}`).digest('hex');
    const filename = `PAIN001_${run_id}_${checksum.substring(0, 8)}.xml`;

    // Create business key for idempotency
    const businessKey = `PAYMENT_RUN:${companyId}:${run_id}:${checksum}`;

    // Use upsert with business key for idempotency
    const { rows } = await pool.query(`
        INSERT INTO bank_outbox (id, company_id, run_id, bank_code, filename, payload, checksum, status, attempts, last_error, business_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (company_id, business_key) WHERE business_key IS NOT NULL
        DO UPDATE SET status = EXCLUDED.status, attempts = EXCLUDED.attempts, last_error = EXCLUDED.last_error
        RETURNING *
    `, [ulid(), companyId, run_id, bank_code, filename, pain001Content, checksum, 'queued', 0, null, businessKey]);

    const row = rows[0];

    // Log the dispatch attempt
    await logBankJob(companyId, bank_code, 'DISPATCH',
        `Queued ${dry_run ? 'dry-run ' : ''}dispatch for run ${run_id}`,
        JSON.stringify({ run_id, filename, dry_run }), true);

    return {
        id: row.id,
        companyId: row.company_id,
        runId: row.run_id,
        bankCode: row.bank_code,
        filename: row.filename,
        payload: row.payload,
        checksum: row.checksum,
        status: row.status,
        attempts: row.attempts,
        lastError: row.last_error,
        createdAt: row.created_at,
        sentAt: row.sent_at
    };
}

async function generatePain001Content(runId: string): Promise<string> {
    // Get run and lines data
    const { rows: runRows } = await pool.query(`
        SELECT r.*, COUNT(l.id) as line_count, SUM(l.pay_amount) as total_amount
        FROM ap_pay_run r
        LEFT JOIN ap_pay_line l ON r.id = l.run_id
        WHERE r.id = $1
        GROUP BY r.id
    `, [runId]);

    if (runRows.length === 0) {
        throw new Error('Run not found');
    }

    const run = runRows[0];

    const { rows: lineRows } = await pool.query(`
        SELECT * FROM ap_pay_line WHERE run_id = $1 ORDER BY id
    `, [runId]);

    // Generate simplified PAIN.001 XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${runId}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${run.line_count}</NbOfTxs>
      <CtrlSum>${run.total_amount || 0}</CtrlSum>
      <InitgPty>
        <Nm>Company</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${runId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${new Date().toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>Company</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>DE89370400440532013000</IBAN>
        </Id>
      </DbtrAcct>
      ${lineRows.map(line => `
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>${line.id}</InstrId>
          <EndToEndId>${line.bank_ref || line.id}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${line.pay_ccy}">${line.pay_amount}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>Supplier ${line.supplier_id}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>DE89370400440532013000</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Payment for invoice ${line.invoice_id}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`).join('')}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    return xml;
}

// --- Fetcher Service (Inbound) ------------------------------------------------
export async function fetchBankFiles(
    companyId: string,
    data: FetchRequestType
): Promise<{ processed: number; errors: string[] }> {
    const { bank_code, channel, max_files } = data;

    // Get bank profile
    const profile = await getBankProfile(companyId, bank_code);
    if (!profile || !profile.active) {
        throw new Error(`Bank profile not found or inactive: ${bank_code}`);
    }

    const channels = channel ? [channel] : ['pain002', 'camt054'];
    const errors: string[] = [];
    let processed = 0;

    for (const ch of channels) {
        try {
            const files = await fetchFilesFromBank(profile, ch, max_files);

            for (const file of files) {
                try {
                    await processBankFile(companyId, bank_code, ch, file);
                    processed++;
                } catch (error) {
                    errors.push(`Failed to process ${file.filename}: ${error}`);
                }
            }
        } catch (error) {
            errors.push(`Failed to fetch ${ch} files: ${error}`);
        }
    }

    // Log the fetch attempt
    await logBankJob(companyId, bank_code, 'FETCH',
        `Fetched ${processed} files, ${errors.length} errors`,
        JSON.stringify({ channels, processed, errors }), errors.length === 0);

    return { processed, errors };
}

async function fetchFilesFromBank(
    profile: BankConnProfile,
    channel: string,
    maxFiles: number
): Promise<Array<{ filename: string; content: string }>> {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Connect to SFTP or API based on profile.kind
    // 2. Fetch files from the appropriate directory/endpoint
    // 3. Return file contents

    if (profile.kind === 'SFTP') {
        // SFTP implementation would go here
        // const sftp = new SFTPClient();
        // await sftp.connect(profile.config);
        // const files = await sftp.list(profile.config.in_dir);
        // return files.slice(0, maxFiles);
    } else if (profile.kind === 'API') {
        // API implementation would go here
        // const response = await fetch(`${profile.config.api_base}/files/${channel}`);
        // return response.json();
    }

    // Mock implementation for now
    return [];
}

async function processBankFile(
    companyId: string,
    bankCode: string,
    channel: string,
    file: { filename: string; content: string }
): Promise<void> {
    const uniqHash = createHash('sha256').update(file.content).digest('hex');

    // Check for duplicate processing
    const { rows: existingRows } = await pool.query(`
        SELECT id FROM bank_inbox_audit
        WHERE company_id = $1 AND bank_code = $2 AND uniq_hash = $3
    `, [companyId, bankCode, uniqHash]);

    if (existingRows.length > 0) {
        return; // Already processed
    }

    // Store the acknowledgment
    const ackId = ulid();
    const ackKind = channel === 'pain002' ? 'pain002' : 'camt054';

    await pool.query(`
        INSERT INTO bank_ack (id, company_id, bank_code, ack_kind, filename, payload, uniq_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [ackId, companyId, bankCode, ackKind, file.filename, file.content, uniqHash]);

    // Audit the file
    const auditId = ulid();
    await pool.query(`
        INSERT INTO bank_inbox_audit (id, company_id, bank_code, channel, filename, uniq_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [auditId, companyId, bankCode, channel, file.filename, uniqHash]);

    // Parse and map acknowledgments
    await parseAndMapAck(ackId, file.content, channel);
}

async function parseAndMapAck(
    ackId: string,
    content: string,
    channel: string
): Promise<void> {
    // This is a simplified parser - in reality you'd use proper XML/CSV parsing
    // For now, we'll create mock mappings

    if (channel === 'pain002') {
        // Parse PAIN.002 XML and extract status information
        // Mock implementation
        const mockMappings = [
            { runId: 'run_123', lineId: 'line_456', status: 'ack', reasonCode: 'ACCP', reasonLabel: 'Accepted' }
        ];

        for (const mapping of mockMappings) {
            const mapId = ulid();
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [mapId, ackId, mapping.runId, mapping.lineId, mapping.status, mapping.reasonCode, mapping.reasonLabel]);
        }
    } else if (channel === 'camt054') {
        // Parse CAMT.054 XML and extract execution information
        // Mock implementation
        const mockMappings = [
            { runId: 'run_123', lineId: 'line_456', status: 'exec_ok', reasonCode: 'ACSC', reasonLabel: 'AcceptedSettlementCompleted' }
        ];

        for (const mapping of mockMappings) {
            const mapId = ulid();
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [mapId, ackId, mapping.runId, mapping.lineId, mapping.status, mapping.reasonCode, mapping.reasonLabel]);
        }
    }
}

// --- State Machine Service ----------------------------------------------------
export async function processAckMappings(companyId: string): Promise<void> {
    // Get all unmapped acknowledgments
    const { rows } = await pool.query(`
        SELECT bam.*, ba.bank_code
        FROM bank_ack_map bam
        JOIN bank_ack ba ON bam.ack_id = ba.id
        WHERE ba.company_id = $1
        ORDER BY ba.created_at
    `, [companyId]);

    for (const mapping of rows) {
        await processAckMapping(mapping);
    }
}

async function processAckMapping(mapping: any): Promise<void> {
    const { run_id, line_id, status, reason_code, reason_label } = mapping;

    if (!run_id) return; // Skip if no run_id

    // Get normalized status
    const normalizedStatus = await normalizeReasonCode(mapping.bank_code, reason_code, status);

    // Update run status based on mapping
    if (normalizedStatus === 'ack') {
        // Set acknowledged timestamp if not already set
        await pool.query(`
            UPDATE ap_pay_run 
            SET acknowledged_at = COALESCE(acknowledged_at, now())
            WHERE id = $1 AND acknowledged_at IS NULL
        `, [run_id]);
    } else if (normalizedStatus === 'exec_ok') {
        // Check if all lines are executed
        const { rows: lineRows } = await pool.query(`
            SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid
            FROM ap_pay_line WHERE run_id = $1
        `, [run_id]);

        if (lineRows[0].total === lineRows[0].paid) {
            // All lines executed, update run status
            await pool.query(`
                UPDATE ap_pay_run SET status = 'executed' WHERE id = $1
            `, [run_id]);
        }
    } else if (normalizedStatus === 'exec_fail') {
        // Set failed status
        await pool.query(`
            UPDATE ap_pay_run 
            SET status = 'failed', failed_reason = $2
            WHERE id = $1 AND status != 'failed'
        `, [run_id, reason_label || 'Bank rejection']);
    }
}

// --- Reason Code Normalization ------------------------------------------------
export async function upsertReasonNorm(data: ReasonNormUpsertType): Promise<BankReasonNorm> {
    const { bank_code, code, norm_status, norm_label } = data;

    const { rows } = await pool.query(`
        INSERT INTO bank_reason_norm (bank_code, code, norm_status, norm_label)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (bank_code, code)
        DO UPDATE SET
            norm_status = EXCLUDED.norm_status,
            norm_label = EXCLUDED.norm_label,
            updated_at = now()
        RETURNING *
    `, [bank_code, code, norm_status, norm_label]);

    const row = rows[0];
    return {
        bankCode: row.bank_code,
        code: row.code,
        normStatus: row.norm_status,
        normLabel: row.norm_label,
        updatedAt: row.updated_at
    };
}

export async function normalizeReasonCode(
    bankCode: string,
    code: string,
    fallbackStatus: string
): Promise<string> {
    const { rows } = await pool.query(`
        SELECT norm_status FROM bank_reason_norm
        WHERE bank_code = $1 AND code = $2
    `, [bankCode, code]);

    return rows[0]?.norm_status || fallbackStatus;
}

// --- Job Logging Service ------------------------------------------------------
export async function logBankJob(
    companyId: string,
    bankCode: string,
    kind: 'DISPATCH' | 'FETCH',
    detail: string,
    payload?: string,
    success: boolean = true
): Promise<BankJobLog> {
    const id = ulid();
    const { rows } = await pool.query(`
        INSERT INTO bank_job_log (id, company_id, bank_code, kind, detail, payload, success)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [id, companyId, bankCode, kind, detail, payload, success]);

    const row = rows[0];
    return {
        id: row.id,
        companyId: row.company_id,
        bankCode: row.bank_code,
        kind: row.kind,
        detail: row.detail,
        payload: row.payload,
        success: row.success,
        createdAt: row.created_at
    };
}

export async function getBankJobLogs(
    companyId: string,
    bankCode?: string,
    kind?: 'DISPATCH' | 'FETCH',
    limit: number = 50
): Promise<BankJobLog[]> {
    let query = `
        SELECT * FROM bank_job_log
        WHERE company_id = $1
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (bankCode) {
        query += ` AND bank_code = $${paramIndex}`;
        params.push(bankCode);
        paramIndex++;
    }

    if (kind) {
        query += ` AND kind = $${paramIndex}`;
        params.push(kind);
        paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        bankCode: row.bank_code,
        kind: row.kind,
        detail: row.detail,
        payload: row.payload,
        success: row.success,
        createdAt: row.created_at
    }));
}

// --- Outbox Management --------------------------------------------------------
export async function processOutboxQueue(companyId: string): Promise<void> {
    // Get queued items
    const { rows } = await pool.query(`
        SELECT * FROM bank_outbox
        WHERE company_id = $1 AND status = 'queued'
        ORDER BY created_at
        LIMIT 10
    `, [companyId]);

    for (const item of rows) {
        try {
            await processOutboxItem(item);
        } catch (error) {
            // Update error status
            await pool.query(`
                UPDATE bank_outbox
                SET status = 'error', last_error = $2, attempts = attempts + 1
                WHERE id = $1
            `, [item.id, String(error)]);
        }
    }
}

async function processOutboxItem(item: BankOutbox): Promise<void> {
    const profile = await getBankProfile(item.companyId, item.bankCode);
    if (!profile) {
        throw new Error(`Bank profile not found: ${item.bankCode}`);
    }

    // Implement actual dispatch logic based on profile.kind
    if (profile.kind === 'SFTP') {
        // SFTP upload logic would go here
        // await uploadToSFTP(profile.config, item.filename, item.payload);
    } else if (profile.kind === 'API') {
        // API upload logic would go here
        // await uploadToAPI(profile.config, item.filename, item.payload);
    }

    // Mark as sent
    await pool.query(`
        UPDATE bank_outbox
        SET status = 'sent', sent_at = now()
        WHERE id = $1
    `, [item.id]);

    // Log success
    await logBankJob(item.companyId, item.bankCode, 'DISPATCH',
        `Successfully sent ${item.filename}`,
        JSON.stringify({ filename: item.filename, runId: item.runId }), true);
}
