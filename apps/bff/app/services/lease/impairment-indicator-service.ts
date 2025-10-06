import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc, or } from 'drizzle-orm';
import {
  leaseImpIndicator,
  leaseCgu,
  leaseComponent,
  lease,
} from '@aibos/db-adapter/schema';
import type {
  ImpairmentIndicatorUpsertType,
  ImpairmentIndicatorQueryType,
} from '@aibos/contracts';

export class ImpairmentIndicatorService {
  constructor(private dbInstance = db) {}

  /**
   * Create or update impairment indicator
   */
  async upsertIndicator(
    companyId: string,
    userId: string,
    data: ImpairmentIndicatorUpsertType
  ): Promise<string> {
    const indicatorId = ulid();

    await this.dbInstance.insert(leaseImpIndicator).values({
      id: indicatorId,
      companyId,
      asOfDate: data.as_of_date,
      cguId: data.cgu_id || null,
      leaseComponentId: data.lease_component_id || null,
      kind: data.kind,
      value: data.value,
      severity: data.severity,
      source: data.source,
      createdAt: new Date(),
      createdBy: userId,
    });

    return indicatorId;
  }

  /**
   * Query impairment indicators
   */
  async queryIndicators(
    companyId: string,
    query: ImpairmentIndicatorQueryType
  ) {
    const conditions = [eq(leaseImpIndicator.companyId, companyId)];

    if (query.as_of_date) {
      conditions.push(eq(leaseImpIndicator.asOfDate, query.as_of_date));
    }
    if (query.cgu_id) {
      conditions.push(eq(leaseImpIndicator.cguId, query.cgu_id));
    }
    if (query.lease_component_id) {
      conditions.push(
        eq(leaseImpIndicator.leaseComponentId, query.lease_component_id)
      );
    }
    if (query.kind) {
      conditions.push(eq(leaseImpIndicator.kind, query.kind));
    }
    if (query.severity) {
      conditions.push(eq(leaseImpIndicator.severity, query.severity));
    }

    const indicators = await this.dbInstance
      .select({
        id: leaseImpIndicator.id,
        asOfDate: leaseImpIndicator.asOfDate,
        cguId: leaseImpIndicator.cguId,
        leaseComponentId: leaseImpIndicator.leaseComponentId,
        kind: leaseImpIndicator.kind,
        value: leaseImpIndicator.value,
        severity: leaseImpIndicator.severity,
        source: leaseImpIndicator.source,
        createdAt: leaseImpIndicator.createdAt,
        createdBy: leaseImpIndicator.createdBy,
        cguCode: leaseCgu.code,
        cguName: leaseCgu.name,
        componentCode: leaseComponent.code,
        componentName: leaseComponent.name,
      })
      .from(leaseImpIndicator)
      .leftJoin(leaseCgu, eq(leaseImpIndicator.cguId, leaseCgu.id))
      .leftJoin(
        leaseComponent,
        eq(leaseImpIndicator.leaseComponentId, leaseComponent.id)
      )
      .where(and(...conditions))
      .orderBy(
        desc(leaseImpIndicator.asOfDate),
        desc(leaseImpIndicator.createdAt)
      )
      .limit(query.limit)
      .offset(query.offset);

    return indicators;
  }

  /**
   * Collect indicators from various sources (budget system, market data, etc.)
   */
  async collectIndicators(
    companyId: string,
    userId: string,
    asOfDate: string,
    sources: string[] = ['BUDGET_SYSTEM', 'MARKET_DATA', 'MANUAL']
  ): Promise<{ collected: number; errors: string[] }> {
    const errors: string[] = [];
    let collected = 0;

    try {
      // Collect budget shortfall indicators
      if (sources.includes('BUDGET_SYSTEM')) {
        const budgetIndicators = await this.collectBudgetIndicators(
          companyId,
          userId,
          asOfDate
        );
        collected += budgetIndicators;
      }

      // Collect vacancy indicators
      if (sources.includes('MARKET_DATA')) {
        const vacancyIndicators = await this.collectVacancyIndicators(
          companyId,
          userId,
          asOfDate
        );
        collected += vacancyIndicators;
      }

      // Collect market rent drop indicators
      if (sources.includes('MARKET_DATA')) {
        const marketIndicators = await this.collectMarketRentIndicators(
          companyId,
          userId,
          asOfDate
        );
        collected += marketIndicators;
      }
    } catch (error) {
      errors.push(
        `Error collecting indicators: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return { collected, errors };
  }

  /**
   * Collect budget shortfall indicators
   */
  private async collectBudgetIndicators(
    companyId: string,
    userId: string,
    asOfDate: string
  ): Promise<number> {
    // This would integrate with budget system to identify shortfalls
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Collect vacancy indicators
   */
  private async collectVacancyIndicators(
    companyId: string,
    userId: string,
    asOfDate: string
  ): Promise<number> {
    // This would integrate with property management system to identify vacancy rates
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Collect market rent drop indicators
   */
  private async collectMarketRentIndicators(
    companyId: string,
    userId: string,
    asOfDate: string
  ): Promise<number> {
    // This would integrate with market data providers to identify rent drops
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Get indicators summary for a specific date
   */
  async getIndicatorsSummary(companyId: string, asOfDate: string) {
    const summary = await this.dbInstance
      .select({
        kind: leaseImpIndicator.kind,
        severity: leaseImpIndicator.severity,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(leaseImpIndicator)
      .where(
        and(
          eq(leaseImpIndicator.companyId, companyId),
          eq(leaseImpIndicator.asOfDate, asOfDate)
        )
      )
      .groupBy(leaseImpIndicator.kind, leaseImpIndicator.severity);

    return summary;
  }
}
