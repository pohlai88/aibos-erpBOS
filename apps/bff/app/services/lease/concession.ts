import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  lease,
  leaseMod,
  leaseModLine,
  leaseConcessionPolicy,
  leaseComponent,
  leaseComponentSchedDelta,
} from '@aibos/db-adapter/schema';
import type {
  LeaseModCreateReqType,
  LeaseModCreateResponseType,
} from '@aibos/contracts';

export class ConcessionService {
  constructor(private dbInstance = db) {}

  /**
   * Create a concession modification
   */
  async createConcession(
    companyId: string,
    userId: string,
    data: LeaseModCreateReqType
  ): Promise<LeaseModCreateResponseType> {
    const { lease_id, effective_on, reason, lines } = data;

    // Validate lease exists
    const leaseData = await this.dbInstance
      .select()
      .from(lease)
      .where(and(eq(lease.id, lease_id), eq(lease.companyId, companyId)))
      .limit(1);

    if (leaseData.length === 0) {
      throw new Error('Lease not found');
    }

    // Get concession policy
    const policy = await this.getConcessionPolicy(companyId);

    // Create modification header
    const modId = ulid();
    await this.dbInstance.insert(leaseMod).values({
      id: modId,
      companyId,
      leaseId: lease_id,
      effectiveOn: effective_on,
      kind: 'CONCESSION',
      reason,
      status: 'DRAFT',
      createdBy: userId,
      updatedBy: userId,
    });

    // Create modification lines
    for (const line of lines) {
      await this.dbInstance.insert(leaseModLine).values({
        id: ulid(),
        modId,
        leaseComponentId: line.lease_component_id,
        action: line.action,
        qtyDelta: line.qty_delta?.toString(),
        amountDelta: line.amount_delta?.toString(),
        notes: line.notes ? JSON.stringify(line.notes) : null,
      });
    }

    return {
      mod_id: modId,
      lease_id,
      status: 'DRAFT',
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Apply concession modification
   */
  async applyConcession(
    companyId: string,
    userId: string,
    modId: string
  ): Promise<void> {
    // Get modification details
    const modData = await this.dbInstance
      .select()
      .from(leaseMod)
      .where(
        and(
          eq(leaseMod.id, modId),
          eq(leaseMod.companyId, companyId),
          eq(leaseMod.kind, 'CONCESSION')
        )
      )
      .limit(1);

    if (modData.length === 0) {
      throw new Error('Concession modification not found');
    }

    const modification = modData[0]!;

    // Get modification lines
    const modLines = await this.dbInstance
      .select()
      .from(leaseModLine)
      .where(eq(leaseModLine.modId, modId));

    if (modLines.length === 0) {
      throw new Error('No concession lines found');
    }

    // Get concession policy
    const policy = await this.getConcessionPolicy(companyId);

    // Get lease components for allocation
    const components = await this.dbInstance
      .select()
      .from(leaseComponent)
      .where(
        and(
          eq(leaseComponent.companyId, companyId),
          eq(leaseComponent.leaseId, modification.leaseId),
          eq(leaseComponent.status, 'ACTIVE')
        )
      );

    // Apply concession based on policy
    if (policy.method === 'STRAIGHT_LINE') {
      await this.applyStraightLineConcession(
        modId,
        modLines,
        components,
        policy
      );
    } else {
      await this.applyTrueModificationConcession(
        modId,
        modLines,
        components,
        policy
      );
    }

    // Update modification status
    await this.dbInstance
      .update(leaseMod)
      .set({
        status: 'APPLIED',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(leaseMod.id, modId));
  }

  /**
   * Apply straight-line concession (no liability change, impact P&L timing)
   */
  private async applyStraightLineConcession(
    modId: string,
    modLines: any[],
    components: any[],
    policy: { method: string; componentAlloc: string }
  ): Promise<void> {
    const effectiveDate = new Date();
    const currentYear = effectiveDate.getFullYear();
    const currentMonth = effectiveDate.getMonth() + 1;

    for (const line of modLines) {
      if (line.action === 'RENT_FREE' || line.action === 'DEFERRAL') {
        const concessionAmount = Number(line.amountDelta || 0);

        if (policy.componentAlloc === 'PRORATA') {
          // Allocate concession proportionally across all components
          const totalRou = components.reduce(
            (sum, comp) => sum + Number(comp.pctOfRou),
            0
          );

          for (const component of components) {
            const componentShare = Number(component.pctOfRou) / totalRou;
            const componentConcession = concessionAmount * componentShare;

            // Create schedule delta for straight-line treatment
            await this.dbInstance.insert(leaseComponentSchedDelta).values({
              id: ulid(),
              leaseComponentId: component.id,
              modId,
              year: currentYear,
              month: currentMonth,
              liabDelta: '0', // No liability change
              rouDelta: componentConcession.toString(), // Spread over remaining term
              interestDelta: '0',
              notes: JSON.stringify({
                concession_type: line.action,
                straight_line_treatment: true,
                amount: componentConcession,
              }),
            });
          }
        } else {
          // Targeted allocation to specific component
          if (line.leaseComponentId) {
            await this.dbInstance.insert(leaseComponentSchedDelta).values({
              id: ulid(),
              leaseComponentId: line.leaseComponentId,
              modId,
              year: currentYear,
              month: currentMonth,
              liabDelta: '0',
              rouDelta: concessionAmount.toString(),
              interestDelta: '0',
              notes: JSON.stringify({
                concession_type: line.action,
                straight_line_treatment: true,
                amount: concessionAmount,
              }),
            });
          }
        }
      }
    }
  }

  /**
   * Apply true modification concession (remeasure liability)
   */
  private async applyTrueModificationConcession(
    modId: string,
    modLines: any[],
    components: any[],
    policy: { method: string; componentAlloc: string }
  ): Promise<void> {
    const effectiveDate = new Date();
    const currentYear = effectiveDate.getFullYear();
    const currentMonth = effectiveDate.getMonth() + 1;

    for (const line of modLines) {
      if (line.action === 'RENT_FREE' || line.action === 'DEFERRAL') {
        const concessionAmount = Number(line.amountDelta || 0);

        if (policy.componentAlloc === 'PRORATA') {
          // Allocate concession proportionally across all components
          const totalRou = components.reduce(
            (sum, comp) => sum + Number(comp.pctOfRou),
            0
          );

          for (const component of components) {
            const componentShare = Number(component.pctOfRou) / totalRou;
            const componentConcession = concessionAmount * componentShare;

            // Create schedule delta for true modification
            await this.dbInstance.insert(leaseComponentSchedDelta).values({
              id: ulid(),
              leaseComponentId: component.id,
              modId,
              year: currentYear,
              month: currentMonth,
              liabDelta: componentConcession.toString(), // Liability adjustment
              rouDelta: componentConcession.toString(), // ROU adjustment
              interestDelta: '0',
              notes: JSON.stringify({
                concession_type: line.action,
                true_modification: true,
                amount: componentConcession,
              }),
            });
          }
        } else {
          // Targeted allocation to specific component
          if (line.leaseComponentId) {
            await this.dbInstance.insert(leaseComponentSchedDelta).values({
              id: ulid(),
              leaseComponentId: line.leaseComponentId,
              modId,
              year: currentYear,
              month: currentMonth,
              liabDelta: concessionAmount.toString(),
              rouDelta: concessionAmount.toString(),
              interestDelta: '0',
              notes: JSON.stringify({
                concession_type: line.action,
                true_modification: true,
                amount: concessionAmount,
              }),
            });
          }
        }
      }
    }
  }

  /**
   * Get concession policy for company
   */
  private async getConcessionPolicy(companyId: string): Promise<{
    method: string;
    componentAlloc: string;
  }> {
    const policy = await this.dbInstance
      .select()
      .from(leaseConcessionPolicy)
      .where(eq(leaseConcessionPolicy.companyId, companyId))
      .limit(1);

    if (policy.length === 0) {
      // Return default policy
      return {
        method: 'STRAIGHT_LINE',
        componentAlloc: 'PRORATA',
      };
    }

    return {
      method: policy[0]!.method,
      componentAlloc: policy[0]!.componentAlloc,
    };
  }

  /**
   * Update concession policy
   */
  async updateConcessionPolicy(
    companyId: string,
    userId: string,
    policy: {
      method: 'STRAIGHT_LINE' | 'TRUE_MOD';
      componentAlloc: 'PRORATA' | 'TARGETED';
      notes?: string;
    }
  ): Promise<void> {
    await this.dbInstance
      .insert(leaseConcessionPolicy)
      .values({
        id: ulid(),
        companyId,
        method: policy.method,
        componentAlloc: policy.componentAlloc,
        notes: policy.notes,
        createdBy: userId,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: [leaseConcessionPolicy.companyId],
        set: {
          method: policy.method,
          componentAlloc: policy.componentAlloc,
          notes: policy.notes,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });
  }

  /**
   * Get concession modifications for a lease
   */
  async getConcessionModifications(
    companyId: string,
    leaseId: string
  ): Promise<
    Array<{
      mod_id: string;
      effective_on: string;
      reason: string;
      status: string;
      total_concession: number;
      created_at: string;
    }>
  > {
    const modifications = await this.dbInstance
      .select({
        id: leaseMod.id,
        effectiveOn: leaseMod.effectiveOn,
        reason: leaseMod.reason,
        status: leaseMod.status,
        createdAt: leaseMod.createdAt,
      })
      .from(leaseMod)
      .where(
        and(
          eq(leaseMod.companyId, companyId),
          eq(leaseMod.leaseId, leaseId),
          eq(leaseMod.kind, 'CONCESSION')
        )
      )
      .orderBy(desc(leaseMod.effectiveOn));

    const result = [];
    for (const mod of modifications) {
      // Calculate total concession amount
      const lines = await this.dbInstance
        .select()
        .from(leaseModLine)
        .where(eq(leaseModLine.modId, mod.id));

      const totalConcession = lines.reduce((sum, line) => {
        if (line.action === 'RENT_FREE' || line.action === 'DEFERRAL') {
          return sum + Number(line.amountDelta || 0);
        }
        return sum;
      }, 0);

      result.push({
        mod_id: mod.id,
        effective_on: mod.effectiveOn,
        reason: mod.reason,
        status: mod.status,
        total_concession: totalConcession,
        created_at: mod.createdAt.toISOString(),
      });
    }

    return result;
  }
}
