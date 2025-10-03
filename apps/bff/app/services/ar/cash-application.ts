import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { createHash } from "crypto";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
    arCashApp,
    arCashAppLink,
    arRemittanceImport,
    cfReceiptSignal
} from "@aibos/adapters-db/schema";
import type {
    RemitImportReqType,
    CashAppRunReqType,
    CashAppResultType,
    CashAppMatchType
} from "@aibos/contracts";

// --- AR Cash Application Service (M24) ------------------------------------------

export interface RemittanceRow {
    date: string;
    amount: number;
    currency: string;
    payerName: string;
    references: string[];
    rawData: any;
}

export interface InvoiceCandidate {
    id: string;
    customerId: string;
    invoiceNo: string;
    amount: number;
    currency: string;
    dueDate: string;
    daysOverdue: number;
}

export interface MatchResult {
    confidence: number;
    invoiceId: string;
    matchAmount: number;
    reason: string;
}

export class ArCashApplicationService {
    constructor(private db = pool) { }

    // Import remittance file
    async importRemittance(
        companyId: string,
        req: RemitImportReqType,
        createdBy: string
    ): Promise<{ id: string; rows_ok: number; rows_err: number }> {
        const id = ulid();
        const payloadHash = createHash('sha256').update(req.payload).digest('hex');

        // Check for duplicates
        const existing = await this.db
            .select({ id: arRemittanceImport.id })
            .from(arRemittanceImport)
            .where(
                and(
                    eq(arRemittanceImport.companyId, companyId),
                    eq(arRemittanceImport.uniqHash, payloadHash)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            throw new Error('Remittance file already imported');
        }

        let rowsOk = 0;
        let rowsErr = 0;
        let parsedRows: RemittanceRow[] = [];

        try {
            // Parse based on source type
            switch (req.source) {
                case 'CAMT054':
                    parsedRows = await this.parseCamt054(req.payload);
                    break;
                case 'CSV':
                    parsedRows = await this.parseCsv(req.payload);
                    break;
                case 'EMAIL':
                    parsedRows = await this.parseEmail(req.payload);
                    break;
                default:
                    throw new Error(`Unsupported source type: ${req.source}`);
            }

            rowsOk = parsedRows.length;

        } catch (error) {
            console.error('Error parsing remittance:', error);
            rowsErr = 1;
        }

        // Store import record
        await this.db.insert(arRemittanceImport).values({
            id,
            companyId,
            source: req.source,
            filename: req.filename || null,
            uniqHash: payloadHash,
            rowsOk,
            rowsErr,
            payload: req.payload,
            createdBy,
        });

        return { id, rows_ok: rowsOk, rows_err: rowsErr };
    }

    // Parse CAMT.054 XML
    private async parseCamt054(payload: string): Promise<RemittanceRow[]> {
        // Simplified CAMT.054 parser - in production, use proper XML parser
        const rows: RemittanceRow[] = [];

        // Extract credit entries from CAMT.054
        const creditMatches = payload.match(/<CdtDbtInd>CRDT<\/CdtDbtInd>[\s\S]*?<Amt Ccy="([^"]+)">([^<]+)<\/Amt>[\s\S]*?<BookgDt>[\s\S]*?<Dt>([^<]+)<\/Dt>[\s\S]*?<RmtInf>[\s\S]*?<Ustrd>([^<]+)<\/Ustrd>/g);

        if (creditMatches) {
            for (const match of creditMatches) {
                const amountMatch = match.match(/<Amt Ccy="([^"]+)">([^<]+)<\/Amt>/);
                const dateMatch = match.match(/<Dt>([^<]+)<\/Dt>/);
                const refMatch = match.match(/<Ustrd>([^<]+)<\/Ustrd>/);

                if (amountMatch && dateMatch && refMatch) {
                    rows.push({
                        date: dateMatch[1],
                        amount: Number(amountMatch[2]),
                        currency: amountMatch[1],
                        payerName: 'Unknown', // Would extract from CAMT.054
                        references: [refMatch[1]],
                        rawData: { match },
                    });
                }
            }
        }

