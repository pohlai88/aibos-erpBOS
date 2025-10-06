import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  lease,
  leaseComponent,
  leaseComponentSched,
  leaseSchedule,
  leaseExit,
  leaseExitCalc,
  leaseExitFx,
  leaseExitPostLock,
  leaseBuyoutFaLink,
  leaseExitEvidence,
} from '@aibos/db-adapter/schema';
import type {
  LeaseExitUpsertType,
  LeaseExitQueryType,
  LeaseExitPostReqType,
  LeaseExitPostResponseType,
  LeaseExitEvidenceReqType,
} from '@aibos/contracts';
import { postJournal } from '@/services/gl/journals';
import { listRates } from '@/services/fx/rates';

/**
 * M28.7: Lease Exit Service
 *
 * Handles lease derecognition, early termination, surrenders, and buyouts
 * following MFRS 16 and IAS 37 requirements
 */
export class LeaseExitService {
  constructor(private dbInstance = db) {}

  /**
   * Create or update a lease exit event
   */
  async upsertExit(
    companyId: string,
    userId: string,
    data: LeaseExitUpsertType
  ): Promise<string> {
    // Find lease
    const leaseData = await this.dbInstance
      .select()
      .from(lease)
      .where(
        and(
          eq(lease.companyId, companyId),
          eq(lease.leaseCode, data.lease_code)
        )
      )
      .limit(1);

    if (leaseData.length === 0) {
      throw new Error('Lease not found');
    }

    const leaseRecord = leaseData[0]!;

    // Find component if specified
    let componentId: string | null = null;
    if (data.component_code) {
      const componentData = await this.dbInstance
        .select()
        .from(leaseComponent)
        .where(
          and(
            eq(leaseComponent.leaseId, leaseRecord.id),
            eq(leaseComponent.code, data.component_code)
          )
        )
        .limit(1);

      if (componentData.length === 0) {
        throw new Error('Lease component not found');
      }

      componentId = componentData[0]!.id;
    }

    // Create exit record
    const exitId = ulid();
    await this.dbInstance.insert(leaseExit).values({
      id: exitId,
      companyId,
      leaseId: leaseRecord.id,
      componentId,
      eventDate: data.event_date,
      kind: data.kind,
      reason: data.reason,
      settlement: data.settlement.toString(),
      penalty: data.penalty.toString(),
      restoration: data.restoration.toString(),
      status: 'DRAFT',
      createdAt: new Date(),
      createdBy: userId,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    // Calculate derecognition amounts
    await this.calculateExitAmounts(
      companyId,
      exitId,
      leaseRecord.id,
      componentId,
      data
    );

    return exitId;
  }

  /**
   * Calculate derecognition amounts for exit
   */
  private async calculateExitAmounts(
    companyId: string,
    exitId: string,
    leaseId: string,
    componentId: string | null,
    data: LeaseExitUpsertType
  ): Promise<void> {
    // Get latest carrying amounts from schedule
    const latestSchedule = await this.getLatestCarryingAmounts(
      leaseId,
      componentId
    );

    if (!latestSchedule) {
      throw new Error('No schedule data found for derecognition calculation');
    }

    // Calculate share percentage for partial exits
    const sharePct = data.share_pct || 100.0;
    const shareDecimal = sharePct / 100.0;

    // Calculate derecognition amounts
    const carryingRou = Number(latestSchedule.rouCarry);
    const carryingLiab = Number(latestSchedule.closeLiab);

    const derecogRou = carryingRou * shareDecimal;
    const derecogLiab = carryingLiab * shareDecimal;

    // Calculate gain/loss (simplified - would need more complex logic for settlement/penalty)
    const gainLoss =
      derecogLiab - derecogRou + (data.settlement || 0) - (data.penalty || 0);

    // Store calculation
    await this.dbInstance.insert(leaseExitCalc).values({
      id: ulid(),
      exitId,
      carryingRou: carryingRou.toString(),
      carryingLiab: carryingLiab.toString(),
      sharePct: sharePct.toString(),
      derecogRou: derecogRou.toString(),
      derecogLiab: derecogLiab.toString(),
      gainLoss: gainLoss.toString(),
      notes: JSON.stringify({
        calculation_date: new Date().toISOString(),
        share_pct: sharePct,
        settlement: data.settlement,
        penalty: data.penalty,
        restoration: data.restoration,
      }),
      createdAt: new Date(),
    });

    // Store FX information
    await this.storeFxInformation(companyId, exitId, data);
  }

  /**
   * Get latest carrying amounts from schedule
   */
  private async getLatestCarryingAmounts(
    leaseId: string,
    componentId: string | null
  ): Promise<any> {
    if (componentId) {
      // Component-level exit
      const componentSchedule = await this.dbInstance
        .select()
        .from(leaseComponentSched)
        .where(eq(leaseComponentSched.leaseComponentId, componentId))
        .orderBy(
          desc(leaseComponentSched.year),
          desc(leaseComponentSched.month)
        )
        .limit(1);

      if (componentSchedule.length > 0) {
        const sched = componentSchedule[0]!;
        return {
          rouCarry: sched.closeCarry,
          closeLiab: sched.liabReduction, // Simplified - would need proper liability calculation
        };
      }
    } else {
      // Lease-level exit
      const latestSchedule = await this.dbInstance
        .select()
        .from(leaseSchedule)
        .where(eq(leaseSchedule.leaseId, leaseId))
        .orderBy(desc(leaseSchedule.year), desc(leaseSchedule.month))
        .limit(1);

      if (latestSchedule.length > 0) {
        const sched = latestSchedule[0]!;
        return {
          rouCarry: sched.rouCarry,
          closeLiab: sched.closeLiab,
        };
      }
    }

    return null;
  }

  /**
   * Store FX information for exit
   */
  private async storeFxInformation(
    companyId: string,
    exitId: string,
    data: LeaseExitUpsertType
  ): Promise<void> {
    // Get lease currency and presentation currency
    const leaseData = await this.dbInstance
      .select()
      .from(lease)
      .where(eq(lease.leaseCode, data.lease_code))
      .limit(1);

    if (leaseData.length === 0) {
      throw new Error('Lease not found for FX calculation');
    }

    const leaseRecord = leaseData[0]!;
    const presentCcy = leaseRecord.presentCcy || leaseRecord.ccy;

    // Get FX rates (simplified - would use proper FX service)
    const fxRates = await listRates(companyId, {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    const spotRate = fxRates.length > 0 ? fxRates[0]!.rate : 1.0;

    await this.dbInstance.insert(leaseExitFx).values({
      id: ulid(),
      exitId,
      rateSrc: 'CLOSE',
      presentCcy,
      spot: spotRate.toString(),
      policy: 'CLOSE',
      createdAt: new Date(),
    });
  }

  /**
   * Post exit journal entries
   */
  async postExit(
    companyId: string,
    userId: string,
    data: LeaseExitPostReqType
  ): Promise<LeaseExitPostResponseType> {
    const { exit_id, dry_run } = data;

    // Get exit details
    const exitData = await this.dbInstance
      .select()
      .from(leaseExit)
      .where(and(eq(leaseExit.id, exit_id), eq(leaseExit.companyId, companyId)))
      .limit(1);

    if (exitData.length === 0) {
      throw new Error('Exit not found');
    }

    const exit = exitData[0]!;

    // Check if already posted
    if (exit.status === 'POSTED') {
      throw new Error('Exit already posted');
    }

    // Check posting lock
    await this.checkPostingLock(
      companyId,
      exit.leaseId,
      exit.componentId,
      exit.eventDate
    );

    // Get calculation details
    const calcData = await this.dbInstance
      .select()
      .from(leaseExitCalc)
      .where(eq(leaseExitCalc.exitId, exit_id))
      .limit(1);

    if (calcData.length === 0) {
      throw new Error('Exit calculation not found');
    }

    const calc = calcData[0]!;

    // Generate journal entries
    const journalLines = this.generateJournalEntries(exit, calc);

    let journalId: string | null = null;
    let status: 'DRAFT' | 'POSTED' | 'ERROR' = 'DRAFT';
    let message = '';

    if (!dry_run) {
      try {
        // Set posting lock
        await this.setPostingLock(
          companyId,
          exit.leaseId,
          exit.componentId,
          exit.eventDate,
          'POSTING'
        );

        // Post journal
        const journalResult = await postJournal(companyId, {
          date: new Date(exit.eventDate),
          memo: `Lease exit: ${exit.reason}`,
          lines: journalLines.map(line => ({
            accountId: line.account,
            debit: line.debit,
            credit: line.credit,
            description: line.memo,
          })),
        });

        journalId = journalResult.journalId;
        status = 'POSTED';
        message = 'Exit posted successfully';

        // Update exit status
        await this.dbInstance
          .update(leaseExit)
          .set({
            status: 'POSTED',
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(leaseExit.id, exit_id));

        // Update posting lock
        await this.setPostingLock(
          companyId,
          exit.leaseId,
          exit.componentId,
          exit.eventDate,
          'POSTED',
          journalId,
          userId
        );
      } catch (error) {
        status = 'ERROR';
        message = error instanceof Error ? error.message : 'Unknown error';

        // Update posting lock with error
        await this.setPostingLock(
          companyId,
          exit.leaseId,
          exit.componentId,
          exit.eventDate,
          'ERROR',
          null,
          null,
          message
        );
      }
    } else {
      message = 'Dry run completed successfully';
    }

    return {
      exit_id,
      journal_id: journalId,
      status,
      message,
      calculations: {
        carrying_rou: Number(calc.carryingRou),
        carrying_liab: Number(calc.carryingLiab),
        derecog_rou: Number(calc.derecogRou),
        derecog_liab: Number(calc.derecogLiab),
        gain_loss: Number(calc.gainLoss),
        settlement: Number(exit.settlement),
        penalty: Number(exit.penalty),
      },
      journal_lines: journalLines,
    };
  }

  /**
   * Generate journal entries for exit
   */
  private generateJournalEntries(
    exit: any,
    calc: any
  ): Array<{
    account: string;
    debit: number;
    credit: number;
    memo: string;
  }> {
    const lines: Array<{
      account: string;
      debit: number;
      credit: number;
      memo: string;
    }> = [];

    const derecogRou = Number(calc.derecogRou);
    const derecogLiab = Number(calc.derecogLiab);
    const gainLoss = Number(calc.gainLoss);
    const settlement = Number(exit.settlement);
    const penalty = Number(exit.penalty);

    // Derecognize lease liability
    lines.push({
      account: 'Lease Liability',
      debit: derecogLiab,
      credit: 0,
      memo: `Derecognize lease liability - ${exit.kind} exit`,
    });

    // Derecognize ROU asset
    lines.push({
      account: 'ROU Asset',
      debit: 0,
      credit: derecogRou,
      memo: `Derecognize ROU asset - ${exit.kind} exit`,
    });

    // Gain/Loss on derecognition
    if (gainLoss > 0) {
      lines.push({
        account: 'Gain on Lease Termination',
        debit: 0,
        credit: gainLoss,
        memo: `Gain on lease derecognition - ${exit.kind} exit`,
      });
    } else if (gainLoss < 0) {
      lines.push({
        account: 'Loss on Lease Termination',
        debit: Math.abs(gainLoss),
        credit: 0,
        memo: `Loss on lease derecognition - ${exit.kind} exit`,
      });
    }

    // Settlement payment
    if (settlement > 0) {
      lines.push({
        account: 'Cash',
        debit: settlement,
        credit: 0,
        memo: `Settlement payment - ${exit.kind} exit`,
      });
    } else if (settlement < 0) {
      lines.push({
        account: 'Cash',
        debit: 0,
        credit: Math.abs(settlement),
        memo: `Settlement receipt - ${exit.kind} exit`,
      });
    }

    // Penalty/fee
    if (penalty > 0) {
      lines.push({
        account: 'Penalty Expense',
        debit: penalty,
        credit: 0,
        memo: `Penalty for early termination - ${exit.kind} exit`,
      });
    }

    return lines;
  }

  /**
   * Check posting lock
   */
  private async checkPostingLock(
    companyId: string,
    leaseId: string,
    componentId: string | null,
    eventDate: string
  ): Promise<void> {
    const conditions = [
      eq(leaseExitPostLock.companyId, companyId),
      eq(leaseExitPostLock.leaseId, leaseId),
      eq(leaseExitPostLock.eventDate, eventDate),
    ];

    if (componentId) {
      conditions.push(eq(leaseExitPostLock.componentId, componentId));
    }

    const lockData = await this.dbInstance
      .select()
      .from(leaseExitPostLock)
      .where(and(...conditions))
      .limit(1);

    if (lockData.length > 0) {
      const lock = lockData[0]!;
      if (lock.status === 'POSTED') {
        throw new Error('Exit already posted for this period');
      }
      if (lock.status === 'POSTING') {
        throw new Error('Exit posting in progress');
      }
    }
  }

  /**
   * Set posting lock
   */
  private async setPostingLock(
    companyId: string,
    leaseId: string,
    componentId: string | null,
    eventDate: string,
    status: 'LOCKED' | 'POSTING' | 'POSTED' | 'ERROR',
    journalId?: string | null,
    postedBy?: string | null,
    errorMsg?: string | null
  ): Promise<void> {
    const lockId = ulid();

    await this.dbInstance.insert(leaseExitPostLock).values({
      id: lockId,
      companyId,
      leaseId,
      componentId,
      eventDate,
      status,
      journalId,
      postedAt: status === 'POSTED' ? new Date() : null,
      postedBy,
      errorMsg,
      createdAt: new Date(),
    });
  }

  /**
   * Query exits
   */
  async queryExits(
    companyId: string,
    query: LeaseExitQueryType
  ): Promise<any[]> {
    let whereConditions = [eq(leaseExit.companyId, companyId)];

    if (query.lease_code) {
      const leaseData = await this.dbInstance
        .select()
        .from(lease)
        .where(
          and(
            eq(lease.companyId, companyId),
            eq(lease.leaseCode, query.lease_code)
          )
        )
        .limit(1);

      if (leaseData.length > 0) {
        whereConditions.push(eq(leaseExit.leaseId, leaseData[0]!.id));
      }
    }

    if (query.kind) {
      whereConditions.push(eq(leaseExit.kind, query.kind));
    }

    if (query.status) {
      whereConditions.push(eq(leaseExit.status, query.status));
    }

    if (query.event_date_from) {
      whereConditions.push(gte(leaseExit.eventDate, query.event_date_from));
    }

    if (query.event_date_to) {
      whereConditions.push(lte(leaseExit.eventDate, query.event_date_to));
    }

    const exits = await this.dbInstance
      .select()
      .from(leaseExit)
      .where(and(...whereConditions))
      .orderBy(desc(leaseExit.eventDate))
      .limit(query.limit)
      .offset(query.offset);

    return exits;
  }

  /**
   * Link evidence to exit
   */
  async linkEvidence(
    companyId: string,
    userId: string,
    data: LeaseExitEvidenceReqType
  ): Promise<string> {
    // Verify exit exists and belongs to company
    const exitData = await this.dbInstance
      .select()
      .from(leaseExit)
      .where(
        and(eq(leaseExit.id, data.exit_id), eq(leaseExit.companyId, companyId))
      )
      .limit(1);

    if (exitData.length === 0) {
      throw new Error('Exit not found');
    }

    // Insert evidence link
    const evidenceId = ulid();
    await this.dbInstance.insert(leaseExitEvidence).values({
      id: evidenceId,
      exitId: data.exit_id,
      evidenceId: data.evidence_id,
      evidenceType: data.evidence_type,
      description: data.description,
      uploadedBy: userId,
      uploadedAt: new Date(),
    });

    return evidenceId;
  }
}
