import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import {
  rbContract,
  rbSubscription,
  rbProduct,
  rbPrice,
  rbPriceBook,
} from '@aibos/db-adapter/schema';
import type {
  ContractUpsertType,
  SubscriptionUpsertType,
  SubscriptionUpgradeReqType,
  SubscriptionQueryType,
  ContractResponseType,
  SubscriptionResponseType,
} from '@aibos/contracts';

export class RbContractsService {
  constructor(private dbInstance = db) {}

  /**
   * Create or update a contract
   */
  async upsertContract(
    companyId: string,
    userId: string,
    data: ContractUpsertType
  ): Promise<ContractResponseType> {
    const contractId = ulid();

    const contract = await this.dbInstance
      .insert(rbContract)
      .values({
        id: contractId,
        companyId,
        customerId: data.customer_id,
        bookId: data.book_id,
        startDate: data.start_date,
        endDate: data.end_date || null,
        status: 'ACTIVE',
        terms: data.terms || null,
        updatedBy: userId,
      })
      .returning();

    const c = contract[0]!;
    return {
      id: c.id,
      company_id: c.companyId,
      customer_id: c.customerId,
      book_id: c.bookId,
      start_date: c.startDate,
      end_date: c.endDate || undefined,
      status: c.status as 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED',
      terms: c.terms || undefined,
      updated_at: c.updatedAt.toISOString(),
      updated_by: c.updatedBy,
    };
  }

  /**
   * Get contracts for a customer
   */
  async getCustomerContracts(
    companyId: string,
    customerId: string
  ): Promise<ContractResponseType[]> {
    const contracts = await this.dbInstance
      .select()
      .from(rbContract)
      .where(
        and(
          eq(rbContract.companyId, companyId),
          eq(rbContract.customerId, customerId)
        )
      )
      .orderBy(desc(rbContract.updatedAt));

    return contracts.map(c => ({
      id: c.id,
      company_id: c.companyId,
      customer_id: c.customerId,
      book_id: c.bookId,
      start_date: c.startDate,
      end_date: c.endDate || undefined,
      status: c.status as 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED',
      terms: c.terms || undefined,
      updated_at: c.updatedAt.toISOString(),
      updated_by: c.updatedBy,
    }));
  }

  /**
   * Create or update a subscription
   */
  async upsertSubscription(
    companyId: string,
    data: SubscriptionUpsertType
  ): Promise<SubscriptionResponseType> {
    const subscriptionId = ulid();

    const subscription = await this.dbInstance
      .insert(rbSubscription)
      .values({
        id: subscriptionId,
        companyId,
        contractId: data.contract_id,
        productId: data.product_id,
        priceId: data.price_id,
        qty: data.qty.toString(),
        startDate: data.start_date,
        endDate: data.end_date || null,
        billAnchor: data.bill_anchor,
        status: 'ACTIVE',
        proration: data.proration,
        meta: data.meta || null,
      })
      .returning();

    const s = subscription[0]!;
    return {
      id: s.id,
      company_id: s.companyId,
      contract_id: s.contractId,
      product_id: s.productId,
      price_id: s.priceId,
      qty: Number(s.qty),
      start_date: s.startDate,
      end_date: s.endDate || undefined,
      bill_anchor: s.billAnchor,
      status: s.status as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
      proration: s.proration as 'DAILY' | 'NONE',
      meta: s.meta || undefined,
    };
  }

  /**
   * Get subscriptions with optional filtering
   */
  async getSubscriptions(
    companyId: string,
    query: SubscriptionQueryType
  ): Promise<SubscriptionResponseType[]> {
    const conditions = [eq(rbSubscription.companyId, companyId)];

    if (query.customer_id) {
      // Join with contracts to filter by customer
      const subscriptions = await this.dbInstance
        .select({
          subscription: rbSubscription,
          contract: rbContract,
        })
        .from(rbSubscription)
        .innerJoin(rbContract, eq(rbSubscription.contractId, rbContract.id))
        .where(
          and(
            eq(rbContract.companyId, companyId),
            eq(rbContract.customerId, query.customer_id),
            query.status ? eq(rbSubscription.status, query.status) : sql`1=1`,
            query.bill_anchor
              ? eq(rbSubscription.billAnchor, query.bill_anchor)
              : sql`1=1`
          )
        )
        .orderBy(desc(rbSubscription.startDate))
        .limit(query.limit)
        .offset(query.offset);

      return subscriptions.map(({ subscription: s }) => ({
        id: s.id,
        company_id: s.companyId,
        contract_id: s.contractId,
        product_id: s.productId,
        price_id: s.priceId,
        qty: Number(s.qty),
        start_date: s.startDate,
        end_date: s.endDate || undefined,
        bill_anchor: s.billAnchor,
        status: s.status as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
        proration: s.proration as 'DAILY' | 'NONE',
        meta: s.meta || undefined,
      }));
    }

    if (query.status) {
      conditions.push(eq(rbSubscription.status, query.status));
    }
    if (query.bill_anchor) {
      conditions.push(eq(rbSubscription.billAnchor, query.bill_anchor));
    }

    const subscriptions = await this.dbInstance
      .select()
      .from(rbSubscription)
      .where(and(...conditions))
      .orderBy(desc(rbSubscription.startDate))
      .limit(query.limit)
      .offset(query.offset);

    return subscriptions.map(s => ({
      id: s.id,
      company_id: s.companyId,
      contract_id: s.contractId,
      product_id: s.productId,
      price_id: s.priceId,
      qty: Number(s.qty),
      start_date: s.startDate,
      end_date: s.endDate || undefined,
      bill_anchor: s.billAnchor,
      status: s.status as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
      proration: s.proration as 'DAILY' | 'NONE',
      meta: s.meta || undefined,
    }));
  }