        return rows;
    }

    // Parse CSV remittance
    private async parseCsv(payload: string): Promise<RemittanceRow[]> {
        const rows: RemittanceRow[] = [];
        const lines = payload.split('\n');

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const columns = line.split(',');
            if (columns.length >= 4) {
                rows.push({
                    date: columns[0],
                    amount: Number(columns[1]),
                    currency: columns[2],
                    payerName: columns[3],
                    references: columns.slice(4),
                    rawData: { line, columns },
                });
            }
        }

        return rows;
    }

    // Parse email remittance
    private async parseEmail(payload: string): Promise<RemittanceRow[]> {
        // Simplified email parser - in production, use proper email parsing
        const rows: RemittanceRow[] = [];

        // Extract payment information from email body
        const amountMatches = payload.match(/(\d+\.\d{2})/g);
        const dateMatches = payload.match(/(\d{4}-\d{2}-\d{2})/g);
        const refMatches = payload.match(/ref[:\s]+([A-Z0-9]+)/gi);

        if (amountMatches && dateMatches) {
            rows.push({
                date: dateMatches[0],
                amount: Number(amountMatches[0]),
                currency: 'USD', // Default - would extract from email
                payerName: 'Email Sender',
                references: refMatches ? refMatches.map(r => r.replace(/ref[:\s]+/i, '')) : [],
                rawData: { payload },
            });
        }

        return rows;
    }

    // Find invoice candidates for matching
    async findInvoiceCandidates(
        companyId: string,
        amount: number,
        currency: string,
        references: string[],
        customerId?: string
    ): Promise<InvoiceCandidate[]> {
        const query = `
      WITH ar_invoices AS (
        SELECT 
          jl.journal_id as invoice_id,
          jl.party_id as customer_id,
          j.source_id as invoice_no,
          jl.amount,
          j.currency,
          j.posting_date as due_date,
          EXTRACT(DAYS FROM CURRENT_DATE - j.posting_date)::int as days_overdue
        FROM journal_line jl
        JOIN journal j ON jl.journal_id = j.id
        WHERE j.company_id = $1
          AND jl.party_type = 'Customer'
          AND jl.dc = 'D'
          AND j.source_doctype IN ('Sales Invoice', 'AR Invoice')
          AND j.currency = $3
          AND ABS(jl.amount - $2) <= $2 * 0.05  -- 5% tolerance
          ${customerId ? 'AND jl.party_id = $4' : ''}
      )
      SELECT 
        invoice_id,
        customer_id,
        invoice_no,
        amount::numeric,
        currency,
        due_date::text,
        days_overdue
      FROM ar_invoices
      ORDER BY ABS(amount - $2), days_overdue DESC
      LIMIT 20
    `;

        const params = customerId ? [companyId, amount, currency, customerId] : [companyId, amount, currency];
        const { rows } = await this.db.query(query, params);

        return rows.map(row => ({
            id: row.invoice_id,
            customerId: row.customer_id,
            invoiceNo: row.invoice_no,
            amount: Number(row.amount),
            currency: row.currency,
            dueDate: row.due_date,
            daysOverdue: row.days_overdue,
        }));
    }

    // Calculate match confidence score
    calculateConfidence(
        receipt: RemittanceRow,
        invoice: InvoiceCandidate,
        references: string[]
    ): number {
        let score = 0;

        // Exact amount match (60% weight)
        if (Math.abs(receipt.amount - invoice.amount) < 0.01) {
            score += 0.6;
        } else {
            // Amount within tolerance (30% weight)
            const tolerance = Math.max(receipt.amount * 0.05, 1.0);
            if (Math.abs(receipt.amount - invoice.amount) <= tolerance) {
                score += 0.3;
            }
        }

        // Reference match (30% weight)
        if (references.length > 0) {
            const hasRefMatch = references.some(ref =>
                invoice.invoiceNo.toLowerCase().includes(ref.toLowerCase()) ||
                ref.toLowerCase().includes(invoice.invoiceNo.toLowerCase())
            );
            if (hasRefMatch) {
                score += 0.3;
            }
        }

        // Recency bonus (10% weight)
        if (invoice.daysOverdue <= 30) {
            score += 0.1;
        }

        return Math.min(score, 1.0);
    }

    // Run cash application
    async runCashApplication(
        companyId: string,
        req: CashAppRunReqType,
        createdBy: string
    ): Promise<CashAppResultType> {
        const runId = ulid();

        let receiptsProcessed = 0;
        let autoMatched = 0;
        let partialMatches = 0;
        let unmatched = 0;

        try {
            // Get recent remittance imports
            const imports = await this.db
                .select()
                .from(arRemittanceImport)
                .where(eq(arRemittanceImport.companyId, companyId))
                .orderBy(desc(arRemittanceImport.createdAt))
                .limit(10);

            for (const importRecord of imports) {
                // Parse remittance rows
                let rows: RemittanceRow[] = [];
                try {
                    switch (importRecord.source) {
                        case 'CAMT054':
                            rows = await this.parseCamt054(importRecord.payload);
                            break;
                        case 'CSV':
                            rows = await this.parseCsv(importRecord.payload);
                            break;
                        case 'EMAIL':
                            rows = await this.parseEmail(importRecord.payload);
                            break;
                    }
                } catch (error) {
                    console.error('Error parsing remittance:', error);
                    continue;
                }

                for (const row of rows) {
                    receiptsProcessed++;

                    // Find invoice candidates
                    const candidates = await this.findInvoiceCandidates(
                        companyId,
                        row.amount,
                        row.currency,
                        row.references
                    );

                    if (candidates.length === 0) {
                        unmatched++;
                        if (!req.dry_run) {
                            await this.createUnmatchedReceipt(companyId, row, createdBy);
                        }
                        continue;
                    }

                    // Calculate confidence scores
                    const matches: MatchResult[] = candidates.map(candidate => ({
                        confidence: this.calculateConfidence(row, candidate, row.references),
                        invoiceId: candidate.id,
                        matchAmount: Math.min(row.amount, candidate.amount),
                        reason: this.getMatchReason(row, candidate, row.references),
                    }));

                    // Sort by confidence
                    matches.sort((a, b) => b.confidence - a.confidence);
                    const bestMatch = matches[0];

                    if (bestMatch.confidence >= req.min_confidence) {
                        if (!req.dry_run) {
                            await this.createMatchedReceipt(
                                companyId,
                                row,
                                bestMatch,
                                createdBy
                            );
                        }
                        autoMatched++;
                    } else {
                        partialMatches++;
                        if (!req.dry_run) {
                            await this.createPartialReceipt(
                                companyId,
                                row,
                                matches,
                                createdBy
                            );
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error in cash application run:', error);
            throw error;
        }

        return {
            company_id: companyId,
            receipts_processed: receiptsProcessed,
            auto_matched: autoMatched,
            partial_matches: partialMatches,
            unmatched,
            confidence_threshold: req.min_confidence,
            dry_run: req.dry_run,
            run_id: runId,
        };
    }

    // Create matched receipt
    private async createMatchedReceipt(
        companyId: string,
        receipt: RemittanceRow,
        match: MatchResult,
        createdBy: string
    ): Promise<void> {
        const cashAppId = ulid();

        await this.db.insert(arCashApp).values({
            id: cashAppId,
            companyId,
            receiptDate: receipt.date,
            ccy: receipt.currency,
            amount: receipt.amount,
            reference: receipt.references.join(', '),
            confidence: match.confidence,
            status: 'matched',
            createdBy,
        });

        await this.db.insert(arCashAppLink).values({
            id: ulid(),
            cashAppId,
            invoiceId: match.invoiceId,
            linkAmount: match.matchAmount,
        });

        // Emit receipt signal for M22
        await this.emitReceiptSignal(companyId, receipt, 'AUTO_MATCH', cashAppId);
    }

    // Create partial receipt
    private async createPartialReceipt(
        companyId: string,
        receipt: RemittanceRow,
        matches: MatchResult[],
        createdBy: string
    ): Promise<void> {
        const cashAppId = ulid();

        await this.db.insert(arCashApp).values({
            id: cashAppId,
            companyId,
            receiptDate: receipt.date,
            ccy: receipt.currency,
            amount: receipt.amount,
            reference: receipt.references.join(', '),
            confidence: matches[0].confidence,
            status: 'partial',
            createdBy,
        });

        // Create links for all potential matches
        for (const match of matches) {
            await this.db.insert(arCashAppLink).values({
                id: ulid(),
                cashAppId,
                invoiceId: match.invoiceId,
                linkAmount: match.matchAmount,
            });
        }
    }

    // Create unmatched receipt
    private async createUnmatchedReceipt(
        companyId: string,
        receipt: RemittanceRow,
        createdBy: string
    ): Promise<void> {
        const cashAppId = ulid();

        await this.db.insert(arCashApp).values({
            id: cashAppId,
            companyId,
            receiptDate: receipt.date,
            ccy: receipt.currency,
            amount: receipt.amount,
            reference: receipt.references.join(', '),
            confidence: 0,
            status: 'unmatched',
            createdBy,
        });
    }

    // Emit receipt signal for M22 integration
    private async emitReceiptSignal(
        companyId: string,
        receipt: RemittanceRow,
        source: 'AUTO_MATCH' | 'PTP' | 'MANUAL',
        refId: string
    ): Promise<void> {
        const receiptDate = new Date(receipt.date);
        const weekStart = new Date(receiptDate);
        weekStart.setDate(receiptDate.getDate() - receiptDate.getDay()); // Start of week

        await this.db.insert(cfReceiptSignal).values({
            id: ulid(),
            companyId,
            weekStart: weekStart.toISOString().split('T')[0],
            ccy: receipt.currency,
            amount: receipt.amount,
            source,
            refId,
        });
    }

    // Get match reason
    private getMatchReason(
        receipt: RemittanceRow,
        invoice: InvoiceCandidate,
        references: string[]
    ): string {
        const reasons: string[] = [];

        if (Math.abs(receipt.amount - invoice.amount) < 0.01) {
            reasons.push('exact_amount');
        } else {
            reasons.push('amount_within_tolerance');
        }

        if (references.length > 0) {
            const hasRefMatch = references.some(ref =>
                invoice.invoiceNo.toLowerCase().includes(ref.toLowerCase())
            );
            if (hasRefMatch) {
                reasons.push('reference_match');
            }
        }

        if (invoice.daysOverdue <= 30) {
            reasons.push('recent_invoice');
        }

        return reasons.join(', ');
    }

    // Get cash application matches
    async getCashAppMatches(
        companyId: string,
        status?: 'matched' | 'partial' | 'unmatched' | 'rejected'
    ): Promise<CashAppMatchType[]> {
        let query = this.db
            .select()
            .from(arCashApp)
            .where(eq(arCashApp.companyId, companyId));

        if (status) {
            query = query.where(eq(arCashApp.status, status));
        }

        const receipts = await query.orderBy(desc(arCashApp.createdAt));

        const results: CashAppMatchType[] = [];
        for (const receipt of receipts) {
            const links = await this.db
                .select()
                .from(arCashAppLink)
                .where(eq(arCashAppLink.cashAppId, receipt.id));

            results.push({
                id: receipt.id,
                receipt_date: receipt.receiptDate,
                amount: Number(receipt.amount),
                ccy: receipt.ccy,
                customer_id: receipt.customerId || undefined,
                reference: receipt.reference || undefined,
                confidence: Number(receipt.confidence),
                status: receipt.status as any,
                links: links.map(link => ({
                    invoice_id: link.invoiceId,
                    link_amount: Number(link.linkAmount),
                })),
            });
        }

        return results;
    }
}
