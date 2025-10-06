import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  slbTxn,
  slbAllocation,
  lease,
  leaseSchedule,
  leasePostLock,
} from '@aibos/db-adapter/schema';
import type {
  SlbPostingReqType,
  SlbPostingResponseType,
} from '@aibos/contracts';
import { postJournal } from '@/services/gl/journals';

export class SlbPostingService {
  constructor(private dbInstance = db) {}

  /**
   * Post initial SLB entries
   */
  async postInitialEntries(
    companyId: string,
    userId: string,
    data: SlbPostingReqType
  ): Promise<SlbPostingResponseType> {
    // Get SLB transaction details
    const slbRecord = await this.dbInstance
      .select()
      .from(slbTxn)
      .where(and(eq(slbTxn.id, data.slbId), eq(slbTxn.companyId, companyId)))
      .limit(1);

    if (slbRecord.length === 0) {
      throw new Error('SLB transaction not found');
    }

    const slbData = slbRecord[0]!;

    if (slbData.status !== 'MEASURED') {
      throw new Error('SLB transaction must be measured before posting');
    }

    // Get allocation details
    const allocation = await this.dbInstance
      .select()
      .from(slbAllocation)
      .where(eq(slbAllocation.slbId, data.slbId))
      .limit(1);

    if (allocation.length === 0) {
      throw new Error('SLB allocation not found');
    }

    const allocationData = allocation[0]!;

    // Create journal entries
    const journalId = await this.postSlbInitialJournal(
      companyId,
      userId,
      slbData,
      allocationData,
      data.dryRun || false
    );

    // Update SLB status
    if (!data.dryRun) {
      await this.dbInstance
        .update(slbTxn)
        .set({
          status: 'POSTED',
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(slbTxn.id, data.slbId));
    }

    return {
      slbId: data.slbId,
      journalId: data.dryRun ? null : journalId,
      status: data.dryRun ? 'DRY_RUN' : 'POSTED',
      message: data.dryRun
        ? 'Dry run completed'
        : 'Initial SLB entries posted successfully',
    };
  }

  /**
   * Post monthly SLB entries (leaseback interest, ROU amortization, deferred gain unwind)
   */
  async postMonthlyEntries(
    companyId: string,
    userId: string,
    data: SlbPostingReqType
  ): Promise<SlbPostingResponseType> {
    // Get SLB transaction details
    const slbRecord = await this.dbInstance
      .select()
      .from(slbTxn)
      .where(and(eq(slbTxn.id, data.slbId), eq(slbTxn.companyId, companyId)))
      .limit(1);

    if (slbRecord.length === 0) {
      throw new Error('SLB transaction not found');
    }

    const slbData = slbRecord[0]!;

    if (!slbData.leasebackId) {
      throw new Error('No leaseback lease found for SLB transaction');
    }

    // Check if already posted for this period
    const existingLock = await this.dbInstance
      .select()
      .from(leasePostLock)
      .where(
        and(
          eq(leasePostLock.companyId, companyId),
          eq(leasePostLock.year, data.year || new Date().getFullYear()),
          eq(leasePostLock.month, data.month || new Date().getMonth() + 1)
        )
      )
      .limit(1);

    if (existingLock.length > 0 && !data.dryRun) {
      return {
        slbId: data.slbId,
        journalId: existingLock[0]!.journalId,
        status: 'ALREADY_POSTED',
        message: 'Entries already posted for this period',
      };
    }

    // Get leaseback schedule for the period
    const scheduleRecord = await this.dbInstance
      .select()
      .from(leaseSchedule)
      .where(
        and(
          eq(leaseSchedule.leaseId, slbData.leasebackId),
          eq(leaseSchedule.year, data.year || new Date().getFullYear()),
          eq(leaseSchedule.month, data.month || new Date().getMonth() + 1)
        )
      )
      .limit(1);

    if (scheduleRecord.length === 0) {
      throw new Error('Leaseback schedule not found for the specified period');
    }

    const scheduleData = scheduleRecord[0]!;

    // Get allocation details for deferred gain calculation
    const allocation = await this.dbInstance
      .select()
      .from(slbAllocation)
      .where(eq(slbAllocation.slbId, data.slbId))
      .limit(1);

    if (allocation.length === 0) {
      throw new Error('SLB allocation not found');
    }

    const allocationData = allocation[0]!;

    // Create journal entries
    const journalId = await this.postSlbMonthlyJournal(
      companyId,
      userId,
      slbData,
      scheduleData,
      allocationData,
      data.dryRun || false
    );

    return {
      slbId: data.slbId,
      journalId: data.dryRun ? null : journalId,
      status: data.dryRun ? 'DRY_RUN' : 'POSTED',
      message: data.dryRun
        ? 'Dry run completed'
        : 'Monthly SLB entries posted successfully',
    };
  }

  /**
   * Post initial SLB journal entries
   */
  private async postSlbInitialJournal(
    companyId: string,
    userId: string,
    slbData: any,
    allocationData: any,
    dryRun: boolean
  ): Promise<string> {
    const journalLines = [];

    // Dr Cash (sale proceeds)
    journalLines.push({
      accountCode: 'CASH',
      dc: 'DR',
      amount: Number(slbData.salePrice),
      currency: slbData.ccy,
      description: `SLB cash proceeds - ${slbData.assetDesc}`,
    });

    // Dr ROU asset (retained)
    if (Number(allocationData.rouRetained) > 0) {
      journalLines.push({
        accountCode: 'ROU',
        dc: 'DR',
        amount: Number(allocationData.rouRetained),
        currency: slbData.ccy,
        description: `ROU asset retained - ${slbData.assetDesc}`,
      });
    }

    // Cr PPE/Asset (carrying amount)
    const carryingAmount =
      Number(slbData.salePrice) -
      Number(allocationData.gainRecognized) -
      Number(allocationData.gainDeferred);
    journalLines.push({
      accountCode: 'PPE',
      dc: 'CR',
      amount: carryingAmount,
      currency: slbData.ccy,
      description: `Asset disposal - ${slbData.assetDesc}`,
    });

    // Cr Lease liability (leaseback PV)
    if (slbData.leasebackId) {
      const leasebackLiability = await this.getLeasebackLiability(
        slbData.leasebackId
      );
      if (leasebackLiability > 0) {
        journalLines.push({
          accountCode: 'LEASE_LIABILITY',
          dc: 'CR',
          amount: leasebackLiability,
          currency: slbData.ccy,
          description: `Leaseback liability - ${slbData.assetDesc}`,
        });
      }
    }

    // Cr Gain on disposal (recognized)
    if (Number(allocationData.gainRecognized) > 0) {
      journalLines.push({
        accountCode: 'GAIN_DISPOSAL',
        dc: 'CR',
        amount: Number(allocationData.gainRecognized),
        currency: slbData.ccy,
        description: `Gain on disposal (recognized) - ${slbData.assetDesc}`,
      });
    }

    // Cr Deferred gain (liability)
    if (Number(allocationData.gainDeferred) > 0) {
      journalLines.push({
        accountCode: 'DEFERRED_GAIN',
        dc: 'CR',
        amount: Number(allocationData.gainDeferred),
        currency: slbData.ccy,
        description: `Deferred gain liability - ${slbData.assetDesc}`,
      });
    }

    // Post journal
    const transformedLines = journalLines.map(line => ({
      accountId: line.accountCode,
      debit: line.dc === 'DR' ? line.amount : 0,
      credit: line.dc === 'CR' ? line.amount : 0,
      description: line.description,
    }));

    const journalId = await postJournal(companyId, {
      date: new Date(slbData.saleDate),
      memo: `Initial SLB posting - ${slbData.assetDesc}`,
      lines: transformedLines,
    });

    return journalId.journalId;
  }

  /**
   * Post monthly SLB journal entries
   */
  private async postSlbMonthlyJournal(
    companyId: string,
    userId: string,
    slbData: any,
    scheduleData: any,
    allocationData: any,
    dryRun: boolean
  ): Promise<string> {
    const journalLines = [];

    // Dr Interest expense on leaseback
    if (Number(scheduleData.interest) > 0) {
      journalLines.push({
        accountCode: 'INTEREST_EXPENSE',
        dc: 'DR',
        amount: Number(scheduleData.interest),
        currency: slbData.ccy,
        description: `Leaseback interest expense - ${slbData.assetDesc}`,
      });
    }

    // Dr Lease liability (principal)
    const principal =
      Number(scheduleData.payment) - Number(scheduleData.interest);
    if (principal > 0) {
      journalLines.push({
        accountCode: 'LEASE_LIABILITY',
        dc: 'DR',
        amount: principal,
        currency: slbData.ccy,
        description: `Leaseback liability (principal) - ${slbData.assetDesc}`,
      });
    }

    // Cr Cash (payment)
    if (Number(scheduleData.payment) > 0) {
      journalLines.push({
        accountCode: 'CASH',
        dc: 'CR',
        amount: Number(scheduleData.payment),
        currency: slbData.ccy,
        description: `Leaseback payment - ${slbData.assetDesc}`,
      });
    }

    // Dr ROU amortization expense
    if (Number(scheduleData.rouAmort) > 0) {
      journalLines.push({
        accountCode: 'ROU_AMORTIZATION',
        dc: 'DR',
        amount: Number(scheduleData.rouAmort),
        currency: slbData.ccy,
        description: `ROU amortization expense - ${slbData.assetDesc}`,
      });
    }

    // Cr ROU asset
    if (Number(scheduleData.rouAmort) > 0) {
      journalLines.push({
        accountCode: 'ROU',
        dc: 'CR',
        amount: Number(scheduleData.rouAmort),
        currency: slbData.ccy,
        description: `ROU asset - ${slbData.assetDesc}`,
      });
    }

    // Dr Deferred gain unwind
    const deferredGainUnwind = await this.calculateDeferredGainUnwind(
      allocationData,
      scheduleData
    );
    if (deferredGainUnwind > 0) {
      journalLines.push({
        accountCode: 'DEFERRED_GAIN',
        dc: 'DR',
        amount: deferredGainUnwind,
        currency: slbData.ccy,
        description: `Deferred gain unwind - ${slbData.assetDesc}`,
      });

      // Cr Gain on disposal (unwind)
      journalLines.push({
        accountCode: 'GAIN_DISPOSAL',
        dc: 'CR',
        amount: deferredGainUnwind,
        currency: slbData.ccy,
        description: `Gain on disposal (unwind) - ${slbData.assetDesc}`,
      });
    }

    // Post journal
    const transformedLines = journalLines.map(line => ({
      accountId: line.accountCode,
      debit: line.dc === 'DR' ? line.amount : 0,
      credit: line.dc === 'CR' ? line.amount : 0,
      description: line.description,
    }));

    const journalId = await postJournal(companyId, {
      date: new Date(scheduleData.year, scheduleData.month - 1, 1),
      memo: `Monthly SLB posting - ${slbData.assetDesc}`,
      lines: transformedLines,
    });

    return journalId.journalId;
  }

  /**
   * Calculate deferred gain unwind for the period
   */
  private async calculateDeferredGainUnwind(
    allocationData: any,
    scheduleData: any
  ): Promise<number> {
    const totalDeferredGain = Number(allocationData.gainDeferred);
    const rouAmortization = Number(scheduleData.rouAmort);

    // Simplified calculation: unwind deferred gain proportionally to ROU consumption
    // In practice, this would be more sophisticated based on the specific terms
    const totalRouRetained = Number(allocationData.rouRetained);

    if (totalRouRetained === 0) {
      return 0;
    }

    const unwindRate = rouAmortization / totalRouRetained;
    const deferredGainUnwind = totalDeferredGain * unwindRate;

    return Math.min(deferredGainUnwind, totalDeferredGain);
  }

  /**
   * Get leaseback liability
   */
  private async getLeasebackLiability(leasebackId: string): Promise<number> {
    const opening = await this.dbInstance
      .select()
      .from(leaseSchedule)
      .where(eq(leaseSchedule.leaseId, leasebackId))
      .orderBy(asc(leaseSchedule.year), asc(leaseSchedule.month))
      .limit(1);

    if (opening.length === 0) {
      return 0;
    }

    return Number(opening[0]!.openLiab);
  }
}
