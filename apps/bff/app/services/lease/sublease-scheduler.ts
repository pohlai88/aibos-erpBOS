import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  sublease,
  subleaseSchedule,
  subleaseCf,
  lease,
  leaseComponentSublet,
  leaseComponent,
} from '@aibos/db-adapter/schema';
import type {
  SubleaseScheduleRebuildReqType,
  SubleaseScheduleRebuildResponseType,
  SubleaseScheduleQueryType,
  SubleaseScheduleResponseType,
} from '@aibos/contracts';

export class SubleaseScheduler {
  constructor(private dbInstance = db) {}

  /**
   * Build schedules for sublease (finance vs operating)
   */
  async buildSchedule(
    companyId: string,
    userId: string,
    data: SubleaseScheduleRebuildReqType
  ): Promise<SubleaseScheduleRebuildResponseType> {
    // Get sublease details
    const subleaseRecord = await this.dbInstance
      .select()
      .from(sublease)
      .where(
        and(eq(sublease.id, data.subleaseId), eq(sublease.companyId, companyId))
      )
      .limit(1);

    if (subleaseRecord.length === 0) {
      throw new Error('Sublease not found');
    }

    const subleaseData = subleaseRecord[0]!;

    // Get cashflows
    const cashflows = await this.dbInstance
      .select()
      .from(subleaseCf)
      .where(eq(subleaseCf.subleaseId, data.subleaseId))
      .orderBy(asc(subleaseCf.dueOn));

    if (cashflows.length === 0) {
      throw new Error('No cashflows found for sublease');
    }

    // Clear existing schedule
    await this.dbInstance
      .delete(subleaseSchedule)
      .where(eq(subleaseSchedule.subleaseId, data.subleaseId));

    let scheduleRows: any[] = [];

    if (subleaseData.classification === 'FINANCE') {
      scheduleRows = await this.buildFinanceSchedule(subleaseData, cashflows);
    } else {
      scheduleRows = await this.buildOperatingSchedule(subleaseData, cashflows);
    }

    // Insert schedule rows
    if (scheduleRows.length > 0) {
      await this.dbInstance.insert(subleaseSchedule).values(scheduleRows);
    }

    return {
      subleaseId: data.subleaseId,
      classification: subleaseData.classification as 'FINANCE' | 'OPERATING',
      scheduleRows: scheduleRows.length,
      totalReceipts: scheduleRows.reduce(
        (sum, row) => sum + Number(row.receipt),
        0
      ),
      totalInterestIncome: scheduleRows.reduce(
        (sum, row) => sum + (Number(row.interestIncome) || 0),
        0
      ),
      totalLeaseIncome: scheduleRows.reduce(
        (sum, row) => sum + (Number(row.leaseIncome) || 0),
        0
      ),
    };
  }

