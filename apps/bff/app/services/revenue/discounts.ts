import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc, isNull } from 'drizzle-orm';
import { revDiscountRule, revDiscountApplied } from '@aibos/db-adapter/schema';
import type {
  DiscountRuleUpsertType,
  DiscountRuleQueryType,
  DiscountRuleResponseType,
} from '@aibos/contracts';

export class RevDiscountService {
  constructor(private dbInstance = db) {}

  /**
   * Upsert discount rule
   */
  async upsertDiscountRule(
    companyId: string,
    userId: string,
    data: DiscountRuleUpsertType
  ): Promise<DiscountRuleResponseType> {
    const ruleId = ulid();

    // Check for existing active rule with same code
    const existing = await this.dbInstance
      .select()
      .from(revDiscountRule)
      .where(
        and(
          eq(revDiscountRule.companyId, companyId),
          eq(revDiscountRule.code, data.code),
          eq(revDiscountRule.active, true),
          isNull(revDiscountRule.effectiveTo)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // End-date the existing rule
      await this.dbInstance
        .update(revDiscountRule)
        .set({
          effectiveTo: data.effective_from,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(revDiscountRule.id, existing[0]!.id));
    }

    // Create new rule
    const [rule] = await this.dbInstance
      .insert(revDiscountRule)
      .values({
        id: ruleId,
        companyId,
        kind: data.kind,
        code: data.code,
        name: data.name || null,
        params: data.params,
        active: data.active,
        effectiveFrom: data.effective_from,
        effectiveTo: data.effective_to || null,
        priority: data.priority,
        maxUsageCount: data.max_usage_count || null,
        maxUsageAmount: data.max_usage_amount?.toString() || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return this.mapRuleToResponse(rule);
  }

  /**
   * Query discount rules
   */
  async queryDiscountRules(
    companyId: string,
    query: DiscountRuleQueryType
  ): Promise<DiscountRuleResponseType[]> {
    const conditions = [eq(revDiscountRule.companyId, companyId)];

    if (query.kind) {
      conditions.push(eq(revDiscountRule.kind, query.kind));
    }
    if (query.code) {
      conditions.push(eq(revDiscountRule.code, query.code));
    }
    if (query.active !== undefined) {
      conditions.push(eq(revDiscountRule.active, query.active));
    }
    if (query.effective_from) {
      conditions.push(gte(revDiscountRule.effectiveFrom, query.effective_from));
    }
    if (query.effective_to) {
      conditions.push(
        lte(
          revDiscountRule.effectiveTo || revDiscountRule.effectiveFrom,
          query.effective_to
        )
      );
    }

    const rules = await this.dbInstance
      .select()
      .from(revDiscountRule)
      .where(and(...conditions))
      .orderBy(
        desc(revDiscountRule.priority),
        desc(revDiscountRule.effectiveFrom),
        desc(revDiscountRule.createdAt)
      )
      .limit(query.limit)
      .offset(query.offset);

    return rules.map(this.mapRuleToResponse);
  }

  /**
   * Get active discount rules for invoice processing
   */
  async getActiveDiscountRules(
    companyId: string,
    asOfDate: string,
    invoiceData?: {
      total_amount?: number;
      customer_id?: string;
      products?: string[];
    }
  ): Promise<DiscountRuleResponseType[]> {
    const conditions = [
      eq(revDiscountRule.companyId, companyId),
      eq(revDiscountRule.active, true),
      lte(revDiscountRule.effectiveFrom, asOfDate),
      sql`(${revDiscountRule.effectiveTo} IS NULL OR ${revDiscountRule.effectiveTo} > ${asOfDate})`,
    ];

    const rules = await this.dbInstance
      .select()
      .from(revDiscountRule)
      .where(and(...conditions))
      .orderBy(desc(revDiscountRule.priority), asc(revDiscountRule.createdAt));

    // Filter rules based on their parameters and invoice data
    const applicableRules = rules.filter(rule => {
      const params = rule.params as any;

      // Check usage limits
      if (rule.maxUsageCount || rule.maxUsageAmount) {
        // This would need to be implemented with actual usage tracking
        // For now, we'll skip this check
      }

      // Check rule-specific conditions
      switch (rule.kind) {
        case 'TIERED':
          if (invoiceData?.total_amount && params.threshold) {
            return invoiceData.total_amount >= params.threshold;
          }
          break;
        case 'PROMO':
          if (params.start_date && params.end_date) {
            return asOfDate >= params.start_date && asOfDate <= params.end_date;
          }
          break;
        case 'PARTNER':
          if (invoiceData?.customer_id && params.partner_customers) {
            return params.partner_customers.includes(invoiceData.customer_id);
          }
          break;
        default:
          return true;
      }

      return true;
    });

    return applicableRules.map(this.mapRuleToResponse);
  }

  /**
   * Apply discount rule to invoice
   */
  async applyDiscountRule(
    companyId: string,
    invoiceId: string,
    ruleId: string,
    userId: string,
    computedAmount: number,
    detail: any
  ): Promise<void> {
    const appliedId = ulid();

    await this.dbInstance.insert(revDiscountApplied).values({
      id: appliedId,
      companyId,
      invoiceId,
      ruleId,
      computedAmount: computedAmount.toString(),
      detail,
      appliedBy: userId,
    });
  }

  /**
   * Calculate discount amount based on rule type
   */
  calculateDiscountAmount(
    rule: DiscountRuleResponseType,
    invoiceLines: Array<{
      product_id: string;
      amount: number;
      qty: number;
    }>,
    totalInvoiceAmount: number
  ): number {
    const params = rule.params as any;

    switch (rule.kind) {
      case 'PROP': {
        // Proportional discount across all lines
        const discountPct = params.pct || 0;
        return totalInvoiceAmount * discountPct;
      }

      case 'RESIDUAL': {
        // Apply to residual-eligible products only
        const residualProducts = params.residual_products || [];
        const residualAmount = invoiceLines
          .filter(line => residualProducts.includes(line.product_id))
          .reduce((sum, line) => sum + line.amount, 0);
        return residualAmount * (params.pct || 0);
      }

      case 'TIERED':
        // Volume/term based discount
        if (totalInvoiceAmount >= (params.threshold || 0)) {
          return totalInvoiceAmount * (params.pct || 0);
        }
        return 0;

      case 'PROMO':
        // Promotional discount
        return totalInvoiceAmount * (params.pct || 0);

      case 'PARTNER':
        // Partner program discount
        return totalInvoiceAmount * (params.pct || 0);

      default:
        return 0;
    }
  }

  /**
   * Get discount applications for invoice
   */
  async getDiscountApplications(
    companyId: string,
    invoiceId: string
  ): Promise<
    Array<{
      id: string;
      rule_id: string;
      computed_amount: number;
      detail: any;
      applied_at: string;
      applied_by: string;
    }>
  > {
    const applications = await this.dbInstance
      .select()
      .from(revDiscountApplied)
      .where(
        and(
          eq(revDiscountApplied.companyId, companyId),
          eq(revDiscountApplied.invoiceId, invoiceId)
        )
      )
      .orderBy(asc(revDiscountApplied.appliedAt));

    return applications.map(app => ({
      id: app.id,
      rule_id: app.ruleId,
      computed_amount: parseFloat(app.computedAmount),
      detail: app.detail,
      applied_at: app.appliedAt.toISOString(),
      applied_by: app.appliedBy,
    }));
  }

  /**
   * Update discount rule status
   */
  async updateDiscountRuleStatus(
    companyId: string,
    ruleId: string,
    userId: string,
    active: boolean
  ): Promise<DiscountRuleResponseType> {
    const [rule] = await this.dbInstance
      .update(revDiscountRule)
      .set({
        active,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(
        and(
          eq(revDiscountRule.id, ruleId),
          eq(revDiscountRule.companyId, companyId)
        )
      )
      .returning();

    if (!rule) {
      throw new Error('Discount rule not found');
    }

    return this.mapRuleToResponse(rule);
  }

  /**
   * Get discount rule by ID
   */
  async getDiscountRule(
    companyId: string,
    ruleId: string
  ): Promise<DiscountRuleResponseType | null> {
    const [rule] = await this.dbInstance
      .select()
      .from(revDiscountRule)
      .where(
        and(
          eq(revDiscountRule.id, ruleId),
          eq(revDiscountRule.companyId, companyId)
        )
      )
      .limit(1);

    return rule ? this.mapRuleToResponse(rule) : null;
  }

  /**
   * Validate discount rule parameters
   */
  validateDiscountRuleParams(kind: string, params: any): boolean {
    switch (kind) {
      case 'PROP':
        return (
          typeof params.pct === 'number' && params.pct >= 0 && params.pct <= 1
        );
      case 'RESIDUAL':
        return (
          typeof params.pct === 'number' &&
          params.pct >= 0 &&
          params.pct <= 1 &&
          Array.isArray(params.residual_products)
        );
      case 'TIERED':
        return (
          typeof params.threshold === 'number' &&
          params.threshold > 0 &&
          typeof params.pct === 'number' &&
          params.pct >= 0 &&
          params.pct <= 1
        );
      case 'PROMO':
        return (
          typeof params.pct === 'number' &&
          params.pct >= 0 &&
          params.pct <= 1 &&
          typeof params.start_date === 'string' &&
          typeof params.end_date === 'string'
        );
      case 'PARTNER':
        return (
          typeof params.pct === 'number' &&
          params.pct >= 0 &&
          params.pct <= 1 &&
          Array.isArray(params.partner_customers)
        );
      default:
        return false;
    }
  }

  // Helper method for mapping database records to response types
  private mapRuleToResponse(rule: any): DiscountRuleResponseType {
    return {
      id: rule.id,
      company_id: rule.companyId,
      kind: rule.kind,
      code: rule.code,
      name: rule.name,
      params: rule.params,
      active: rule.active,
      effective_from: rule.effectiveFrom,
      effective_to: rule.effectiveTo,
      priority: rule.priority,
      max_usage_count: rule.maxUsageCount,
      max_usage_amount: rule.maxUsageAmount
        ? parseFloat(rule.maxUsageAmount)
        : undefined,
      created_at: rule.createdAt.toISOString(),
      created_by: rule.createdBy,
      updated_at: rule.updatedAt.toISOString(),
      updated_by: rule.updatedBy,
    };
  }
}
