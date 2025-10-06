import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lt } from 'drizzle-orm';
import { closeItem, closeSlaPolicy, outbox } from '@aibos/db-adapter/schema';
import type {
  SlaPolicyUpsertType,
  SlaPolicyResponseType,
} from '@aibos/contracts';

export class CloseSlaService {
  constructor(private dbInstance = db) {}

  /**
   * Upsert SLA policy
   */
  async upsertSlaPolicy(
    companyId: string,
    userId: string,
    data: SlaPolicyUpsertType
  ): Promise<SlaPolicyResponseType> {
    const policyId = ulid();

    const policyData = {
      id: policyId,
      companyId,
      code: data.code,
      tz: data.tz,
      cutoffDay: data.cutoffDay,
      graceHours: data.graceHours,
      escal1Hours: data.escal1Hours,
      escal2Hours: data.escal2Hours,
      escalToLvl1: data.escalToLvl1 || null,
      escalToLvl2: data.escalToLvl2 || null,
      createdBy: userId,
      updatedBy: userId,
    };

    await this.dbInstance
      .insert(closeSlaPolicy)
      .values(policyData)
      .onConflictDoUpdate({
        target: [closeSlaPolicy.companyId, closeSlaPolicy.code],
        set: {
          tz: policyData.tz,
          cutoffDay: policyData.cutoffDay,
          graceHours: policyData.graceHours,
          escal1Hours: policyData.escal1Hours,
          escal2Hours: policyData.escal2Hours,
          escalToLvl1: policyData.escalToLvl1,
          escalToLvl2: policyData.escalToLvl2,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

    const [result] = await this.dbInstance
      .select()
      .from(closeSlaPolicy)
      .where(eq(closeSlaPolicy.id, policyId));

    if (!result) {
      throw new Error('Failed to create SLA policy');
    }

    return {
      id: result.id,
      companyId: result.companyId,
      code: result.code,
      tz: result.tz,
      cutoffDay: result.cutoffDay,
      graceHours: result.graceHours,
      escal1Hours: result.escal1Hours,
      escal2Hours: result.escal2Hours,
      escalToLvl1: result.escalToLvl1,
      escalToLvl2: result.escalToLvl2,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  /**
   * Get SLA policy for company
   */
  async getSlaPolicy(
    companyId: string,
    code: string = 'MONTH_END'
  ): Promise<SlaPolicyResponseType | null> {
    const [result] = await this.dbInstance
      .select()
      .from(closeSlaPolicy)
      .where(
        and(
          eq(closeSlaPolicy.companyId, companyId),
          eq(closeSlaPolicy.code, code)
        )
      );

    if (!result) return null;

    return {
      id: result.id,
      companyId: result.companyId,
      code: result.code,
      tz: result.tz,
      cutoffDay: result.cutoffDay,
      graceHours: result.graceHours,
      escal1Hours: result.escal1Hours,
      escal2Hours: result.escal2Hours,
      escalToLvl1: result.escalToLvl1,
      escalToLvl2: result.escalToLvl2,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  /**
   * Tick SLA for all items in a company/period
   */
  async tickSla(
    companyId: string,
    period: string
  ): Promise<{
    updated: number;
    escalated: number;
    events: string[];
  }> {
    const policy = await this.getSlaPolicy(companyId);
    if (!policy) {
      throw new Error('No SLA policy found for company');
    }

    const now = new Date();
    const events: string[] = [];
    let updated = 0;
    let escalated = 0;

    // Get all open items for the period
    const items = await this.dbInstance
      .select()
      .from(closeItem)
      .where(
        and(
          eq(closeItem.companyId, companyId),
          eq(closeItem.period, period),
          sql`${closeItem.status} IN ('OPEN', 'IN_PROGRESS', 'BLOCKED')`
        )
      );

    for (const item of items) {
      const dueDate = new Date(item.dueAt);
      const hoursOverdue = Math.max(
        0,
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)
      );
      const agingDays = Math.floor(hoursOverdue / 24);

      let newSlaState = 'OK';
      let shouldEscalate = false;

      // Determine SLA state based on policy
      if (hoursOverdue <= policy.graceHours) {
        newSlaState = 'OK';
      } else if (hoursOverdue <= policy.escal1Hours) {
        newSlaState = 'DUE_SOON';
      } else if (hoursOverdue <= policy.escal2Hours) {
        newSlaState = 'LATE';
      } else {
        newSlaState = 'ESCALATED';
        shouldEscalate = true;
      }

      // Update item if SLA state changed
      if (item.slaState !== newSlaState || item.agingDays !== agingDays) {
        await this.dbInstance
          .update(closeItem)
          .set({
            slaState: newSlaState,
            agingDays,
            updatedAt: now,
          })
          .where(eq(closeItem.id, item.id));

        updated++;

        // Emit escalation event if needed
        if (shouldEscalate && item.slaState !== 'ESCALATED') {
          await this.emitEscalationEvent(item, policy);
          escalated++;
          events.push(`Escalated item ${item.id} to level ${newSlaState}`);
        }

        // Emit due soon event
        if (newSlaState === 'DUE_SOON' && item.slaState !== 'DUE_SOON') {
          await this.emitDueSoonEvent(item);
          events.push(`Item ${item.id} is due soon`);
        }
      }
    }

    return { updated, escalated, events };
  }

  /**
   * Emit escalation event
   */
  private async emitEscalationEvent(
    item: any,
    policy: SlaPolicyResponseType
  ): Promise<void> {
    const eventData = {
      itemId: item.id,
      title: item.title,
      process: item.process,
      ownerId: item.ownerId,
      slaState: 'ESCALATED',
      agingDays: item.agingDays,
      escalToLvl1: policy.escalToLvl1,
      escalToLvl2: policy.escalToLvl2,
      timestamp: new Date().toISOString(),
    };

    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'CLOSE_SLA_ESCALATED',
      payload: JSON.stringify(eventData),
    });
  }

  /**
   * Emit due soon event
   */
  private async emitDueSoonEvent(item: any): Promise<void> {
    const eventData = {
      itemId: item.id,
      title: item.title,
      process: item.process,
      ownerId: item.ownerId,
      dueAt: item.dueAt.toISOString(),
      timestamp: new Date().toISOString(),
    };

    await this.dbInstance.insert(outbox).values({
      id: ulid(),
      topic: 'CLOSE_SLA_DUE_SOON',
      payload: JSON.stringify(eventData),
    });
  }

  /**
   * Calculate SLA metrics for a period
   */
  async getSlaMetrics(
    companyId: string,
    period: string
  ): Promise<{
    totalItems: number;
    onTime: number;
    late: number;
    escalated: number;
    avgAgingDays: number;
    maxAgingDays: number;
  }> {
    const [result] = await this.dbInstance
      .select({
        totalItems: sql<number>`count(*)`,
        onTime: sql<number>`count(*) filter (where sla_state = 'OK')`,
        late: sql<number>`count(*) filter (where sla_state = 'LATE')`,
        escalated: sql<number>`count(*) filter (where sla_state = 'ESCALATED')`,
        avgAgingDays: sql<number>`avg(aging_days)`,
        maxAgingDays: sql<number>`max(aging_days)`,
      })
      .from(closeItem)
      .where(
        and(eq(closeItem.companyId, companyId), eq(closeItem.period, period))
      );

    return {
      totalItems: result?.totalItems || 0,
      onTime: result?.onTime || 0,
      late: result?.late || 0,
      escalated: result?.escalated || 0,
      avgAgingDays: Math.round((result?.avgAgingDays || 0) * 100) / 100,
      maxAgingDays: result?.maxAgingDays || 0,
    };
  }
}
