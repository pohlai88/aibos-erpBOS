import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  lease,
  leaseMod,
  leaseModLine,
  leaseComponent,
  leaseComponentSchedDelta,
  leaseRemeasurePost,
  leaseRemeasurePostLock,
  leaseCashflow,
  leaseOpening,
} from '@aibos/db-adapter/schema';
import type {
  LeaseModApplyReqType,
  LeaseModApplyResponseType,
  LeaseModPostReqType,
  LeaseModPostResponseType,
} from '@aibos/contracts';

export class RemeasurementEngine {
  constructor(private dbInstance = db) {}

  /**
   * Central orchestrator for lease remeasurements
   */
  async applyRemeasurement(
    companyId: string,
    userId: string,
    data: LeaseModApplyReqType
  ): Promise<LeaseModApplyResponseType> {
    const { mod_id, dry_run } = data;

    // Get modification details
    const modData = await this.dbInstance
      .select()
      .from(leaseMod)
      .where(and(eq(leaseMod.id, mod_id), eq(leaseMod.companyId, companyId)))
      .limit(1);

    if (modData.length === 0) {
      throw new Error('Modification not found');
    }

    const modification = modData[0]!;

    // Get modification lines
    const modLines = await this.dbInstance
      .select()
      .from(leaseModLine)
      .where(eq(leaseModLine.modId, mod_id));

    if (modLines.length === 0) {
      throw new Error('No modification lines found');
    }

    // Get lease components
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

    // Snapshot pre-modification carrying amounts
    const preCarrying = await this.snapshotCarryingAmounts(
      companyId,
      modification.leaseId,
      components
    );

    // Calculate new carrying amounts based on modification type
    let postCarrying;
    let deltas;
    let scheduleDeltas;

    switch (modification.kind) {
      case 'INDEXATION':
        ({ postCarrying, deltas, scheduleDeltas } =
          await this.calculateIndexationImpact(
            companyId,
            modification,
            modLines,
            components,
            preCarrying
          ));
        break;
      case 'CONCESSION':
        ({ postCarrying, deltas, scheduleDeltas } =
          await this.calculateConcessionImpact(
            companyId,
            modification,
            modLines,
            components,
            preCarrying
          ));
        break;
      case 'SCOPE':
        ({ postCarrying, deltas, scheduleDeltas } =
          await this.calculateScopeImpact(
            companyId,
            modification,
            modLines,
            components,
            preCarrying
          ));
        break;
      case 'TERM':
        ({ postCarrying, deltas, scheduleDeltas } =
          await this.calculateTermImpact(
            companyId,
            modification,
            modLines,
            components,
            preCarrying
          ));
        break;
      default:
        throw new Error(`Unsupported modification kind: ${modification.kind}`);
    }

    // Create schedule deltas if not dry run
    if (!dry_run) {
      await this.createScheduleDeltas(mod_id, scheduleDeltas);

      // Update modification status
      await this.dbInstance
        .update(leaseMod)
        .set({
          status: 'APPLIED',
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(leaseMod.id, mod_id));
    }

    return {
      mod_id,
      status: dry_run ? 'DRAFT' : 'APPLIED',
      pre_carrying: preCarrying,
      post_carrying: postCarrying,
      deltas,
      schedule_deltas: scheduleDeltas,
    };
  }

  /**
   * Post remeasurement adjustments
   */
  async postRemeasurement(
    companyId: string,
    userId: string,
    data: LeaseModPostReqType
  ): Promise<LeaseModPostResponseType> {
    const { mod_id, year, month, dry_run } = data;

    // Create idempotency lock
    const lockId = ulid();
    await this.dbInstance.insert(leaseRemeasurePostLock).values({
      id: lockId,
      companyId,
      leaseId: '', // Will be filled from modification
      modId: mod_id,
      year,
      month,
      lockedBy: userId,
    });

    try {
      // Get modification details
      const modData = await this.dbInstance
        .select()
        .from(leaseMod)
        .where(
          and(
            eq(leaseMod.id, mod_id),
            eq(leaseMod.companyId, companyId),
            eq(leaseMod.status, 'APPLIED')
          )
        )
        .limit(1);

      if (modData.length === 0) {
        throw new Error('Applied modification not found');
      }

      const modification = modData[0]!;

      // Get schedule deltas for the period
      const deltas = await this.dbInstance
        .select()
        .from(leaseComponentSchedDelta)
        .where(
          and(
            eq(leaseComponentSchedDelta.modId, mod_id),
            eq(leaseComponentSchedDelta.year, year),
            eq(leaseComponentSchedDelta.month, month)
          )
        );

      if (deltas.length === 0) {
        throw new Error('No schedule deltas found for the period');
      }

      // Calculate totals
      const totalLiabilityDelta = deltas.reduce(
        (sum, delta) => sum + Number(delta.liabDelta),
        0
      );
      const totalRouDelta = deltas.reduce(
        (sum, delta) => sum + Number(delta.rouDelta),
        0
      );

      // Create journal entries
      const journalEntryId = ulid();
      const journalLines = [];

      if (totalLiabilityDelta > 0) {
        // Liability increase
        journalLines.push({
          dr_account: 'ROU asset – adjustment',
          cr_account: 'Lease liability',
          amount: totalLiabilityDelta,
          memo: `Remeasurement adjustment for modification ${mod_id}`,
        });
      } else if (totalLiabilityDelta < 0) {
        // Liability decrease
        journalLines.push({
          dr_account: 'Lease liability',
          cr_account: 'ROU asset – adjustment',
          amount: Math.abs(totalLiabilityDelta),
          memo: `Remeasurement adjustment for modification ${mod_id}`,
        });
      }

      // Create posting record if not dry run
      let postId: string | undefined;
      if (!dry_run) {
        postId = ulid();
        await this.dbInstance.insert(leaseRemeasurePost).values({
          id: postId,
          companyId,
          leaseId: modification.leaseId,
          modId: mod_id,
          year,
          month,
          journalEntryId,
          totalLiabilityDelta: totalLiabilityDelta.toString(),
          totalRouDelta: totalRouDelta.toString(),
          postedBy: userId,
        });

        // Update modification status
        await this.dbInstance
          .update(leaseMod)
          .set({
            status: 'POSTED',
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(leaseMod.id, mod_id));
      }

      return {
        post_id: postId || 'dry-run',
        mod_id,
        journal_entry_id: journalEntryId,
        year,
        month,
        total_liability_delta: totalLiabilityDelta,
        total_rou_delta: totalRouDelta,
        journal_lines: journalLines,
        posted_at: new Date().toISOString(),
        posted_by: userId,
      };
    } catch (error) {
      // Remove lock on error
      await this.dbInstance
        .delete(leaseRemeasurePostLock)
        .where(eq(leaseRemeasurePostLock.id, lockId));
      throw error;
    }
  }

  /**
   * Snapshot carrying amounts before modification
   */
  private async snapshotCarryingAmounts(
    companyId: string,
    leaseId: string,
    components: any[]
  ): Promise<{
    total_liability: number;
    total_rou: number;
    component_carryings: Array<{
      component_id: string;
      component_code: string;
      carrying_amount: number;
    }>;
  }> {
    // Get opening measures
    const opening = await this.dbInstance
      .select()
      .from(leaseOpening)
      .where(eq(leaseOpening.leaseId, leaseId))
      .limit(1);

    if (opening.length === 0) {
      throw new Error('Opening measures not found');
    }

    const initialLiability = Number(opening[0]!.initialLiability);
    const initialRou = Number(opening[0]!.initialRou);

    // Calculate component carrying amounts (simplified - would need proper schedule calculation)
    const componentCarryings = components.map(component => ({
      component_id: component.id,
      component_code: component.code,
      carrying_amount: initialRou * Number(component.pctOfRou),
    }));

    return {
      total_liability: initialLiability,
      total_rou: initialRou,
      component_carryings: componentCarryings,
    };
  }

  /**
   * Calculate indexation impact
   */
  private async calculateIndexationImpact(
    companyId: string,
    modification: any,
    modLines: any[],
    components: any[],
    preCarrying: any
  ): Promise<{
    postCarrying: any;
    deltas: any;
    scheduleDeltas: any[];
  }> {
    // Calculate indexation impact on cashflows and liability
    const totalIndexationImpact = modLines.reduce((sum, line) => {
      if (line.action === 'RATE_RESET') {
        return sum + Number(line.amountDelta || 0);
      }
      return sum;
    }, 0);

    const postCarrying = {
      total_liability: preCarrying.total_liability + totalIndexationImpact,
      total_rou: preCarrying.total_rou + totalIndexationImpact,
      component_carryings: preCarrying.component_carryings.map((comp: any) => ({
        ...comp,
        carrying_amount:
          comp.carrying_amount +
          (totalIndexationImpact * Number(comp.carrying_amount)) /
            preCarrying.total_rou,
      })),
    };

    const deltas = {
      liability_delta: totalIndexationImpact,
      rou_delta: totalIndexationImpact,
      component_deltas: preCarrying.component_carryings.map((comp: any) => ({
        component_id: comp.component_id,
        component_code: comp.component_code,
        liability_delta:
          (totalIndexationImpact * Number(comp.carrying_amount)) /
          preCarrying.total_rou,
        rou_delta:
          (totalIndexationImpact * Number(comp.carrying_amount)) /
          preCarrying.total_rou,
      })),
    };

    // Create schedule deltas
    const scheduleDeltas = [];
    const effectiveDate = new Date(modification.effectiveOn);
    const currentYear = effectiveDate.getFullYear();
    const currentMonth = effectiveDate.getMonth() + 1;

    for (const comp of preCarrying.component_carryings) {
      const componentDelta =
        (totalIndexationImpact * Number(comp.carrying_amount)) /
        preCarrying.total_rou;
      scheduleDeltas.push({
        component_id: comp.component_id,
        year: currentYear,
        month: currentMonth,
        liab_delta: componentDelta,
        rou_delta: componentDelta,
        interest_delta: 0,
      });
    }

    return { postCarrying, deltas, scheduleDeltas };
  }

  /**
   * Calculate concession impact
   */
  private async calculateConcessionImpact(
    companyId: string,
    modification: any,
    modLines: any[],
    components: any[],
    preCarrying: any
  ): Promise<{
    postCarrying: any;
    deltas: any;
    scheduleDeltas: any[];
  }> {
    // Concession impact depends on policy (straight-line vs true modification)
    // For now, assuming true modification
    const totalConcessionImpact = modLines.reduce((sum, line) => {
      if (line.action === 'RENT_FREE' || line.action === 'DEFERRAL') {
        return sum + Number(line.amountDelta || 0);
      }
      return sum;
    }, 0);

    const postCarrying = {
      total_liability: preCarrying.total_liability + totalConcessionImpact,
      total_rou: preCarrying.total_rou + totalConcessionImpact,
      component_carryings: preCarrying.component_carryings.map((comp: any) => ({
        ...comp,
        carrying_amount:
          comp.carrying_amount +
          (totalConcessionImpact * Number(comp.carrying_amount)) /
            preCarrying.total_rou,
      })),
    };

    const deltas = {
      liability_delta: totalConcessionImpact,
      rou_delta: totalConcessionImpact,
      component_deltas: preCarrying.component_carryings.map((comp: any) => ({
        component_id: comp.component_id,
        component_code: comp.component_code,
        liability_delta:
          (totalConcessionImpact * Number(comp.carrying_amount)) /
          preCarrying.total_rou,
        rou_delta:
          (totalConcessionImpact * Number(comp.carrying_amount)) /
          preCarrying.total_rou,
      })),
    };

    const scheduleDeltas = [];
    const effectiveDate = new Date(modification.effectiveOn);
    const currentYear = effectiveDate.getFullYear();
    const currentMonth = effectiveDate.getMonth() + 1;

    for (const comp of preCarrying.component_carryings) {
      const componentDelta =
        (totalConcessionImpact * Number(comp.carrying_amount)) /
        preCarrying.total_rou;
      scheduleDeltas.push({
        component_id: comp.component_id,
        year: currentYear,
        month: currentMonth,
        liab_delta: componentDelta,
        rou_delta: componentDelta,
        interest_delta: 0,
      });
    }

    return { postCarrying, deltas, scheduleDeltas };
  }

  /**
   * Calculate scope impact
   */
  private async calculateScopeImpact(
    companyId: string,
    modification: any,
    modLines: any[],
    components: any[],
    preCarrying: any
  ): Promise<{
    postCarrying: any;
    deltas: any;
    scheduleDeltas: any[];
  }> {
    const totalScopeImpact = modLines.reduce((sum, line) => {
      if (line.action === 'AREA_CHANGE' || line.action === 'DECREASE') {
        return sum + Number(line.amountDelta || 0);
      }
      return sum;
    }, 0);

    const postCarrying = {
      total_liability: preCarrying.total_liability + totalScopeImpact,
      total_rou: preCarrying.total_rou + totalScopeImpact,
      component_carryings: preCarrying.component_carryings.map((comp: any) => ({
        ...comp,
        carrying_amount:
          comp.carrying_amount +
          (totalScopeImpact * Number(comp.carrying_amount)) /
            preCarrying.total_rou,
      })),
    };

    const deltas = {
      liability_delta: totalScopeImpact,
      rou_delta: totalScopeImpact,
      component_deltas: preCarrying.component_carryings.map((comp: any) => ({
        component_id: comp.component_id,
        component_code: comp.component_code,
        liability_delta:
          (totalScopeImpact * Number(comp.carrying_amount)) /
          preCarrying.total_rou,
        rou_delta:
          (totalScopeImpact * Number(comp.carrying_amount)) /
          preCarrying.total_rou,
      })),
    };

    const scheduleDeltas = [];
    const effectiveDate = new Date(modification.effectiveOn);
    const currentYear = effectiveDate.getFullYear();
    const currentMonth = effectiveDate.getMonth() + 1;

    for (const comp of preCarrying.component_carryings) {
      const componentDelta =
        (totalScopeImpact * Number(comp.carrying_amount)) /
        preCarrying.total_rou;
      scheduleDeltas.push({
        component_id: comp.component_id,
        year: currentYear,
        month: currentMonth,
        liab_delta: componentDelta,
        rou_delta: componentDelta,
        interest_delta: 0,
      });
    }

    return { postCarrying, deltas, scheduleDeltas };
  }

  /**
   * Calculate term impact
   */
  private async calculateTermImpact(
    companyId: string,
    modification: any,
    modLines: any[],
    components: any[],
    preCarrying: any
  ): Promise<{
    postCarrying: any;
    deltas: any;
    scheduleDeltas: any[];
  }> {
    // Term changes typically don't affect carrying amounts immediately
    // They affect future cashflows and amortization schedules
    const postCarrying = { ...preCarrying };

    const deltas = {
      liability_delta: 0,
      rou_delta: 0,
      component_deltas: preCarrying.component_carryings.map((comp: any) => ({
        component_id: comp.component_id,
        component_code: comp.component_code,
        liability_delta: 0,
        rou_delta: 0,
      })),
    };

    const scheduleDeltas: any[] = [];

    return { postCarrying, deltas, scheduleDeltas };
  }

  /**
   * Create schedule deltas
   */
  private async createScheduleDeltas(
    modId: string,
    scheduleDeltas: any[]
  ): Promise<void> {
    for (const delta of scheduleDeltas) {
      await this.dbInstance.insert(leaseComponentSchedDelta).values({
        id: ulid(),
        leaseComponentId: delta.component_id,
        modId,
        year: delta.year,
        month: delta.month,
        liabDelta: delta.liab_delta.toString(),
        rouDelta: delta.rou_delta.toString(),
        interestDelta: delta.interest_delta.toString(),
        notes: JSON.stringify({
          remeasurement_delta: true,
          created_at: new Date().toISOString(),
        }),
      });
    }
  }
}
