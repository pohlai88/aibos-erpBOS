import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import {
  rbCreditMemo,
  rbCreditApply,
  rbInvoice,
} from '@aibos/db-adapter/schema';
import type {
  CreditMemoReqType,
  CreditApplyReqType,
  CreditMemoResponseType,
} from '@aibos/contracts';

export class RbCreditsService {
  constructor(private dbInstance = db) {}

  /**
   * Create a credit memo
   */
  async createCreditMemo(
    companyId: string,
    userId: string,
    data: CreditMemoReqType
  ): Promise<CreditMemoResponseType> {
    const memoId = ulid();

    const memo = await this.dbInstance
      .insert(rbCreditMemo)
      .values({
        id: memoId,
        companyId,
        customerId: data.customer_id,
        reason: data.reason || null,
        status: 'DRAFT',
        presentCcy: 'USD', // TODO: Get from customer or company default
        amount: data.amount.toString(),
        createdBy: userId,
      })
      .returning();

    const m = memo[0]!;
    return {
      id: m.id,
      company_id: m.companyId,
      customer_id: m.customerId,
      reason: m.reason || undefined,
      status: m.status as 'DRAFT' | 'FINAL' | 'APPLIED' | 'VOID',
      present_ccy: m.presentCcy,
      amount: Number(m.amount),
      created_at: m.createdAt.toISOString(),
      created_by: m.createdBy,
    };
  }

  /**
   * Apply credit memo to invoice
   */
  async applyCreditMemo(
    companyId: string,
    data: CreditApplyReqType
  ): Promise<void> {
    // Get credit memo
    const memos = await this.dbInstance
      .select()
      .from(rbCreditMemo)
      .where(
        and(
          eq(rbCreditMemo.companyId, companyId),
          eq(rbCreditMemo.id, data.memo_id)
        )
      )
      .limit(1);

    if (memos.length === 0) {
      throw new Error(`Credit memo ${data.memo_id} not found`);
    }

    const memo = memos[0]!;

    if (memo.status !== 'FINAL') {
      throw new Error(`Credit memo ${data.memo_id} must be FINAL to apply`);
    }

    // Get invoice
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

    if (invoice.status === 'PAID') {
      throw new Error(`Invoice ${data.invoice_id} is already paid`);
    }

    // Check if credit amount doesn't exceed memo amount
    const existingApplications = await this.dbInstance
      .select({
        totalApplied: sql<number>`SUM(${rbCreditApply.amount})`,
      })
      .from(rbCreditApply)
      .where(eq(rbCreditApply.memoId, data.memo_id));

    const totalApplied = Number(existingApplications[0]?.totalApplied || 0);
    const remainingAmount = Number(memo.amount) - totalApplied;

    if (data.amount > remainingAmount) {
      throw new Error(
        `Credit amount ${data.amount} exceeds remaining memo amount ${remainingAmount}`
      );
    }

    // Create credit application
    await this.dbInstance.insert(rbCreditApply).values({
      id: ulid(),
      memoId: data.memo_id,
      invoiceId: data.invoice_id,
      amount: data.amount.toString(),
    });

    // Update invoice status and amounts
    const newTotal = Number(invoice.total) - data.amount;
    const newStatus = newTotal <= 0 ? 'PAID' : 'PARTIAL';

    await this.dbInstance
      .update(rbInvoice)
      .set({
        total: newTotal.toString(),
        status: newStatus,
      })
      .where(eq(rbInvoice.id, data.invoice_id));

    // Update memo status if fully applied
    if (totalApplied + data.amount >= Number(memo.amount)) {
      await this.dbInstance
        .update(rbCreditMemo)
        .set({ status: 'APPLIED' })
        .where(eq(rbCreditMemo.id, data.memo_id));
    }
  }

  /**
   * Finalize a credit memo
   */
  async finalizeCreditMemo(
    companyId: string,
    memoId: string
  ): Promise<CreditMemoResponseType> {
    const memos = await this.dbInstance
      .select()
      .from(rbCreditMemo)
      .where(
        and(eq(rbCreditMemo.companyId, companyId), eq(rbCreditMemo.id, memoId))
      )
      .limit(1);

    if (memos.length === 0) {
      throw new Error(`Credit memo ${memoId} not found`);
    }

    const memo = memos[0]!;

    if (memo.status !== 'DRAFT') {
      throw new Error(`Credit memo ${memoId} is not in DRAFT status`);
    }

    const updatedMemo = await this.dbInstance
      .update(rbCreditMemo)
      .set({ status: 'FINAL' })
      .where(eq(rbCreditMemo.id, memoId))
      .returning();

    const m = updatedMemo[0]!;
    return {
      id: m.id,
      company_id: m.companyId,
      customer_id: m.customerId,
      reason: m.reason || undefined,
      status: m.status as 'DRAFT' | 'FINAL' | 'APPLIED' | 'VOID',
      present_ccy: m.presentCcy,
      amount: Number(m.amount),
      created_at: m.createdAt.toISOString(),
      created_by: m.createdBy,
    };
  }

