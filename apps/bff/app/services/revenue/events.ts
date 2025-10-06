import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc, isNull } from 'drizzle-orm';
import { revEvent, revPob, revSchedule } from '@aibos/db-adapter/schema';
import type {
  EventCreateType,
  EventQueryType,
  EventResponseType,
} from '@aibos/contracts';

export class RevEventsService {
  constructor(private dbInstance = db) {}

  /**
   * Create a revenue recognition event
   */
  async createEvent(
    companyId: string,
    userId: string,
    data: EventCreateType
  ): Promise<EventResponseType> {
    const eventId = ulid();

    const event = {
      id: eventId,
      companyId,
      pobId: data.pob_id,
      occurredAt: new Date(data.occurred_at),
      kind: data.kind,
      payload: data.payload,
      processedAt: null,
      createdAt: new Date(),
      createdBy: userId,
    };

    await this.dbInstance.insert(revEvent).values(event);

    return {
      id: eventId,
      company_id: companyId,
      pob_id: data.pob_id,
      occurred_at: data.occurred_at,
      kind: data.kind,
      payload: data.payload,
      processed_at: undefined,
      created_at: new Date().toISOString(),
      created_by: userId,
    };
  }

  /**
   * Process unprocessed events
   */
  async processEvents(
    companyId: string
  ): Promise<{ processed: number; errors: number }> {
    // Get unprocessed events
    const events = await this.dbInstance
      .select()
      .from(revEvent)
      .where(
        and(eq(revEvent.companyId, companyId), isNull(revEvent.processedAt))
      )
      .orderBy(asc(revEvent.occurredAt));

    let processed = 0;
    let errors = 0;

    for (const event of events) {
      try {
        await this.processEvent(event);
        processed++;
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }

  /**
   * Process a single event
   */
  private async processEvent(event: any): Promise<void> {
    switch (event.kind) {
      case 'ACTIVATE':
        await this.handleActivate(event);
        break;
      case 'FULFILL':
        await this.handleFulfill(event);
        break;
      case 'PAUSE':
        await this.handlePause(event);
        break;
      case 'RESUME':
        await this.handleResume(event);
        break;
      case 'CANCEL':
        await this.handleCancel(event);
        break;
      case 'REFUND':
        await this.handleRefund(event);
        break;
      case 'USAGE_REPORT':
        await this.handleUsageReport(event);
        break;
      default:
        throw new Error(`Unknown event kind: ${event.kind}`);
    }

    // Mark event as processed
    await this.dbInstance
      .update(revEvent)
      .set({ processedAt: new Date() })
      .where(eq(revEvent.id, event.id));
  }

  /**
   * Handle ACTIVATE event
   */
  private async handleActivate(event: any): Promise<void> {
    // Activate POB - change status to OPEN if it was paused
    await this.dbInstance
      .update(revPob)
      .set({ status: 'OPEN' })
      .where(eq(revPob.id, event.pobId));
  }

  /**
   * Handle FULFILL event
   */
  private async handleFulfill(event: any): Promise<void> {
    // Mark POB as fulfilled
    await this.dbInstance
      .update(revPob)
      .set({ status: 'FULFILLED' })
      .where(eq(revPob.id, event.pobId));

    // Recognize any remaining planned amounts
    const schedules = await this.dbInstance
      .select()
      .from(revSchedule)
      .where(
        and(
          eq(revSchedule.pobId, event.pobId),
          eq(revSchedule.status, 'PLANNED')
        )
      );

    for (const schedule of schedules) {
      const planned = Number(schedule.planned);
      const recognized = Number(schedule.recognized);
      const remaining = planned - recognized;

      if (remaining > 0) {
        await this.dbInstance
          .update(revSchedule)
          .set({
            recognized: planned.toString(),
            status: 'DONE',
            updatedAt: new Date(),
          })
          .where(eq(revSchedule.id, schedule.id));
      }
    }
  }

  /**
   * Handle PAUSE event
   */
  private async handlePause(event: any): Promise<void> {
    // Pause POB - stop future recognition
    await this.dbInstance
      .update(revPob)
      .set({ status: 'CANCELLED' }) // Using CANCELLED as pause state
      .where(eq(revPob.id, event.pobId));
  }

  /**
   * Handle RESUME event
   */
  private async handleResume(event: any): Promise<void> {
    // Resume POB - restart recognition
    await this.dbInstance
      .update(revPob)
      .set({ status: 'OPEN' })
      .where(eq(revPob.id, event.pobId));
  }

  /**
   * Handle CANCEL event
   */
  private async handleCancel(event: any): Promise<void> {
    // Cancel POB - stop all recognition
    await this.dbInstance
      .update(revPob)
      .set({ status: 'CANCELLED' })
      .where(eq(revPob.id, event.pobId));

    // Cancel all future schedule entries
    await this.dbInstance
      .update(revSchedule)
      .set({
        planned: '0',
        status: 'DONE',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(revSchedule.pobId, event.pobId),
          eq(revSchedule.status, 'PLANNED')
        )
      );
  }

  /**
   * Handle REFUND event
   */
  private async handleRefund(event: any): Promise<void> {
    // Handle refund - reverse recognition if needed
    const refundAmount = event.payload?.amount || 0;

    if (refundAmount > 0) {
      // This would typically create a reversal journal entry
      // For now, we'll just log the refund
      console.log(`Refund processed for POB ${event.pobId}: ${refundAmount}`);
    }
  }

  /**
   * Handle USAGE_REPORT event
   */
  private async handleUsageReport(event: any): Promise<void> {
    // Handle usage-based recognition
    const usageAmount = event.payload?.amount || 0;
    const periodYear = event.payload?.year;
    const periodMonth = event.payload?.month;

    if (usageAmount > 0 && periodYear && periodMonth) {
      // Update schedule for usage-based recognition
      const schedules = await this.dbInstance
        .select()
        .from(revSchedule)
        .where(
          and(
            eq(revSchedule.pobId, event.pobId),
            eq(revSchedule.year, periodYear),
            eq(revSchedule.month, periodMonth)
          )
        )
        .limit(1);

      if (schedules.length > 0) {
        const schedule = schedules[0]!;
        const currentRecognized = Number(schedule.recognized);
        const newRecognized = currentRecognized + usageAmount;
        const planned = Number(schedule.planned);

        await this.dbInstance
          .update(revSchedule)
          .set({
            recognized: newRecognized.toString(),
            status: newRecognized >= planned ? 'DONE' : 'PARTIAL',
            updatedAt: new Date(),
          })
          .where(eq(revSchedule.id, schedule.id));
      }
    }
  }

  /**
   * Query events
   */
  async queryEvents(
    companyId: string,
    query: EventQueryType
  ): Promise<EventResponseType[]> {
    const conditions = [eq(revEvent.companyId, companyId)];

    if (query.pob_id) {
      conditions.push(eq(revEvent.pobId, query.pob_id));
    }
    if (query.kind) {
      conditions.push(eq(revEvent.kind, query.kind));
    }
    if (query.occurred_at_from) {
      conditions.push(
        gte(revEvent.occurredAt, new Date(query.occurred_at_from))
      );
    }
    if (query.occurred_at_to) {
      conditions.push(lte(revEvent.occurredAt, new Date(query.occurred_at_to)));
    }
    if (query.processed !== undefined) {
      if (query.processed) {
        conditions.push(sql`${revEvent.processedAt} IS NOT NULL`);
      } else {
        conditions.push(isNull(revEvent.processedAt));
      }
    }

    const events = await this.dbInstance
      .select()
      .from(revEvent)
      .where(and(...conditions))
      .orderBy(desc(revEvent.occurredAt))
      .limit(query.limit)
      .offset(query.offset);

    return events.map(event => ({
      id: event.id,
      company_id: event.companyId,
      pob_id: event.pobId,
      occurred_at: event.occurredAt.toISOString(),
      kind: event.kind,
      payload: event.payload,
      processed_at: event.processedAt?.toISOString(),
      created_at: event.createdAt.toISOString(),
      created_by: event.createdBy,
    }));
  }
}
