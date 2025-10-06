import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { createHash } from 'crypto';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import {
  arFinanceChargePolicy,
  arStatementRun,
  arStatementLine,
  arStatementArtifact,
  arStatementEmail,
  arPortalLedgerToken,
  arInvoice,
  arCashApp,
  arCashAppLink,
  arPtp,
  arDispute,
} from '@aibos/db-adapter/schema';
import type {
  FinanceChargePolicyUpsertType,
  StatementRunReqType,
  StatementEmailReqType,
  StatementRunResType,
  StatementEmailResType,
} from '@aibos/contracts';

export class ArStatementService {
  constructor(private dbInstance = db) {}

  /**
   * Get finance charge policy
   */
  async getFinanceChargePolicy(
    companyId: string
  ): Promise<FinanceChargePolicyUpsertType | null> {
    const policy = await this.dbInstance
      .select()
      .from(arFinanceChargePolicy)
      .where(eq(arFinanceChargePolicy.companyId, companyId))
      .limit(1);

    if (policy.length === 0) {
      return null;
    }

    const p = policy[0]!;
    return {
      enabled: p.enabled,
      annual_pct: Number(p.annualPct),
      min_fee: Number(p.minFee),
      grace_days: p.graceDays,
      comp_method: p.compMethod as 'simple' | 'daily',
      present_ccy: p.presentCcy || undefined,
    };
  }

  /**
   * Upsert finance charge policy
   */
  async upsertFinanceChargePolicy(
    companyId: string,
    req: FinanceChargePolicyUpsertType,
    updatedBy: string
  ): Promise<{ success: boolean; message: string }> {
    await this.dbInstance
      .insert(arFinanceChargePolicy)
      .values({
        companyId,
        enabled: req.enabled,
        annualPct: req.annual_pct.toString(),
        minFee: req.min_fee.toString(),
        graceDays: req.grace_days,
        compMethod: req.comp_method,
        presentCcy: req.present_ccy,
        updatedBy,
      })
      .onConflictDoUpdate({
        target: arFinanceChargePolicy.companyId,
        set: {
          enabled: req.enabled,
          annualPct: req.annual_pct.toString(),
          minFee: req.min_fee.toString(),
          graceDays: req.grace_days,
          compMethod: req.comp_method,
          presentCcy: req.present_ccy,
          updatedBy,
        },
      });

    return { success: true, message: 'Finance charge policy updated' };
  }