  /**
   * Get credit memos for a customer
   */
  async getCustomerCreditMemos(
    companyId: string,
    customerId: string
  ): Promise<CreditMemoResponseType[]> {
    const memos = await this.dbInstance
      .select()
      .from(rbCreditMemo)
      .where(
        and(
          eq(rbCreditMemo.companyId, companyId),
          eq(rbCreditMemo.customerId, customerId)
        )
      )
      .orderBy(desc(rbCreditMemo.createdAt));

    return memos.map(m => ({
      id: m.id,
      company_id: m.companyId,
      customer_id: m.customerId,
      reason: m.reason || undefined,
      status: m.status as 'DRAFT' | 'FINAL' | 'APPLIED' | 'VOID',
      present_ccy: m.presentCcy,
      amount: Number(m.amount),
      created_at: m.createdAt.toISOString(),
      created_by: m.createdBy,
    }));
  }

  /**
   * Get available credit amount for a customer
   */
  async getAvailableCredit(
    companyId: string,
    customerId: string
  ): Promise<number> {
    const memos = await this.dbInstance
      .select({
        totalAmount: sql<number>`SUM(${rbCreditMemo.amount})`,
        totalApplied: sql<number>`COALESCE(SUM(${rbCreditApply.amount}), 0)`,
      })
      .from(rbCreditMemo)
      .leftJoin(rbCreditApply, eq(rbCreditMemo.id, rbCreditApply.memoId))
      .where(
        and(
          eq(rbCreditMemo.companyId, companyId),
          eq(rbCreditMemo.customerId, customerId),
          eq(rbCreditMemo.status, 'FINAL')
        )
      );

    const result = memos[0];
    if (!result) {
      return 0;
    }

    const totalAmount = Number(result.totalAmount || 0);
    const totalApplied = Number(result.totalApplied || 0);

    return Math.max(0, totalAmount - totalApplied);
  }

  /**
   * Auto-apply credits to open invoices (FIFO)
   */
  async autoApplyCredits(
    companyId: string,
    customerId: string
  ): Promise<{ applied: number; remaining: number }> {
    const availableCredit = await this.getAvailableCredit(
      companyId,
      customerId
    );

    if (availableCredit <= 0) {
      return { applied: 0, remaining: 0 };
    }

    // Get open invoices for customer (oldest first)
    const invoices = await this.dbInstance
      .select()
      .from(rbInvoice)
      .where(
        and(
          eq(rbInvoice.companyId, companyId),
          eq(rbInvoice.customerId, customerId),
          eq(rbInvoice.status, 'FINAL')
        )
      )
      .orderBy(rbInvoice.issueDate);

    let remainingCredit = availableCredit;
    let totalApplied = 0;

    for (const invoice of invoices) {
      if (remainingCredit <= 0) {
        break;
      }

      const invoiceBalance = Number(invoice.total);
      const applyAmount = Math.min(remainingCredit, invoiceBalance);

      if (applyAmount > 0) {
        // Find a credit memo to apply
        const memos = await this.dbInstance
          .select()
          .from(rbCreditMemo)
          .where(
            and(
              eq(rbCreditMemo.companyId, companyId),
              eq(rbCreditMemo.customerId, customerId),
              eq(rbCreditMemo.status, 'FINAL')
            )
          )
          .orderBy(rbCreditMemo.createdAt);

        for (const memo of memos) {
          if (remainingCredit <= 0) {
            break;
          }

          const memoRemaining = await this.getMemoRemainingAmount(memo.id);
          if (memoRemaining > 0) {
            const applyFromMemo = Math.min(
              applyAmount,
              memoRemaining,
              remainingCredit
            );

            await this.applyCreditMemo(companyId, {
              memo_id: memo.id,
              invoice_id: invoice.id,
              amount: applyFromMemo,
            });

            remainingCredit -= applyFromMemo;
            totalApplied += applyFromMemo;
          }
        }
      }
    }

    return { applied: totalApplied, remaining: remainingCredit };
  }

  /**
   * Get remaining amount for a credit memo
   */
  private async getMemoRemainingAmount(memoId: string): Promise<number> {
    const memos = await this.dbInstance
      .select({
        totalAmount: sql<number>`SUM(${rbCreditMemo.amount})`,
        totalApplied: sql<number>`COALESCE(SUM(${rbCreditApply.amount}), 0)`,
      })
      .from(rbCreditMemo)
      .leftJoin(rbCreditApply, eq(rbCreditMemo.id, rbCreditApply.memoId))
      .where(eq(rbCreditMemo.id, memoId));

    const result = memos[0];
    if (!result) {
      return 0;
    }

    const totalAmount = Number(result.totalAmount || 0);
    const totalApplied = Number(result.totalApplied || 0);

    return Math.max(0, totalAmount - totalApplied);
  }
}
