import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import {
  rbUsageEvent,
  rbUsageRollup,
  rbSubscription,
} from '@aibos/db-adapter/schema';
import type { UsageIngestType, UsageRollupReqType } from '@aibos/contracts';

export class RbUsageService {
  constructor(private dbInstance = db) {}

  /**
   * Ingest usage events with idempotency
   */
  async ingestUsage(
    companyId: string,
    data: UsageIngestType
  ): Promise<{ ingested: number; skipped: number }> {
    let ingested = 0;
    let skipped = 0;

    for (const event of data.events) {
      try {
        await this.dbInstance.insert(rbUsageEvent).values({
          id: ulid(),
          companyId,
          customerId: '', // Will be populated from subscription
          subscriptionId: data.subscription_id,
          eventTime: new Date(event.event_time),
          quantity: event.quantity.toString(),
          unit: event.unit,
          uniqHash: event.uniq_hash,
          payload: event.payload || null,
        });
        ingested++;
      } catch (error) {
        // Check if it's a unique constraint violation (duplicate)
        if (error instanceof Error && error.message.includes('rb_usage_uk')) {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    return { ingested, skipped };
  }

  /**
   * Rollup usage events into billing windows
   */
  async rollupUsage(
    companyId: string,
    data: UsageRollupReqType
  ): Promise<void> {
    // Get subscription details
    const subscriptions = await this.dbInstance
      .select()
      .from(rbSubscription)
      .where(
        and(
          eq(rbSubscription.companyId, companyId),
          eq(rbSubscription.id, data.subscription_id)
        )
      )
      .limit(1);

    if (subscriptions.length === 0) {
      throw new Error(`Subscription ${data.subscription_id} not found`);
    }

    const subscription = subscriptions[0]!;

    // Aggregate usage events in the window
    const usageEvents = await this.dbInstance
      .select({
        unit: rbUsageEvent.unit,
        totalQty: sql<number>`SUM(${rbUsageEvent.quantity})`,
      })
      .from(rbUsageEvent)
      .where(
        and(
          eq(rbUsageEvent.companyId, companyId),
          eq(rbUsageEvent.subscriptionId, data.subscription_id),
          eq(rbUsageEvent.unit, data.unit),
          gte(rbUsageEvent.eventTime, new Date(data.window_start)),
          lte(rbUsageEvent.eventTime, new Date(data.window_end))
        )
      )
      .groupBy(rbUsageEvent.unit);

    if (usageEvents.length === 0) {
      return; // No usage to rollup
    }

    const rollup = usageEvents[0]!;

    // Insert or update rollup
    await this.dbInstance
      .insert(rbUsageRollup)
      .values({
        id: ulid(),
        companyId,
        subscriptionId: data.subscription_id,
        windowStart: new Date(data.window_start),
        windowEnd: new Date(data.window_end),
        unit: data.unit,
        qty: rollup.totalQty.toString(),
        meta: null,
      })
      .onConflictDoUpdate({
        target: [
          rbUsageRollup.companyId,
          rbUsageRollup.subscriptionId,
          rbUsageRollup.windowStart,
          rbUsageRollup.windowEnd,
          rbUsageRollup.unit,
        ],
        set: {
          qty: rollup.totalQty.toString(),
        },
      });
  }

  /**
   * Get usage rollup for billing
   */
  async getUsageForBilling(
    companyId: string,
    subscriptionId: string,
    windowStart: string,
    windowEnd: string
  ): Promise<{ unit: string; qty: number }[]> {
    const rollups = await this.dbInstance
      .select()
      .from(rbUsageRollup)
      .where(
        and(
          eq(rbUsageRollup.companyId, companyId),
          eq(rbUsageRollup.subscriptionId, subscriptionId),
          gte(rbUsageRollup.windowStart, new Date(windowStart)),
          lte(rbUsageRollup.windowEnd, new Date(windowEnd))
        )
      );

    return rollups.map(r => ({
      unit: r.unit,
      qty: Number(r.qty),
    }));
  }

  /**
   * Get usage events for a subscription
   */
  async getUsageEvents(
    companyId: string,
    subscriptionId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<
    Array<{
      id: string;
      event_time: string;
      quantity: number;
      unit: string;
      uniq_hash: string;
      payload: any;
    }>
  > {
    const events = await this.dbInstance
      .select()
      .from(rbUsageEvent)
      .where(
        and(
          eq(rbUsageEvent.companyId, companyId),
          eq(rbUsageEvent.subscriptionId, subscriptionId)
        )
      )
      .orderBy(desc(rbUsageEvent.eventTime))
      .limit(limit)
      .offset(offset);

    return events.map(e => ({
      id: e.id,
      event_time: e.eventTime.toISOString(),
      quantity: Number(e.quantity),
      unit: e.unit,
      uniq_hash: e.uniqHash,
      payload: e.payload || undefined,
    }));
  }

  /**
   * Clean up old usage events (retention policy)
   */
  async cleanupOldUsageEvents(
    companyId: string,
    olderThanDays: number = 90
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.dbInstance
      .delete(rbUsageEvent)
      .where(
        and(
          eq(rbUsageEvent.companyId, companyId),
          lte(rbUsageEvent.eventTime, cutoffDate)
        )
      );

    return result.rowCount || 0;
  }
}