  /**
   * Run statement generation
   */
  async runStatementGeneration(
    companyId: string,
    req: StatementRunReqType,
    createdBy: string
  ): Promise<StatementRunResType> {
    const runId = ulid();
    const asOfDate = new Date(req.as_of_date);

    // Create statement run
    await this.dbInstance.insert(arStatementRun).values({
      id: runId,
      companyId,
      asOfDate: asOfDate.toISOString().split('T')[0]!,
      presentCcy: req.present,
      status: 'draft',
      createdBy,
    });

    try {
      // Compose ledger lines for all customers
      const ledgerLines = await this.composeCustomerLedgers(
        companyId,
        asOfDate,
        req.present
      );

      // Calculate finance charges if enabled
      const financeChargeLines = await this.calculateFinanceCharges(
        companyId,
        asOfDate,
        req.present
      );

      // Combine and sort all lines
      const allLines = [...ledgerLines, ...financeChargeLines].sort((a, b) => {
        const customerCompare = a.customerId.localeCompare(b.customerId);
        if (customerCompare !== 0) return customerCompare;

        const dateA =
          typeof a.docDate === 'string' ? new Date(a.docDate) : a.docDate;
        const dateB =
          typeof b.docDate === 'string' ? new Date(b.docDate) : b.docDate;
        return dateA.getTime() - dateB.getTime();
      });

      // Write statement lines
      let customersProcessed = 0;
      let artifactsGenerated = 0;
      const errors: string[] = [];

      for (const line of allLines) {
        try {
          await this.dbInstance.insert(arStatementLine).values({
            id: ulid(),
            runId,
            companyId: line.companyId,
            customerId: line.customerId,
            docType: line.docType,
            docId: line.docId,
            docDate: line.docDate.toISOString().split('T')[0]!,
            dueDate: line.dueDate
              ? line.dueDate.toISOString().split('T')[0]!
              : null,
            ref: line.ref,
            memo: line.memo,
            debit: line.debit.toString(),
            credit: line.credit.toString(),
            balance: line.balance.toString(),
            bucket: line.bucket,
            currency: line.currency,
            sortKey: line.sortKey,
          });
        } catch (error) {
          errors.push(
            `Failed to insert line for customer ${line.customerId}: ${error}`
          );
        }
      }

      // Calculate customers processed from all lines
      const customers = [...new Set(allLines.map(l => l.customerId))];
      customersProcessed = customers.length;

      // Generate artifacts (PDF/CSV) if requested
      if (req.include_pdf || req.include_csv) {
        for (const customerId of customers) {
          try {
            if (req.include_pdf) {
              await this.generateStatementPDF(runId, customerId);
              artifactsGenerated++;
            }
            if (req.include_csv) {
              await this.generateStatementCSV(runId, customerId);
              artifactsGenerated++;
            }
          } catch (error) {
            errors.push(
              `Failed to generate artifacts for customer ${customerId}: ${error}`
            );
          }
        }
      }

      // Update run status
      const status =
        errors.length > 0 ? 'error' : req.finalize ? 'finalized' : 'draft';
      await this.dbInstance
        .update(arStatementRun)
        .set({
          status,
          totalsJson: {
            customersProcessed,
            artifactsGenerated,
            totalLines: allLines.length,
            errors: errors.length,
          },
        })
        .where(eq(arStatementRun.id, runId));

      return {
        run_id: runId,
        status,
        customers_processed: customersProcessed,
        artifacts_generated: artifactsGenerated,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      // Mark run as error
      await this.dbInstance
        .update(arStatementRun)
        .set({ status: 'error' })
        .where(eq(arStatementRun.id, runId));

      throw error;
    }
  }

  /**
   * Compose customer ledger lines from invoices, payments, etc.
   */
  private async composeCustomerLedgers(
    companyId: string,
    asOfDate: Date,
    presentCcy: string
  ): Promise<StatementLine[]> {
    const lines: StatementLine[] = [];

    // Get all open invoices
    const invoices = await this.dbInstance
      .select()
      .from(arInvoice)
      .where(
        and(
          eq(arInvoice.companyId, companyId),
          eq(arInvoice.status, 'OPEN'),
          lte(arInvoice.invoiceDate, asOfDate.toISOString().split('T')[0]!)
        )
      );

    // Get all matched cash applications
    const payments = await this.dbInstance
      .select({
        cashApp: arCashApp,
        link: arCashAppLink,
      })
      .from(arCashApp)
      .innerJoin(arCashAppLink, eq(arCashApp.id, arCashAppLink.cashAppId))
      .where(
        and(
          eq(arCashApp.companyId, companyId),
          eq(arCashApp.status, 'matched'),
          lte(arCashApp.receiptDate, asOfDate.toISOString().split('T')[0]!)
        )
      );

    // Process invoices
    for (const invoice of invoices) {
      const bucket = this.calculateAgingBucket(invoice.dueDate, asOfDate);
      const balance = Number(invoice.grossAmount) - Number(invoice.paidAmount);

      if (balance > 0) {
        lines.push({
          companyId,
          customerId: invoice.customerId,
          docType: 'INVOICE',
          docId: invoice.id,
          docDate: new Date(invoice.invoiceDate),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
          ref: invoice.invoiceNo,
          memo: 'Invoice',
          debit: balance,
          credit: 0,
          balance: balance, // Will be recalculated with running balance
          bucket,
          currency: invoice.ccy,
          sortKey: `${invoice.invoiceDate}_INV_${invoice.id}`,
        });
      }
    }

    // Process payments
    for (const payment of payments) {
      lines.push({
        companyId,
        customerId: payment.cashApp.customerId!,
        docType: 'PAYMENT',
        docId: payment.link.id,
        docDate: new Date(payment.cashApp.receiptDate),
        dueDate: null,
        ref: payment.cashApp.reference,
        memo: 'Payment',
        debit: 0,
        credit: Number(payment.link.linkAmount),
        balance: 0, // Will be recalculated
        bucket: 'CURRENT',
        currency: payment.cashApp.ccy,
        sortKey: `${payment.cashApp.receiptDate}_PAY_${payment.link.id}`,
      });
    }

    // Calculate running balances per customer
    const customerLines = new Map<string, StatementLine[]>();
    for (const line of lines) {
      if (!customerLines.has(line.customerId)) {
        customerLines.set(line.customerId, []);
      }
      customerLines.get(line.customerId)!.push(line);
    }

    const finalLines: StatementLine[] = [];
    for (const [customerId, customerLineList] of customerLines) {
      // Sort by date - handle both Date objects and strings
      customerLineList.sort((a, b) => {
        const dateA =
          typeof a.docDate === 'string' ? new Date(a.docDate) : a.docDate;
        const dateB =
          typeof b.docDate === 'string' ? new Date(b.docDate) : b.docDate;
        return dateA.getTime() - dateB.getTime();
      });

      let runningBalance = 0;
      for (const line of customerLineList) {
        runningBalance += line.debit - line.credit;
        line.balance = runningBalance;
        finalLines.push(line);
      }
    }

    return finalLines;
  }

  /**
   * Calculate finance charges for overdue invoices
   */
  private async calculateFinanceCharges(
    companyId: string,
    asOfDate: Date,
    presentCcy: string
  ): Promise<StatementLine[]> {
    const policy = await this.dbInstance
      .select()
      .from(arFinanceChargePolicy)
      .where(eq(arFinanceChargePolicy.companyId, companyId))
      .limit(1);

    if (policy.length === 0 || !policy[0]?.enabled) {
      return [];
    }

    const p = policy[0]!;
    const lines: StatementLine[] = [];

    // Get overdue invoices
    const overdueDate = new Date(asOfDate);
    overdueDate.setDate(overdueDate.getDate() - p.graceDays);

    const overdueInvoices = await this.dbInstance
      .select()
      .from(arInvoice)
      .where(
        and(
          eq(arInvoice.companyId, companyId),
          eq(arInvoice.status, 'OPEN'),
          lte(arInvoice.dueDate, overdueDate.toISOString().split('T')[0]!),
          lte(arInvoice.invoiceDate, asOfDate.toISOString().split('T')[0]!)
        )
      );

    for (const invoice of overdueInvoices) {
      const dueDate =
        typeof invoice.dueDate === 'string'
          ? new Date(invoice.dueDate)
          : invoice.dueDate;
      const daysOverdue = Math.floor(
        (asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const principal =
        Number(invoice.grossAmount) - Number(invoice.paidAmount);

      if (principal > 0 && daysOverdue > p.graceDays) {
        let charge = 0;

        if (p.compMethod === 'simple') {
          charge = (principal * Number(p.annualPct) * daysOverdue) / 365;
        } else {
          // Daily compounding
          charge =
            principal * Math.pow(1 + Number(p.annualPct) / 365, daysOverdue) -
            principal;
        }

        // Apply minimum fee
        charge = Math.max(charge, Number(p.minFee));

        if (charge > 0) {
          lines.push({
            companyId,
            customerId: invoice.customerId,
            docType: 'FINANCE_CHARGE',
            docId: `FC_${invoice.id}`,
            docDate: asOfDate,
            dueDate: null,
            ref: `FC-${invoice.invoiceNo}`,
            memo: `Finance charge (${daysOverdue} days overdue)`,
            debit: charge,
            credit: 0,
            balance: 0, // Will be recalculated
            bucket: this.calculateAgingBucket(dueDate, asOfDate),
            currency: p.presentCcy || invoice.ccy,
            sortKey: `${asOfDate.toISOString()}_FC_${invoice.id}`,
          });
        }
      }
    }

    return lines;
  }

  /**
   * Calculate aging bucket for a due date
   */
  private calculateAgingBucket(dueDate: Date | string, asOfDate: Date): string {
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const daysPastDue = Math.floor(
      (asOfDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysPastDue <= 0) return 'CURRENT';
    if (daysPastDue <= 30) return '1-30';
    if (daysPastDue <= 60) return '31-60';
    if (daysPastDue <= 90) return '61-90';
    return '90+';
  }

  /**
   * Generate statement PDF (placeholder implementation)
   */
  private async generateStatementPDF(
    runId: string,
    customerId: string
  ): Promise<void> {
    const artifactId = ulid();
    const filename = `statement_${customerId}_${runId}.pdf`;
    const content = `PDF content for customer ${customerId}`;
    const sha256 = createHash('sha256').update(content).digest('hex');

    await this.dbInstance.insert(arStatementArtifact).values({
      id: artifactId,
      runId,
      customerId,
      kind: 'PDF',
      filename,
      sha256,
      bytes: content.length,
      storageUri: `file://statements/${filename}`,
    });
  }

  /**
   * Generate statement CSV (placeholder implementation)
   */
  private async generateStatementCSV(
    runId: string,
    customerId: string
  ): Promise<void> {
    const artifactId = ulid();
    const filename = `statement_${customerId}_${runId}.csv`;
    const content = `CSV content for customer ${customerId}`;
    const sha256 = createHash('sha256').update(content).digest('hex');

    await this.dbInstance.insert(arStatementArtifact).values({
      id: artifactId,
      runId,
      customerId,
      kind: 'CSV',
      filename,
      sha256,
      bytes: content.length,
      storageUri: `file://statements/${filename}`,
    });
  }

  /**
   * Send statement emails
   */
  async sendStatementEmails(
    companyId: string,
    req: StatementEmailReqType,
    createdBy: string
  ): Promise<StatementEmailResType> {
    const run = await this.dbInstance
      .select()
      .from(arStatementRun)
      .where(eq(arStatementRun.id, req.run_id))
      .limit(1);

    if (run.length === 0) {
      throw new Error('Statement run not found');
    }

    // Get customers with artifacts
    const customers = await this.dbInstance
      .selectDistinct({ customerId: arStatementLine.customerId })
      .from(arStatementLine)
      .where(eq(arStatementLine.runId, req.run_id));

    let emailsQueued = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    for (const customer of customers) {
      try {
        const emailId = ulid();
        await this.dbInstance.insert(arStatementEmail).values({
          id: emailId,
          runId: req.run_id,
          customerId: customer.customerId,
          toAddr: `customer-${customer.customerId}@example.com`, // TODO: Get from customer master
          status: 'queued',
        });
        emailsQueued++;

        // Simulate email sending
        await this.dbInstance
          .update(arStatementEmail)
          .set({
            status: 'sent',
            sentAt: new Date(),
          })
          .where(eq(arStatementEmail.id, emailId));
        emailsSent++;
      } catch (error) {
        emailsFailed++;
        errors.push(
          `Failed to send email to customer ${customer.customerId}: ${error}`
        );
      }
    }

    return {
      emails_queued: emailsQueued,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * List statement runs
   */
  async listStatementRuns(
    companyId: string,
    options: {
      limit: number;
      offset: number;
      status?: string;
      asOfDate?: string;
    }
  ): Promise<{
    runs: Array<{
      id: string;
      as_of_date: string;
      present_ccy: string;
      status: string;
      customers_processed: number;
      artifacts_generated: number;
      created_at: string;
      created_by: string;
    }>;
    total: number;
  }> {
    let whereConditions = [eq(arStatementRun.companyId, companyId)];

    if (options.status) {
      whereConditions.push(eq(arStatementRun.status, options.status));
    }

    if (options.asOfDate) {
      whereConditions.push(eq(arStatementRun.asOfDate, options.asOfDate));
    }

    const runs = await this.dbInstance
      .select()
      .from(arStatementRun)
      .where(and(...whereConditions))
      .orderBy(desc(arStatementRun.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    // Get counts for each run
    const runsWithCounts = await Promise.all(
      runs.map(async run => {
        const customerCount = await this.dbInstance
          .selectDistinct({ customerId: arStatementLine.customerId })
          .from(arStatementLine)
          .where(eq(arStatementLine.runId, run.id));

        const artifactCount = await this.dbInstance
          .select({ count: sql<number>`count(*)` })
          .from(arStatementArtifact)
          .where(eq(arStatementArtifact.runId, run.id));

        return {
          id: run.id,
          as_of_date: run.asOfDate,
          present_ccy: run.presentCcy,
          status: run.status,
          customers_processed: customerCount.length,
          artifacts_generated: artifactCount[0]?.count || 0,
          created_at: run.createdAt.toISOString(),
          created_by: run.createdBy,
        };
      })
    );

    // Get total count
    const totalResult = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(arStatementRun)
      .where(and(...whereConditions));

    return {
      runs: runsWithCounts,
      total: totalResult[0]?.count || 0,
    };
  }

  /**
   * Download statement artifact
   */
  async downloadStatementArtifact(
    companyId: string,
    artifactId: string
  ): Promise<{
    content: Buffer;
    contentType: string;
    filename: string;
    contentLength: number;
  } | null> {
    const artifact = await this.dbInstance
      .select()
      .from(arStatementArtifact)
      .innerJoin(
        arStatementRun,
        eq(arStatementArtifact.runId, arStatementRun.id)
      )
      .where(
        and(
          eq(arStatementArtifact.id, artifactId),
          eq(arStatementRun.companyId, companyId)
        )
      )
      .limit(1);

    if (artifact.length === 0) {
      return null;
    }

    const a = artifact[0]!.ar_statement_artifact;

    // For now, return mock content based on artifact type
    // In production, this would read from the actual storage URI
    const content =
      a.kind === 'PDF'
        ? Buffer.from(`PDF content for ${a.filename}`)
        : Buffer.from(`CSV content for ${a.filename}`);

    const contentType = a.kind === 'PDF' ? 'application/pdf' : 'text/csv';

    return {
      content,
      contentType,
      filename: a.filename,
      contentLength: content.length,
    };
  }

  /**
   * Get customers for a statement run
   */
  async getStatementRunCustomers(
    companyId: string,
    runId: string
  ): Promise<{
    run_id: string;
    as_of_date: string;
    present_ccy: string;
    status: string;
    customers: Array<{
      customer_id: string;
      opening_balance: number;
      closing_balance: number;
      total_debits: number;
      total_credits: number;
      line_count: number;
      artifacts: Array<{
        id: string;
        kind: string;
        filename: string;
        bytes: number;
      }>;
    }>;
  } | null> {
    // Verify run exists and belongs to company
    const run = await this.dbInstance
      .select()
      .from(arStatementRun)
      .where(
        and(
          eq(arStatementRun.id, runId),
          eq(arStatementRun.companyId, companyId)
        )
      )
      .limit(1);

    if (run.length === 0) {
      return null;
    }

    const r = run[0]!;

    // Get all customers for this run
    const customers = await this.dbInstance
      .selectDistinct({ customerId: arStatementLine.customerId })
      .from(arStatementLine)
      .where(eq(arStatementLine.runId, runId));

    // Get customer details with balances and artifacts
    const customerDetails = await Promise.all(
      customers.map(async customer => {
        // Get lines for this customer
        const lines = await this.dbInstance
          .select()
          .from(arStatementLine)
          .where(
            and(
              eq(arStatementLine.runId, runId),
              eq(arStatementLine.customerId, customer.customerId)
            )
          )
          .orderBy(arStatementLine.sortKey);

        // Calculate balances
        const openingBalance =
          lines.length > 0
            ? Number(lines[0]!.balance) -
              Number(lines[0]!.debit) +
              Number(lines[0]!.credit)
            : 0;
        const closingBalance =
          lines.length > 0 ? Number(lines[lines.length - 1]!.balance) : 0;
        const totalDebits = lines.reduce(
          (sum, line) => sum + Number(line.debit),
          0
        );
        const totalCredits = lines.reduce(
          (sum, line) => sum + Number(line.credit),
          0
        );

        // Get artifacts for this customer
        const artifacts = await this.dbInstance
          .select()
          .from(arStatementArtifact)
          .where(
            and(
              eq(arStatementArtifact.runId, runId),
              eq(arStatementArtifact.customerId, customer.customerId)
            )
          );

        return {
          customer_id: customer.customerId,
          opening_balance: openingBalance,
          closing_balance: closingBalance,
          total_debits: totalDebits,
          total_credits: totalCredits,
          line_count: lines.length,
          artifacts: artifacts.map(a => ({
            id: a.id,
            kind: a.kind,
            filename: a.filename,
            bytes: a.bytes,
          })),
        };
      })
    );

    return {
      run_id: r.id,
      as_of_date: r.asOfDate,
      present_ccy: r.presentCcy,
      status: r.status,
      customers: customerDetails,
    };
  }

  /**
   * Get failed email runs for retry
   */
  async getFailedEmailRuns(
    companyId: string,
    daysBack: number = 7
  ): Promise<Array<{ id: string; as_of_date: string; created_at: string }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const runs = await this.dbInstance
      .select({
        id: arStatementRun.id,
        as_of_date: arStatementRun.asOfDate,
        created_at: arStatementRun.createdAt,
      })
      .from(arStatementRun)
      .where(
        and(
          eq(arStatementRun.companyId, companyId),
          eq(arStatementRun.status, 'finalized'),
          gte(arStatementRun.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(arStatementRun.createdAt));

    // Filter runs that have failed emails
    const runsWithFailedEmails = await Promise.all(
      runs.map(async run => {
        const failedEmails = await this.dbInstance
          .select({ count: sql<number>`count(*)` })
          .from(arStatementEmail)
          .where(
            and(
              eq(arStatementEmail.runId, run.id),
              eq(arStatementEmail.status, 'error')
            )
          );

        return {
          run,
          failedCount: failedEmails[0]?.count || 0,
        };
      })
    );

    return runsWithFailedEmails
      .filter(r => r.failedCount > 0)
      .map(r => ({
        id: r.run.id,
        as_of_date: r.run.as_of_date,
        created_at: r.run.created_at.toISOString(),
      }));
  }
}

// Types
interface StatementLine {
  companyId: string;
  customerId: string;
  docType: string;
  docId: string | null;
  docDate: Date;
  dueDate: Date | null;
  ref: string | null;
  memo: string | null;
  debit: number;
  credit: number;
  balance: number;
  bucket: string;
  currency: string;
  sortKey: string;
}