  /**
   * Upgrade/downgrade a subscription with proration
   */
  async upgradeSubscription(
    companyId: string,
    data: SubscriptionUpgradeReqType
  ): Promise<SubscriptionResponseType> {
    // Get current subscription
    const currentSubs = await this.dbInstance
      .select()
      .from(rbSubscription)
      .where(
        and(
          eq(rbSubscription.companyId, companyId),
          eq(rbSubscription.id, data.subscription_id)
        )
      )
      .limit(1);

    if (currentSubs.length === 0) {
      throw new Error(`Subscription ${data.subscription_id} not found`);
    }

    const currentSub = currentSubs[0]!;

    // Get new price details
    const newPrices = await this.dbInstance
      .select()
      .from(rbPrice)
      .where(
        and(eq(rbPrice.companyId, companyId), eq(rbPrice.id, data.new_price_id))
      )
      .limit(1);

    if (newPrices.length === 0) {
      throw new Error(`Price ${data.new_price_id} not found`);
    }

    const newPrice = newPrices[0]!;

    // Calculate proration if needed
    const effectiveDate = new Date(data.effective_date);
    const startDate = new Date(currentSub.startDate);
    const nextBillDate = new Date(currentSub.billAnchor);

    let proratedQty = Number(currentSub.qty);
    let creditAmount = 0;
    let proratedAmount = 0;

    if (data.proration === 'DAILY' && effectiveDate > startDate) {
      // Calculate proration for the change
      const daysInPeriod = this.getDaysInPeriod(startDate, nextBillDate);
      const daysUsed = this.getDaysInPeriod(startDate, effectiveDate);
      const daysRemaining = daysInPeriod - daysUsed;

      // Calculate credit for unused portion of current period
      if (daysRemaining > 0) {
        const catalogService = new (await import('./catalog')).RbCatalogService(
          this.dbInstance
        );
        const currentAmount = await catalogService.calculatePrice(
          companyId,
          currentSub.productId,
          currentSub.priceId,
          Number(currentSub.qty)
        );
        creditAmount = (currentAmount * daysRemaining) / daysInPeriod;

        // Calculate prorated amount for new pricing
        const newAmount = await catalogService.calculatePrice(
          companyId,
          currentSub.productId,
          data.new_price_id,
          Number(currentSub.qty)
        );
        proratedAmount = (newAmount * daysRemaining) / daysInPeriod;
      }
    }

    // Update subscription
    const updatedSub = await this.dbInstance
      .update(rbSubscription)
      .set({
        priceId: data.new_price_id,
        qty: proratedQty.toString(),
        startDate: data.effective_date,
        proration: data.proration,
        meta: {
          ...((currentSub.meta as Record<string, any>) || {}),
          upgrade_date: data.effective_date,
          proration: data.proration,
          credit_amount: creditAmount,
          prorated_amount: proratedAmount,
        },
      })
      .where(eq(rbSubscription.id, data.subscription_id))
      .returning();

    const s = updatedSub[0]!;
    return {
      id: s.id,
      company_id: s.companyId,
      contract_id: s.contractId,
      product_id: s.productId,
      price_id: s.priceId,
      qty: Number(s.qty),
      start_date: s.startDate,
      end_date: s.endDate || undefined,
      bill_anchor: s.billAnchor,
      status: s.status as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
      proration: s.proration as 'DAILY' | 'NONE',
      meta: s.meta || undefined,
    };
  }

  /**
   * Get subscriptions due for billing
   */
  async getSubscriptionsForBilling(
    companyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<SubscriptionResponseType[]> {
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

    return subscriptions.map(s => ({
      id: s.id,
      company_id: s.companyId,
      contract_id: s.contractId,
      product_id: s.productId,
      price_id: s.priceId,
      qty: Number(s.qty),
      start_date: s.startDate,
      end_date: s.endDate || undefined,
      bill_anchor: s.billAnchor,
      status: s.status as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
      proration: s.proration as 'DAILY' | 'NONE',
      meta: s.meta || undefined,
    }));
  }

  /**
   * Helper method to calculate days in period
   */
  private getDaysInPeriod(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
