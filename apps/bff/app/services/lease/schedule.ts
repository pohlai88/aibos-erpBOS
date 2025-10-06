import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  lease,
  leaseCashflow,
  leaseOpening,
  leaseSchedule,
  leaseEvent,
  leasePostLock,
  leaseDisclosure,
  leaseAttachment,
} from '@aibos/db-adapter/schema';
import type {
  LeaseScheduleQueryType,
  LeaseMaturityQueryType,
  LeaseMaturityResponseType,
} from '@aibos/contracts';
import { listRates } from '@/services/fx/rates';

export class LeaseScheduleService {
  constructor(private dbInstance = db) {}

  /**
   * Build full amortization schedule from commence to end
   */
  async buildSchedule(leaseId: string): Promise<void> {
    const leaseData = await this.dbInstance
      .select()
      .from(lease)
      .where(eq(lease.id, leaseId))
      .limit(1);

    if (leaseData.length === 0) {
      throw new Error('Lease not found');
    }

    const leaseRecord = leaseData[0]!;
    const openingData = await this.dbInstance
      .select()
      .from(leaseOpening)
      .where(eq(leaseOpening.leaseId, leaseId))
      .limit(1);

    if (openingData.length === 0) {
      throw new Error('Lease opening measures not found');
    }

    const opening = openingData[0]!;
    const cashflows = await this.dbInstance
      .select()
      .from(leaseCashflow)
      .where(eq(leaseCashflow.leaseId, leaseId))
      .orderBy(asc(leaseCashflow.dueOn));

    // Calculate monthly schedule
    const commenceDate = new Date(leaseRecord.commenceOn);
    const endDate = new Date(leaseRecord.endOn);
    const monthlyRate = Number(leaseRecord.discountRate) / 12;

    let currentLiability = Number(opening.initialLiability);
    let currentRou = Number(opening.initialRou);
    const totalMonths = this.getTotalMonths(commenceDate, endDate);
    const monthlyAmortization = currentRou / totalMonths;

    // Generate monthly schedule
    for (let month = 0; month < totalMonths; month++) {
      const scheduleDate = new Date(commenceDate);
      scheduleDate.setMonth(scheduleDate.getMonth() + month);

      const year = scheduleDate.getFullYear();
      const monthNum = scheduleDate.getMonth() + 1;

      // Calculate interest
      const interest = currentLiability * monthlyRate;

      // Find payment for this month
      const payment = this.findPaymentForMonth(cashflows, scheduleDate);

      // Calculate liability reduction
      const principalPayment = payment - interest;
      const newLiability = Math.max(0, currentLiability - principalPayment);

      // Calculate ROU amortization
      const rouAmortization = Math.min(monthlyAmortization, currentRou);
      const newRou = Math.max(0, currentRou - rouAmortization);

      // Calculate FX revaluation if presentation currency differs
      let fxReval = 0;
      if (
        leaseRecord.presentCcy &&
        leaseRecord.presentCcy !== leaseRecord.ccy
      ) {
        fxReval = await this.calculateFXRevaluation(
          leaseRecord.ccy,
          leaseRecord.presentCcy,
          currentLiability,
          scheduleDate
        );
      }

      // Insert schedule row
      await this.dbInstance.insert(leaseSchedule).values({
        id: ulid(),
        leaseId,
        year,
        month: monthNum,
        openLiab: currentLiability.toString(),
        interest: interest.toString(),
        payment: payment.toString(),
        fxReval: fxReval.toString(),
        closeLiab: newLiability.toString(),
        rouAmort: rouAmortization.toString(),
        rouCarry: newRou.toString(),
        notes: null,
        createdAt: new Date(),
      });

      currentLiability = newLiability;
      currentRou = newRou;
    }
  }

  private getTotalMonths(start: Date, end: Date): number {
    return (
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1
    );
  }

  private findPaymentForMonth(cashflows: any[], date: Date): number {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    for (const cf of cashflows) {
      const cfDate = new Date(cf.dueOn);
      if (cfDate >= monthStart && cfDate <= monthEnd) {
        return Number(cf.amount);
      }
    }

    return 0;
  }

  /**
   * Query lease schedule
   */
  async querySchedule(
    companyId: string,
    query: LeaseScheduleQueryType
  ): Promise<any[]> {
    let whereConditions = [eq(leaseSchedule.leaseId, lease.id)];

    if (query.lease_code) {
      whereConditions.push(eq(lease.leaseCode, query.lease_code));
    }

    if (query.year) {
      whereConditions.push(eq(leaseSchedule.year, query.year));
    }

    if (query.month) {
      whereConditions.push(eq(leaseSchedule.month, query.month));
    }

    return await this.dbInstance
      .select({
        lease_code: lease.leaseCode,
        year: leaseSchedule.year,
        month: leaseSchedule.month,
        open_liab: leaseSchedule.openLiab,
        interest: leaseSchedule.interest,
        payment: leaseSchedule.payment,
        fx_reval: leaseSchedule.fxReval,
        close_liab: leaseSchedule.closeLiab,
        rou_amort: leaseSchedule.rouAmort,
        rou_carry: leaseSchedule.rouCarry,
        notes: leaseSchedule.notes,
      })
      .from(leaseSchedule)
      .innerJoin(lease, eq(leaseSchedule.leaseId, lease.id))
      .where(and(eq(lease.companyId, companyId), ...whereConditions))
      .orderBy(asc(leaseSchedule.year), asc(leaseSchedule.month));
  }