  /**
   * Query sublease schedule
   */
  async querySchedule(
    companyId: string,
    query: SubleaseScheduleQueryType
  ): Promise<SubleaseScheduleResponseType[]> {
    const conditions = [eq(sublease.companyId, companyId)];

    if (query.subleaseId) {
      conditions.push(eq(subleaseSchedule.subleaseId, query.subleaseId));
    }

    if (query.year) {
      conditions.push(eq(subleaseSchedule.year, query.year));
    }

    if (query.month) {
      conditions.push(eq(subleaseSchedule.month, query.month));
    }

    if (query.classification) {
      conditions.push(eq(sublease.classification, query.classification));
    }

    const results = await this.dbInstance
      .select({
        id: subleaseSchedule.id,
        subleaseId: subleaseSchedule.subleaseId,
        year: subleaseSchedule.year,
        month: subleaseSchedule.month,
        openingNis: subleaseSchedule.openingNis,
        interestIncome: subleaseSchedule.interestIncome,
        receipt: subleaseSchedule.receipt,
        closingNis: subleaseSchedule.closingNis,
        leaseIncome: subleaseSchedule.leaseIncome,
        notes: subleaseSchedule.notes,
        createdAt: subleaseSchedule.createdAt,
        // Sublease details
        subleaseCode: sublease.subleaseCode,
        classification: sublease.classification,
        ccy: sublease.ccy,
        rate: sublease.rate,
      })
      .from(subleaseSchedule)
      .leftJoin(sublease, eq(subleaseSchedule.subleaseId, sublease.id))
      .where(and(...conditions))
      .orderBy(asc(subleaseSchedule.year), asc(subleaseSchedule.month));

    return results.map(row => ({
      id: row.id,
      subleaseId: row.subleaseId,
      subleaseCode: row.subleaseCode,
      classification: row.classification,
      ccy: row.ccy,
      rate: row.rate ? Number(row.rate) : null,
      year: row.year,
      month: row.month,
      openingNis: row.openingNis ? Number(row.openingNis) : null,
      interestIncome: row.interestIncome ? Number(row.interestIncome) : null,
      receipt: Number(row.receipt),
      closingNis: row.closingNis ? Number(row.closingNis) : null,
      leaseIncome: row.leaseIncome ? Number(row.leaseIncome) : null,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /**
   * Build finance sublease schedule (NIS calculation)
   */
  private async buildFinanceSchedule(
    subleaseData: any,
    cashflows: any[]
  ): Promise<any[]> {
    const scheduleRows: any[] = [];
    const monthlyRate = Number(subleaseData.rate) / 12;
    const startDate = new Date(subleaseData.startOn);
    const endDate = new Date(subleaseData.endOn);

    // Calculate initial NIS (present value of receipts)
    let initialNis = 0;
    for (const cf of cashflows) {
      const monthsFromStart = this.getMonthsFromStart(
        startDate,
        new Date(cf.dueOn)
      );
      const discountFactor = Math.pow(1 + monthlyRate, -monthsFromStart);
      initialNis += Number(cf.amount) * discountFactor;
    }

    let currentNis = initialNis;
    let currentDate = new Date(startDate);

    // Generate monthly schedule
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Find cashflow for this month
      const monthlyCashflow = cashflows.find(cf => {
        const cfDate = new Date(cf.dueOn);
        return cfDate.getFullYear() === year && cfDate.getMonth() + 1 === month;
      });

      const receipt = monthlyCashflow ? Number(monthlyCashflow.amount) : 0;
      const interestIncome = currentNis * monthlyRate;
      const principal = receipt - interestIncome;
      const closingNis = Math.max(0, currentNis - principal);

      scheduleRows.push({
        id: ulid(),
        subleaseId: subleaseData.id,
        year,
        month,
        openingNis: currentNis,
        interestIncome,
        receipt,
        closingNis,
        leaseIncome: null,
        notes: null,
        createdAt: new Date(),
      });

      currentNis = closingNis;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return scheduleRows;
  }

  /**
   * Build operating sublease schedule (straight-line income)
   */
  private async buildOperatingSchedule(
    subleaseData: any,
    cashflows: any[]
  ): Promise<any[]> {
    const scheduleRows: any[] = [];
    const startDate = new Date(subleaseData.startOn);
    const endDate = new Date(subleaseData.endOn);

    // Calculate total lease income
    const totalReceipts = cashflows.reduce(
      (sum, cf) => sum + Number(cf.amount),
      0
    );
    const totalMonths = this.getTotalMonths(startDate, endDate);
    const monthlyLeaseIncome = totalReceipts / totalMonths;

    let currentDate = new Date(startDate);

    // Generate monthly schedule
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Find cashflow for this month
      const monthlyCashflow = cashflows.find(cf => {
        const cfDate = new Date(cf.dueOn);
        return cfDate.getFullYear() === year && cfDate.getMonth() + 1 === month;
      });

      const receipt = monthlyCashflow ? Number(monthlyCashflow.amount) : 0;

      scheduleRows.push({
        id: ulid(),
        subleaseId: subleaseData.id,
        year,
        month,
        openingNis: null,
        interestIncome: null,
        receipt,
        closingNis: null,
        leaseIncome: monthlyLeaseIncome,
        notes: null,
        createdAt: new Date(),
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return scheduleRows;
  }

  /**
   * Get total months between two dates
   */
  private getTotalMonths(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Get months from start date
   */
  private getMonthsFromStart(startDate: Date, targetDate: Date): number {
    return this.getTotalMonths(startDate, targetDate);
  }
}
