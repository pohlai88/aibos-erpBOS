import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import {
  rbBillingRun,
  rbInvoice,
  rbInvoiceLine,
  rbInvoiceArtifact,
  rbInvoiceEmail,
  rbPostLock,
  rbSubscription,
  rbProduct,
  rbPrice,
  rbUsageRollup,
} from '@aibos/db-adapter/schema';
import type {
  BillingRunReqType,
  InvoiceFinalizeReqType,
  InvoiceQueryType,
  BillingRunResponseType,
  InvoiceResponseType,
  InvoiceLineResponseType,
} from '@aibos/contracts';
import { RbTaxService } from './tax';
import { getFxQuotesForDateOrBefore } from '@/lib/fx';
import { DefaultFxPolicy } from '@aibos/policies';
import {
  RbError,
  RbValidationError,
  RbBusinessLogicError,
  RbValidator,
  withErrorHandling,
} from './errors';

export class RbBillingService {
  private taxService: RbTaxService;

  constructor(private dbInstance = db) {
    this.taxService = new RbTaxService(dbInstance);
  }

  /**
   * Run billing for a period
   */
  async runBilling(
    companyId: string,
    userId: string,
    data: BillingRunReqType
  ): Promise<BillingRunResponseType> {
    const runId = ulid();

    // Create billing run record
    const billingRun = await this.dbInstance
      .insert(rbBillingRun)
      .values({
        id: runId,
        companyId,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        presentCcy: data.present,
        status: 'DRAFT',
        stats: null,
        createdBy: userId,
      })
      .returning();

    const run = billingRun[0]!;

    try {
      // Get subscriptions due for billing
      const subscriptions = await this.getSubscriptionsForBilling(
        companyId,
        data.period_start,
        data.period_end
      );

      let invoicesGenerated = 0;
      let totalAmount = 0;

      // Process each subscription
      for (const subscription of subscriptions) {
        const invoice = await this.generateSubscriptionInvoice(
          companyId,
          userId,
          subscription,
          data.period_start,
          data.period_end,
          data.present,
          runId
        );

        if (invoice) {
          invoicesGenerated++;
          totalAmount += invoice.total;
        }
      }

      // Update billing run stats
      await this.dbInstance
        .update(rbBillingRun)
        .set({
          status: data.dry_run ? 'DRAFT' : 'INVOICED',
          stats: {
            invoices_generated: invoicesGenerated,
            total_amount: totalAmount,
            subscriptions_processed: subscriptions.length,
          },
        })
        .where(eq(rbBillingRun.id, runId));

      return {
        id: run.id,
        company_id: run.companyId,
        period_start: run.periodStart,
        period_end: run.periodEnd,
        present_ccy: run.presentCcy,
        status: data.dry_run ? 'DRAFT' : 'INVOICED',
        stats: {
          invoices_generated: invoicesGenerated,
          total_amount: totalAmount,
          subscriptions_processed: subscriptions.length,
        },
        created_at: run.createdAt.toISOString(),
        created_by: run.createdBy,
      };
    } catch (error) {
      // Mark run as error
      await this.dbInstance
        .update(rbBillingRun)
        .set({
          status: 'ERROR',
          stats: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .where(eq(rbBillingRun.id, runId));

      throw error;
    }
  }

  /**
   * Generate invoice for a subscription
   */
  private async generateSubscriptionInvoice(
    companyId: string,
    userId: string,
    subscription: any,
    periodStart: string,
    periodEnd: string,
    presentCcy: string,
    runId: string
  ): Promise<InvoiceResponseType | null> {
    // Get product and price details
    const products = await this.dbInstance
      .select()
      .from(rbProduct)
      .where(
        and(
          eq(rbProduct.companyId, companyId),
          eq(rbProduct.id, subscription.product_id)
        )
      )
      .limit(1);

    if (products.length === 0) {
      return null;
    }

    const product = products[0]!;

    const prices = await this.dbInstance
      .select()
      .from(rbPrice)
      .where(
        and(
          eq(rbPrice.companyId, companyId),
          eq(rbPrice.id, subscription.price_id)
        )
      )
      .limit(1);

    if (prices.length === 0) {
      return null;
    }

    const price = prices[0]!;

    // Calculate amount based on pricing model
    let amount = 0;
    if (price.model === 'FLAT' && price.unitAmount) {
      amount = Number(price.unitAmount) * Number(subscription.qty);
    }

    // Add usage charges if applicable
    if (product.kind === 'USAGE') {
      const usageData = await this.getUsageForBilling(
        companyId,
        subscription.id,
        periodStart,
        periodEnd
      );

      for (const usage of usageData) {
        amount += Number(price.unitAmount || 0) * usage.qty;
      }
    }

    if (amount === 0) {
      return null; // No charges
    }

    // Get FX rate for present currency
    let fxRate = 1.0;
    if (presentCcy !== 'USD') {
      // Assuming USD is base currency
      try {
        const quotes = await getFxQuotesForDateOrBefore(
          'USD',
          presentCcy,
          new Date().toISOString().split('T')[0]!
        );
        const rate = DefaultFxPolicy.selectRate(
          quotes,
          'USD',
          presentCcy,
          new Date().toISOString().split('T')[0]!
        );
        if (rate) {
          fxRate = rate;
        }
      } catch (error) {
        console.warn(`Failed to get FX rate for ${presentCcy}:`, error);
      }
    }

    // Calculate tax for the line item
    const taxResult = await this.taxService.calculateTaxForLine(
      companyId,
      subscription.customer_id || '',
      {
        productId: subscription.product_id,
        amount: amount,
        customerId: subscription.customer_id || '',
        companyId: companyId,
      }
    );

    const taxAmount = taxResult.taxAmount;
    const totalAmount = amount + taxAmount;

    // Create invoice
    const invoiceId = ulid();
    const invoice = await this.dbInstance
      .insert(rbInvoice)
      .values({
        id: invoiceId,
        companyId,
        customerId: subscription.customer_id || '',
        presentCcy,
        issueDate: new Date().toISOString().split('T')[0]!,
        dueDate: this.calculateDueDate(new Date()),
        status: 'DRAFT',
        subtotal: amount.toString(),
        taxTotal: taxAmount.toString(),
        total: totalAmount.toString(),
        fxPresentRate: fxRate.toString(),
        meta: { billing_run_id: runId },
        createdBy: userId,
      })
      .returning();

    const inv = invoice[0]!;

    // Create invoice line
    await this.dbInstance.insert(rbInvoiceLine).values({
      id: ulid(),
      invoiceId,
      companyId,
      kind: product.kind === 'USAGE' ? 'USAGE' : 'RECURRING',
      productId: product.id,
      description: `${product.name} - ${subscription.start_date} to ${subscription.end_date || periodEnd}`,
      qty: subscription.qty,
      unit: price.unit || 'unit',
      unitPrice: price.unitAmount?.toString() || '0',
      lineSubtotal: amount.toString(),
      taxCode: taxResult.taxCode,
      taxAmount: taxAmount.toString(),
      lineTotal: totalAmount.toString(),
    });

    return {
      id: inv.id,
      company_id: inv.companyId,
      customer_id: inv.customerId,
      present_ccy: inv.presentCcy,
      issue_date: inv.issueDate,
      due_date: inv.dueDate,
      status: inv.status as 'DRAFT' | 'FINAL' | 'VOID' | 'PAID' | 'PARTIAL',
      subtotal: Number(inv.subtotal),
      tax_total: Number(inv.taxTotal),
      total: Number(inv.total),
      fx_present_rate: inv.fxPresentRate
        ? Number(inv.fxPresentRate)
        : undefined,
      portal_link: inv.portalLink || undefined,
      meta: inv.meta || undefined,
      created_at: inv.createdAt.toISOString(),
      created_by: inv.createdBy,
    };
  }

  /**
   * Finalize an invoice
   */
  async finalizeInvoice(
    companyId: string,
    data: InvoiceFinalizeReqType
  ): Promise<InvoiceResponseType> {
    const invoices = await this.dbInstance
      .select()
      .from(rbInvoice)
      .where(
        and(
          eq(rbInvoice.companyId, companyId),
          eq(rbInvoice.id, data.invoice_id)
        )
      )
      .limit(1);

    if (invoices.length === 0) {
      throw new Error(`Invoice ${data.invoice_id} not found`);
    }

    const invoice = invoices[0]!;

    if (invoice.status !== 'DRAFT') {
      throw new Error(`Invoice ${data.invoice_id} is not in DRAFT status`);
    }

    const updatedInvoice = await this.dbInstance
      .update(rbInvoice)
      .set({
        status: 'FINAL',
        issueDate: data.issue_date || invoice.issueDate,
        dueDate: data.due_date || invoice.dueDate,
      })
      .where(eq(rbInvoice.id, data.invoice_id))
      .returning();

    const inv = updatedInvoice[0]!;

    return {
      id: inv.id,
      company_id: inv.companyId,
      customer_id: inv.customerId,
      present_ccy: inv.presentCcy,
      issue_date: inv.issueDate,
      due_date: inv.dueDate,
      status: inv.status as 'DRAFT' | 'FINAL' | 'VOID' | 'PAID' | 'PARTIAL',
      subtotal: Number(inv.subtotal),
      tax_total: Number(inv.taxTotal),
      total: Number(inv.total),
      fx_present_rate: inv.fxPresentRate
        ? Number(inv.fxPresentRate)
        : undefined,
      portal_link: inv.portalLink || undefined,
      meta: inv.meta || undefined,
      created_at: inv.createdAt.toISOString(),
      created_by: inv.createdBy,
    };
  }

  /**
   * Get invoices with optional filtering
   */
  async getInvoices(
    companyId: string,
    query: InvoiceQueryType
  ): Promise<InvoiceResponseType[]> {
    const conditions = [eq(rbInvoice.companyId, companyId)];

    if (query.customer_id) {
      conditions.push(eq(rbInvoice.customerId, query.customer_id));
    }
    if (query.status) {
      conditions.push(eq(rbInvoice.status, query.status));
    }
    if (query.period_start) {
      conditions.push(gte(rbInvoice.issueDate, query.period_start));
    }
    if (query.period_end) {
      conditions.push(lte(rbInvoice.issueDate, query.period_end));
    }

    const invoices = await this.dbInstance
      .select()
      .from(rbInvoice)
      .where(and(...conditions))
      .orderBy(desc(rbInvoice.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return invoices.map(inv => ({
      id: inv.id,
      company_id: inv.companyId,
      customer_id: inv.customerId,
      present_ccy: inv.presentCcy,
      issue_date: inv.issueDate,
      due_date: inv.dueDate,
      status: inv.status as 'DRAFT' | 'FINAL' | 'VOID' | 'PAID' | 'PARTIAL',
      subtotal: Number(inv.subtotal),
      tax_total: Number(inv.taxTotal),
      total: Number(inv.total),
      fx_present_rate: inv.fxPresentRate
        ? Number(inv.fxPresentRate)
        : undefined,
      portal_link: inv.portalLink || undefined,
      meta: inv.meta || undefined,
      created_at: inv.createdAt.toISOString(),
      created_by: inv.createdBy,
    }));
  }

  /**
   * Get invoice lines
   */
  async getInvoiceLines(
    companyId: string,
    invoiceId: string
  ): Promise<InvoiceLineResponseType[]> {
    const lines = await this.dbInstance
      .select()
      .from(rbInvoiceLine)
      .where(
        and(
          eq(rbInvoiceLine.companyId, companyId),
          eq(rbInvoiceLine.invoiceId, invoiceId)
        )
      )
      .orderBy(rbInvoiceLine.id);

    return lines.map(line => ({
      id: line.id,
      invoice_id: line.invoiceId,
      company_id: line.companyId,
      kind: line.kind as
        | 'ONE_TIME'
        | 'RECURRING'
        | 'USAGE'
        | 'CREDIT'
        | 'ADJUSTMENT'
        | 'ROUNDING',
      product_id: line.productId || undefined,
      description: line.description,
      qty: Number(line.qty),
      unit: line.unit || undefined,
      unit_price: Number(line.unitPrice),
      line_subtotal: Number(line.lineSubtotal),
      tax_code: line.taxCode || undefined,
      tax_amount: Number(line.taxAmount),
      line_total: Number(line.lineTotal),
    }));
  }

  /**
   * Post invoice to GL (AR bridge)
   */
  async postInvoiceToGL(companyId: string, invoiceId: string): Promise<void> {
    // Check if already posted
    const existingLocks = await this.dbInstance
      .select()
      .from(rbPostLock)
      .where(
        and(
          eq(rbPostLock.companyId, companyId),
          eq(rbPostLock.invoiceId, invoiceId)
        )
      )
      .limit(1);

    if (existingLocks.length > 0) {
      return; // Already posted
    }

    // Get invoice details
    const invoices = await this.dbInstance
      .select()
      .from(rbInvoice)
      .where(
        and(eq(rbInvoice.companyId, companyId), eq(rbInvoice.id, invoiceId))
      )
      .limit(1);

    if (invoices.length === 0) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const invoice = invoices[0]!;

    if (invoice.status !== 'FINAL') {
      throw new Error(`Invoice ${invoiceId} must be FINAL to post`);
    }

    // Get invoice lines for posting
    const invoiceLines = await this.dbInstance
      .select()
      .from(rbInvoiceLine)
      .where(
        and(
          eq(rbInvoiceLine.companyId, companyId),
          eq(rbInvoiceLine.invoiceId, invoiceId)
        )
      );

    // Import posting service
    const { postByRule } = await import('@/lib/posting');
    const { ensurePostingAllowed } = await import('@/lib/policy');

    // Check period guard
    const postingCheck = await ensurePostingAllowed(
      companyId,
      invoice.issueDate
    );
    if (postingCheck) {
      throw new Error(`Posting not allowed: ${await postingCheck.text()}`);
    }

    // Create journal entries for invoice posting
    const journalLines = [];

    // AR Debit (Customer owes us)
    journalLines.push({
      account_code: 'ACC-AR', // Accounts Receivable
      dc: 'D',
      amount: {
        amount: invoice.total,
        currency: invoice.presentCcy,
      },
      party_type: 'customer',
      party_id: invoice.customerId,
      description: `Invoice ${invoiceId} - ${invoice.customerId}`,
    });

    // Revenue Credits (for each line item)
    for (const line of invoiceLines) {
      if (line.productId) {
        // Get product to determine revenue account
        const products = await this.dbInstance
          .select()
          .from(rbProduct)
          .where(
            and(
              eq(rbProduct.companyId, companyId),
              eq(rbProduct.id, line.productId)
            )
          )
          .limit(1);

        const product = products[0];
        const revenueAccount = product?.glRevAcct || 'ACC-REV'; // Default revenue account

        journalLines.push({
          account_code: revenueAccount,
          dc: 'C',
          amount: {
            amount: line.lineSubtotal,
            currency: invoice.presentCcy,
          },
          description: `${line.description} - Revenue`,
        });
      }
    }

    // Tax Credit (if applicable)
    if (Number(invoice.taxTotal) > 0) {
      journalLines.push({
        account_code: 'ACC-TAX-PAYABLE', // Tax Payable
        dc: 'C',
        amount: {
          amount: invoice.taxTotal,
          currency: invoice.presentCcy,
        },
        description: `Invoice ${invoiceId} - Tax`,
      });
    }

    // Post to GL using the posting service
    await postByRule('SalesInvoice', invoiceId, invoice.presentCcy, companyId, {
      doc_date: invoice.issueDate,
      lines: journalLines,
      customer_id: invoice.customerId,
      invoice_id: invoiceId,
    });

    // Create post lock
    await this.dbInstance.insert(rbPostLock).values({
      id: ulid(),
      companyId,
      invoiceId,
      postedAt: new Date(),
    });

    // Update invoice status
    await this.dbInstance
      .update(rbInvoice)
      .set({ status: 'POSTED' })
      .where(eq(rbInvoice.id, invoiceId));
  }

  /**
   * Helper methods
   */
  private async getSubscriptionsForBilling(
    companyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any[]> {
    const subscriptions = await this.dbInstance
      .select()
      .from(rbSubscription)
      .where(
        and(
          eq(rbSubscription.companyId, companyId),
          eq(rbSubscription.status, 'ACTIVE'),
          gte(rbSubscription.billAnchor, periodStart),
          lte(rbSubscription.billAnchor, periodEnd)
        )
      );

    return subscriptions;
  }

  private async getUsageForBilling(
    companyId: string,
    subscriptionId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<Array<{ unit: string; qty: number }>> {
    const rollups = await this.dbInstance
      .select()
      .from(rbUsageRollup)
      .where(
        and(
          eq(rbUsageRollup.companyId, companyId),
          eq(rbUsageRollup.subscriptionId, subscriptionId),
          gte(rbUsageRollup.windowStart, new Date(periodStart)),
          lte(rbUsageRollup.windowEnd, new Date(periodEnd))
        )
      );

    return rollups.map(r => ({
      unit: r.unit,
      qty: Number(r.qty),
    }));
  }

  private calculateDueDate(issueDate: Date): string {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
    return dueDate.toISOString().split('T')[0]!;
  }
}