  /**
   * Generate maturity analysis for disclosures
   */
  async generateMaturityAnalysis(
    companyId: string,
    query: LeaseMaturityQueryType
  ): Promise<LeaseMaturityResponseType> {
    // Get all active leases
    const leases = await this.dbInstance
      .select()
      .from(lease)
      .where(and(eq(lease.companyId, companyId), eq(lease.status, 'ACTIVE')));

    const maturityBands = [
      {
        band: '≤1y',
        undiscounted_amount: 0,
        discounted_amount: 0,
        lease_count: 0,
      },
      {
        band: '1-2y',
        undiscounted_amount: 0,
        discounted_amount: 0,
        lease_count: 0,
      },
      {
        band: '2-3y',
        undiscounted_amount: 0,
        discounted_amount: 0,
        lease_count: 0,
      },
      {
        band: '3-5y',
        undiscounted_amount: 0,
        discounted_amount: 0,
        lease_count: 0,
      },
      {
        band: '>5y',
        undiscounted_amount: 0,
        discounted_amount: 0,
        lease_count: 0,
      },
    ];

    let totalUndiscounted = 0;
    let totalDiscounted = 0;
    let totalLeases = leases.length;

    // Calculate maturity for each lease
    for (const leaseRecord of leases) {
      const cashflows = await this.dbInstance
        .select()
        .from(leaseCashflow)
        .where(eq(leaseCashflow.leaseId, leaseRecord.id));

      const currentDate = new Date(query.year, query.month - 1, 1);

      for (const cf of cashflows) {
        const cfDate = new Date(cf.dueOn);
        const monthsToPayment =
          (cfDate.getFullYear() - currentDate.getFullYear()) * 12 +
          (cfDate.getMonth() - currentDate.getMonth());

        const amount = Number(cf.amount);
        totalUndiscounted += amount;

        // Determine maturity band
        let bandIndex = -1;
        if (monthsToPayment <= 12) bandIndex = 0;
        else if (monthsToPayment <= 24) bandIndex = 1;
        else if (monthsToPayment <= 36) bandIndex = 2;
        else if (monthsToPayment <= 60) bandIndex = 3;
        else bandIndex = 4;

        if (bandIndex >= 0 && maturityBands[bandIndex]) {
          maturityBands[bandIndex]!.undiscounted_amount += amount;
          maturityBands[bandIndex]!.lease_count += 1;
        }
      }
    }

    return {
      maturity_bands: maturityBands,
      total_undiscounted: totalUndiscounted,
      total_discounted: totalDiscounted,
      total_leases: totalLeases,
    };
  }

  /**
   * Calculate FX revaluation for liability
   */
  private async calculateFXRevaluation(
    functionalCcy: string,
    presentationCcy: string,
    liabilityAmount: number,
    date: Date
  ): Promise<number> {
    try {
      // Get FX rates for the month
      const rates = await listRates('system', {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });

      // Find the rate for functional to presentation currency
      const rate = rates.find(
        r => r.src_ccy === functionalCcy && r.dst_ccy === presentationCcy
      );

      if (!rate) {
        console.warn(
          `FX rate not found for ${functionalCcy} to ${presentationCcy} on ${date.toISOString()}`
        );
        return 0;
      }

      // Calculate revaluation (simplified - in practice would compare with previous rate)
      // For now, return 0 as this is a placeholder for the actual FX revaluation logic
      return 0;
    } catch (error) {
      console.error('Error calculating FX revaluation:', error);
      return 0;
    }
  }

  /**
   * Get FX rate for currency conversion
   */
  async getFXRate(fromCcy: string, toCcy: string, date: Date): Promise<number> {
    try {
      const rates = await listRates('system', {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });

      const rate = rates.find(
        r => r.src_ccy === fromCcy && r.dst_ccy === toCcy
      );

      return rate ? rate.rate : 1; // Default to 1 if rate not found
    } catch (error) {
      console.error('Error getting FX rate:', error);
      return 1;
    }
  }

  /**
   * Convert amount from functional to presentation currency
   */
  async convertToPresentationCurrency(
    amount: number,
    functionalCcy: string,
    presentationCcy: string,
    date: Date
  ): Promise<number> {
    if (functionalCcy === presentationCcy) {
      return amount;
    }

    const rate = await this.getFXRate(functionalCcy, presentationCcy, date);
    return amount * rate;
  }
}
