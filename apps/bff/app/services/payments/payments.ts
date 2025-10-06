import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import { createHash } from 'crypto';
import {
  SupplierBankUpsertType,
  PaymentPrefUpsertType,
  FileProfileUpsertType,
  PayRunCreateType,
  PayRunSelectType,
  PayRunApproveType,
  PayRunExportType,
  PayRunExecuteType,
  BankFileImportType,
} from '@aibos/contracts';

// --- AP Payment Interfaces (M23) ---------------------------------------------
export interface SupplierBank {
  companyId: string;
  supplierId: string;
  method: string;
  bankName?: string;
  iban?: string;
  bic?: string;
  acctNo?: string;
  acctCcy: string;
  country?: string;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface PaymentPref {
  companyId: string;
  supplierId: string;
  payTerms?: string | undefined;
  payDayRule?: string | undefined;
  minAmount?: number | undefined;
  holdPay: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface PayRun {
  id: string;
  companyId: string;
  year: number;
  month: number;
  status: string;
  ccy: string;
  presentCcy?: string | undefined;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  lines?: PayLine[];
  summary?: {
    totalLines: number;
    totalAmount: number;
    suppliersCount: number;
  };
}

export interface PayLine {
  id: string;
  runId: string;
  supplierId: string;
  invoiceId: string;
  dueDate: string;
  grossAmount: number;
  discAmount: number;
  payAmount: number;
  invCcy: string;
  payCcy: string;
  fxRate?: number | undefined;
  bankRef?: string | undefined;
  status: string;
  note?: string | undefined;
}

export interface PayExport {
  id: string;
  runId: string;
  format: string;
  filename: string;
  payload: string;
  checksum: string;
  createdAt: string;
}

// --- Supplier Banking Management (M23) ----------------------------------------
export async function upsertSupplierBank(
  companyId: string,
  data: SupplierBankUpsertType,
  updatedBy: string
): Promise<SupplierBank> {
  await pool.query(
    `
        INSERT INTO ap_supplier_bank (company_id, supplier_id, method, bank_name, iban, bic, acct_no, acct_ccy, country, active, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (company_id, supplier_id) 
        DO UPDATE SET method = $3, bank_name = $4, iban = $5, bic = $6, acct_no = $7, acct_ccy = $8, country = $9, active = $10, updated_by = $11, updated_at = now()
    `,
    [
      companyId,
      data.supplier_id,
      data.method,
      data.bank_name,
      data.iban,
      data.bic,
      data.acct_no,
      data.acct_ccy,
      data.country,
      data.active,
      updatedBy,
    ]
  );

  const result = await pool.query(
    `
        SELECT supplier_id, method, bank_name, iban, bic, acct_no, acct_ccy, country, active, updated_at, updated_by
        FROM ap_supplier_bank
        WHERE company_id = $1 AND supplier_id = $2
    `,
    [companyId, data.supplier_id]
  );

  return {
    companyId,
    supplierId: result.rows[0].supplier_id,
    method: result.rows[0].method,
    bankName: result.rows[0].bank_name,
    iban: result.rows[0].iban,
    bic: result.rows[0].bic,
    acctNo: result.rows[0].acct_no,
    acctCcy: result.rows[0].acct_ccy,
    country: result.rows[0].country,
    active: result.rows[0].active,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getSupplierBanks(
  companyId: string
): Promise<SupplierBank[]> {
  const result = await pool.query(
    `
        SELECT supplier_id, method, bank_name, iban, bic, acct_no, acct_ccy, country, active, updated_at, updated_by
        FROM ap_supplier_bank
        WHERE company_id = $1 AND active = true
        ORDER BY supplier_id
    `,
    [companyId]
  );

  return result.rows.map(row => ({
    companyId,
    supplierId: row.supplier_id,
    method: row.method,
    bankName: row.bank_name,
    iban: row.iban,
    bic: row.bic,
    acctNo: row.acct_no,
    acctCcy: row.acct_ccy,
    country: row.country,
    active: row.active,
    updatedAt: row.updated_at.toISOString(),
    updatedBy: row.updated_by,
  }));
}

// --- Payment Preferences Management (M23) -------------------------------------
export async function upsertPaymentPref(
  companyId: string,
  data: PaymentPrefUpsertType,
  updatedBy: string
): Promise<PaymentPref> {
  await pool.query(
    `
        INSERT INTO ap_payment_pref (company_id, supplier_id, pay_terms, pay_day_rule, min_amount, hold_pay, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (company_id, supplier_id) 
        DO UPDATE SET pay_terms = $3, pay_day_rule = $4, min_amount = $5, hold_pay = $6, updated_by = $7, updated_at = now()
    `,
    [
      companyId,
      data.supplier_id,
      data.pay_terms,
      data.pay_day_rule,
      data.min_amount,
      data.hold_pay,
      updatedBy,
    ]
  );

  const result = await pool.query(
    `
        SELECT supplier_id, pay_terms, pay_day_rule, min_amount, hold_pay, updated_at, updated_by
        FROM ap_payment_pref
        WHERE company_id = $1 AND supplier_id = $2
    `,
    [companyId, data.supplier_id]
  );

  return {
    companyId,
    supplierId: result.rows[0].supplier_id,
    payTerms: result.rows[0].pay_terms,
    payDayRule: result.rows[0].pay_day_rule,
    minAmount: result.rows[0].min_amount
      ? Number(result.rows[0].min_amount)
      : undefined,
    holdPay: result.rows[0].hold_pay,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

// --- Payment Run Lifecycle (M23) ---------------------------------------------
export async function createPayRun(
  companyId: string,
  data: PayRunCreateType,
  createdBy: string
): Promise<PayRun> {
  const runId = ulid();

  await pool.query(
    `
        INSERT INTO ap_pay_run (id, company_id, year, month, status, ccy, present_ccy, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      runId,
      companyId,
      data.year,
      data.month,
      'draft',
      data.ccy,
      data.present_ccy,
      createdBy,
    ]
  );

  return {
    id: runId,
    companyId,
    year: data.year,
    month: data.month,
    status: 'draft',
    ccy: data.ccy,
    presentCcy: data.present_ccy,
    createdBy,
    createdAt: new Date().toISOString(),
    summary: {
      totalLines: 0,
      totalAmount: 0,
      suppliersCount: 0,
    },
  };
}

export async function selectInvoicesForRun(
  companyId: string,
  data: PayRunSelectType,
  createdBy: string
): Promise<PayRun> {
  // Get the run
  const { rows: runRows } = await pool.query(
    `
        SELECT id, year, month, status, ccy, present_ccy, created_by, created_at
        FROM ap_pay_run
        WHERE id = $1 AND company_id = $2
    `,
    [data.run_id, companyId]
  );

  if (runRows.length === 0) {
    throw new Error('Payment run not found');
  }

  const run = runRows[0];
  if (run.status !== 'draft') {
    throw new Error('Can only select invoices for draft runs');
  }

  // Get eligible AP invoices
  const eligibleInvoices = await getEligibleInvoices(
    companyId,
    run.ccy,
    data.filters
  );

  // Process each invoice
  for (const invoice of eligibleInvoices) {
    // Check if already locked
    const { rows: lockRows } = await pool.query(
      `
            SELECT 1 FROM ap_pay_lock WHERE company_id = $1 AND invoice_id = $2
        `,
      [companyId, invoice.id]
    );

    if (lockRows.length > 0) {
      continue; // Skip locked invoices
    }

    // Get supplier bank details
    const supplierBank = await getSupplierBankForInvoice(
      companyId,
      invoice.supplier_id
    );
    if (!supplierBank) {
      continue; // Skip invoices without bank details
    }

    // Get payment preferences
    const paymentPref = await getPaymentPrefForSupplier(
      companyId,
      invoice.supplier_id
    );
    if (paymentPref?.hold_pay) {
      continue; // Skip invoices on hold
    }

    // Calculate payment amount and FX rate
    const { payAmount, fxRate } = await calculatePaymentAmount(
      invoice,
      run.ccy,
      supplierBank.acct_ccy,
      companyId
    );

    // Create payment line
    const lineId = ulid();
    await pool.query(
      `
            INSERT INTO ap_pay_line (id, run_id, supplier_id, invoice_id, due_date, gross_amount, disc_amount, pay_amount, inv_ccy, pay_ccy, fx_rate, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
      [
        lineId,
        data.run_id,
        invoice.supplier_id,
        invoice.id,
        invoice.due_date,
        invoice.gross_amount,
        invoice.disc_amount || 0,
        payAmount,
        invoice.ccy,
        supplierBank.acct_ccy,
        fxRate,
        'selected',
      ]
    );

    // Lock the invoice
    await pool.query(
      `
            INSERT INTO ap_pay_lock (company_id, invoice_id)
            VALUES ($1, $2)
        `,
      [companyId, invoice.id]
    );
  }

  // Return updated run with lines
  return await getPayRunWithLines(companyId, data.run_id);
}

export async function approvePayRun(
  companyId: string,
  data: PayRunApproveType,
  approvedBy: string
): Promise<PayRun> {
  const { rows: runRows } = await pool.query(
    `
        SELECT id, status FROM ap_pay_run
        WHERE id = $1 AND company_id = $2
    `,
    [data.run_id, companyId]
  );

  if (runRows.length === 0) {
    throw new Error('Payment run not found');
  }

  if (runRows[0].status !== 'draft') {
    throw new Error('Can only approve draft runs');
  }

  await pool.query(
    `
        UPDATE ap_pay_run 
        SET status = 'approved', approved_by = $1, approved_at = now()
        WHERE id = $2 AND company_id = $3
    `,
    [approvedBy, data.run_id, companyId]
  );

  return await getPayRunWithLines(companyId, data.run_id);
}

export async function exportPayRun(
  companyId: string,
  data: PayRunExportType,
  createdBy: string
): Promise<PayExport> {
  const run = await getPayRunWithLines(companyId, data.run_id);

  if (run.status !== 'approved') {
    throw new Error('Can only export approved runs');
  }

  // Get file profile
  const fileProfile = await getFileProfile(companyId, data.bank_code);
  if (!fileProfile) {
    throw new Error('File profile not found for bank');
  }

  // Generate export file
  const exportData = await generateExportFile(
    run,
    fileProfile,
    data.format || fileProfile.format
  );

  // Save export record
  const exportId = ulid();
  await pool.query(
    `
        INSERT INTO ap_pay_export (id, run_id, format, filename, payload, checksum)
        VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      exportId,
      data.run_id,
      exportData.format,
      exportData.filename,
      exportData.payload,
      exportData.checksum,
    ]
  );

  // Update run status
  await pool.query(
    `
        UPDATE ap_pay_run SET status = 'exported' WHERE id = $1 AND company_id = $2
    `,
    [data.run_id, companyId]
  );

  // Queue remittance notifications
  await queueRemittanceNotifications(data.run_id, run.lines || []);

  return {
    id: exportId,
    runId: data.run_id,
    format: exportData.format,
    filename: exportData.filename,
    payload: exportData.payload,
    checksum: exportData.checksum,
    createdAt: new Date().toISOString(),
  };
}

export async function executePayRun(
  companyId: string,
  data: PayRunExecuteType,
  executedBy: string
): Promise<PayRun> {
  const run = await getPayRunWithLines(companyId, data.run_id);

  if (run.status !== 'exported') {
    throw new Error('Can only execute exported runs');
  }

  // Post payment journal entries
  await postPaymentJournals(companyId, run);

  // Update run status
  await pool.query(
    `
        UPDATE ap_pay_run SET status = 'executed' WHERE id = $1 AND company_id = $2
    `,
    [data.run_id, companyId]
  );

  // Update line statuses
  await pool.query(
    `
        UPDATE ap_pay_line SET status = 'paid' WHERE run_id = $1
    `,
    [data.run_id]
  );

  // Unlock invoices
  await pool.query(
    `
        DELETE FROM ap_pay_lock WHERE company_id = $1 AND invoice_id IN (
            SELECT invoice_id FROM ap_pay_line WHERE run_id = $2
        )
    `,
    [companyId, data.run_id]
  );

  return await getPayRunWithLines(companyId, data.run_id);
}

// --- Helper Functions (M23) --------------------------------------------------
async function getEligibleInvoices(
  companyId: string,
  ccy: string,
  filters?: any
): Promise<any[]> {
  let query = `
        SELECT ai.id, ai.supplier_id, ai.due_date, ai.gross_amount, ai.disc_amount, ai.ccy, ai.status
        FROM ap_invoice ai
        WHERE ai.company_id = $1 AND ai.status = 'OPEN'
    `;
  const params: any[] = [companyId];

  if (filters?.suppliers) {
    query += ` AND ai.supplier_id = ANY($2)`;
    params.push(filters.suppliers);
  }

  if (filters?.due_on_or_before) {
    query += ` AND ai.due_date <= $${params.length + 1}`;
    params.push(filters.due_on_or_before);
  }

  if (filters?.min_amount) {
    query += ` AND ai.gross_amount >= $${params.length + 1}`;
    params.push(filters.min_amount);
  }

  query += ` ORDER BY ai.due_date, ai.supplier_id`;

  const { rows } = await pool.query(query, params);
  return rows;
}

async function getSupplierBankForInvoice(
  companyId: string,
  supplierId: string
): Promise<any> {
  const { rows } = await pool.query(
    `
        SELECT supplier_id, method, acct_ccy, iban, bic, acct_no
        FROM ap_supplier_bank
        WHERE company_id = $1 AND supplier_id = $2 AND active = true
    `,
    [companyId, supplierId]
  );

  return rows.length > 0 ? rows[0] : null;
}

async function getPaymentPrefForSupplier(
  companyId: string,
  supplierId: string
): Promise<any> {
  const { rows } = await pool.query(
    `
        SELECT supplier_id, pay_terms, pay_day_rule, min_amount, hold_pay
        FROM ap_payment_pref
        WHERE company_id = $1 AND supplier_id = $2
    `,
    [companyId, supplierId]
  );

  return rows.length > 0 ? rows[0] : null;
}

async function calculatePaymentAmount(
  invoice: any,
  runCcy: string,
  payCcy: string,
  companyId: string
): Promise<{ payAmount: number; fxRate?: number }> {
  const grossAmount = Number(invoice.gross_amount);
  const discAmount = Number(invoice.disc_amount) || 0;
  const netAmount = grossAmount - discAmount;

  if (invoice.ccy === payCcy) {
    return { payAmount: netAmount };
  }

  // Get FX rate
  const { rows: rateRows } = await pool.query(
    `
        SELECT rate FROM fx_admin_rates
        WHERE company_id = $1 AND src_ccy = $2 AND dst_ccy = $3
        ORDER BY as_of_date DESC LIMIT 1
    `,
    [companyId, invoice.ccy, payCcy]
  );

  if (rateRows.length === 0) {
    throw new Error(`FX rate not found for ${invoice.ccy} to ${payCcy}`);
  }

  const fxRate = Number(rateRows[0].rate);
  const payAmount = netAmount * fxRate;

  return { payAmount, fxRate };
}

async function getPayRunWithLines(
  companyId: string,
  runId: string
): Promise<PayRun> {
  const { rows: runRows } = await pool.query(
    `
        SELECT id, year, month, status, ccy, present_ccy, created_by, created_at, approved_by, approved_at
        FROM ap_pay_run
        WHERE id = $1 AND company_id = $2
    `,
    [runId, companyId]
  );

  if (runRows.length === 0) {
    throw new Error('Payment run not found');
  }

  const run = runRows[0];

  // Get lines
  const { rows: lineRows } = await pool.query(
    `
        SELECT id, supplier_id, invoice_id, due_date, gross_amount, disc_amount, pay_amount, inv_ccy, pay_ccy, fx_rate, bank_ref, status, note
        FROM ap_pay_line
        WHERE run_id = $1
        ORDER BY supplier_id, due_date
    `,
    [runId]
  );

  const lines: PayLine[] = lineRows.map(row => ({
    id: row.id,
    runId,
    supplierId: row.supplier_id,
    invoiceId: row.invoice_id,
    dueDate: row.due_date,
    grossAmount: Number(row.gross_amount),
    discAmount: Number(row.disc_amount),
    payAmount: Number(row.pay_amount),
    invCcy: row.inv_ccy,
    payCcy: row.pay_ccy,
    fxRate: row.fx_rate ? Number(row.fx_rate) : undefined,
    bankRef: row.bank_ref,
    status: row.status,
    note: row.note,
  }));

  // Calculate summary
  const totalAmount = lines.reduce((sum, line) => sum + line.payAmount, 0);
  const suppliersCount = new Set(lines.map(line => line.supplierId)).size;

  return {
    id: run.id,
    companyId,
    year: run.year,
    month: run.month,
    status: run.status,
    ccy: run.ccy,
    presentCcy: run.present_ccy,
    createdBy: run.created_by,
    createdAt: run.created_at.toISOString(),
    approvedBy: run.approved_by,
    approvedAt: run.approved_at?.toISOString(),
    lines,
    summary: {
      totalLines: lines.length,
      totalAmount,
      suppliersCount,
    },
  };
}

async function getFileProfile(
  companyId: string,
  bankCode: string
): Promise<any> {
  const { rows } = await pool.query(
    `
        SELECT bank_code, format, profile
        FROM ap_file_profile
        WHERE company_id = $1 AND bank_code = $2
    `,
    [companyId, bankCode]
  );

  return rows.length > 0 ? rows[0] : null;
}

async function generateExportFile(
  run: PayRun,
  fileProfile: any,
  format: string
): Promise<any> {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `PAY_${run.companyId}_${run.year}${run.month.toString().padStart(2, '0')}_${run.id}.${format === 'PAIN_001' ? 'xml' : 'csv'}`;

  let payload: string;
  if (format === 'PAIN_001') {
    payload = generatePain001Xml(run, fileProfile);
  } else {
    payload = generateCsvExport(run, fileProfile);
  }

  const checksum = createHash('sha256').update(payload).digest('hex');

  return { format, filename, payload, checksum };
}

function generatePain001Xml(run: PayRun, fileProfile: any): string {
  // Simplified PAIN.001 XML generation
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${run.id}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${run.lines?.length || 0}</NbOfTxs>
      <CtrlSum>${run.summary?.totalAmount || 0}</CtrlSum>
      <InitgPty>
        <Nm>${fileProfile.profile.debtorName || 'Company'}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${run.id}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${new Date().toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>${fileProfile.profile.debtorName || 'Company'}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${fileProfile.profile.debtorIban || 'DE89370400440532013000'}</IBAN>
        </Id>
      </DbtrAcct>
      ${
        run.lines
          ?.map(
            line => `
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>${line.id}</InstrId>
          <EndToEndId>${line.bankRef || line.id}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${line.payCcy}">${line.payAmount}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${line.bankRef || 'COBADEFFXXX'}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>Supplier ${line.supplierId}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>DE89370400440532013000</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Payment for invoice ${line.invoiceId}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`
          )
          .join('') || ''
      }
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

  return xml;
}

function generateCsvExport(run: PayRun, fileProfile: any): string {
  const headers = [
    'Supplier ID',
    'Invoice ID',
    'Amount',
    'Currency',
    'Bank Ref',
    'Due Date',
  ];
  const rows =
    run.lines?.map(line => [
      line.supplierId,
      line.invoiceId,
      line.payAmount.toString(),
      line.payCcy,
      line.bankRef || '',
      line.dueDate,
    ]) || [];

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

async function queueRemittanceNotifications(
  runId: string,
  lines: PayLine[]
): Promise<void> {
  const suppliers = new Set(lines.map(line => line.supplierId));

  for (const supplierId of suppliers) {
    const remittanceId = ulid();
    await pool.query(
      `
            INSERT INTO ap_remittance (id, run_id, supplier_id, address, status)
            VALUES ($1, $2, $3, $4, $5)
        `,
      [
        remittanceId,
        runId,
        supplierId,
        `supplier-${supplierId}@company.com`,
        'queued',
      ]
    );
  }
}

async function postPaymentJournals(
  companyId: string,
  run: PayRun
): Promise<void> {
  // This would integrate with the existing journal posting system
  // For now, we'll create a placeholder
  const journalId = ulid();

  // Post payment journal entry
  await pool.query(
    `
        INSERT INTO journal (id, company_id, posting_date, currency, source_doctype, source_id)
        VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      journalId,
      companyId,
      new Date().toISOString(),
      run.ccy,
      'AP_PAYMENT',
      run.id,
    ]
  );

  // Post payment lines
  for (const line of run.lines || []) {
    const lineId = ulid();
    await pool.query(
      `
            INSERT INTO journal_line (id, journal_id, account_code, dc, amount, currency, party_type, party_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
      [
        lineId,
        journalId,
        '2000',
        'C',
        line.payAmount,
        line.payCcy,
        'SUPPLIER',
        line.supplierId,
      ]
    );
  }

  // Record posting
  await pool.query(
    `
        INSERT INTO ap_payment_post (id, run_id, journal_id, posted_at)
        VALUES ($1, $2, $3, $4)
    `,
    [ulid(), run.id, journalId, new Date().toISOString()]
  );
}
