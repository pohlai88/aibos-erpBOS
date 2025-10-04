import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    lease,
    leaseCashflow,
    leaseOpening,
    leaseSchedule,
    leaseEvent,
    leasePostLock,
    leaseDisclosure,
    leaseAttachment,
    leaseComponent,
    leaseComponentSched,
    leaseImpairLine,
    leaseImpairTest,
    leaseImpairPost
} from "@aibos/db-adapter/schema";
import type {
    LeaseEventUpsertType,
    LeaseDisclosureReqType,
    LeaseDisclosureResponseType,
    LeaseEvidenceReqType,
    LeaseDisclosureSnapshotReqType,
    LeaseDisclosureSnapshotResponseType
} from "@aibos/contracts";

export class LeaseRemeasureService {
    constructor(private dbInstance = db) { }

    /**
     * Record lease remeasurement or modification
     */
    async recordEvent(
        companyId: string,
        userId: string,
        data: LeaseEventUpsertType
    ): Promise<string> {
        // Find lease
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.leaseCode, data.lease_code)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        const leaseRecord = leaseData[0]!;

        // Insert event
        const eventId = ulid();
        await this.dbInstance.insert(leaseEvent).values({
            id: eventId,
            leaseId: leaseRecord.id,
            kind: data.kind,
            effectiveOn: data.effective_on,
            indexRate: data.index_rate?.toString(),
            deltaTerm: data.delta_term,
            deltaPay: data.delta_pay?.toString(),
            scopeChangePct: data.scope_change_pct?.toString(),
            terminationFlag: data.termination_flag,
            notes: data.notes,
            createdAt: new Date(),
            createdBy: userId
        });

        // If termination, update lease status
        if (data.termination_flag) {
            await this.dbInstance
                .update(lease)
                .set({
                    status: 'TERMINATED',
                    updatedAt: new Date(),
                    updatedBy: userId
                })
                .where(eq(lease.id, leaseRecord.id));
        }

        return eventId;
    }

    /**
     * Process CPI indexation changes
     */
    async processIndexation(
        companyId: string,
        userId: string,
        leaseCode: string,
        newIndexRate: number,
        effectiveDate: string
    ): Promise<string> {
        // Find lease
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.leaseCode, leaseCode)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        const leaseRecord = leaseData[0]!;

        // Get remaining cashflows from effective date
        const remainingCashflows = await this.dbInstance
            .select()
            .from(leaseCashflow)
            .where(and(
                eq(leaseCashflow.leaseId, leaseRecord.id),
                gte(leaseCashflow.dueOn, effectiveDate)
            ))
            .orderBy(asc(leaseCashflow.dueOn));

        if (remainingCashflows.length === 0) {
            throw new Error("No remaining cashflows found");
        }

        // Calculate new present value with updated index rate
        const oldDiscountRate = Number(leaseRecord.discountRate);
        const newDiscountRate = oldDiscountRate * newIndexRate;
        const monthlyRate = newDiscountRate / 12;

        let newPresentValue = 0;
        const effectiveDateObj = new Date(effectiveDate);

        for (const cf of remainingCashflows) {
            const cfDate = new Date(cf.dueOn);
            const monthsFromEffective = (cfDate.getFullYear() - effectiveDateObj.getFullYear()) * 12 +
                (cfDate.getMonth() - effectiveDateObj.getMonth());

            const amount = Number(cf.amount);
            const presentValue = amount / Math.pow(1 + monthlyRate, monthsFromEffective);
            newPresentValue += presentValue;
        }

        // Get current liability at effective date
        const currentSchedule = await this.dbInstance
            .select()
            .from(leaseSchedule)
            .where(and(
                eq(leaseSchedule.leaseId, leaseRecord.id),
                eq(leaseSchedule.year, effectiveDateObj.getFullYear()),
                eq(leaseSchedule.month, effectiveDateObj.getMonth() + 1)
            ))
            .limit(1);

        if (currentSchedule.length === 0) {
            throw new Error("Current schedule not found for effective date");
        }

        const currentLiability = Number(currentSchedule[0]!.openLiab);
        const deltaLiability = newPresentValue - currentLiability;

        // Get opening measures
        const openingData = await this.dbInstance
            .select()
            .from(leaseOpening)
            .where(eq(leaseOpening.leaseId, leaseRecord.id))
            .limit(1);

        if (openingData.length === 0) {
            throw new Error("Opening measures not found");
        }

        const opening = openingData[0]!;
        const currentRou = Number(opening.initialRou);

        // Calculate ROU adjustment (proportional to liability change)
        const rouAdjustment = (deltaLiability / currentLiability) * currentRou;
        const newRou = currentRou + rouAdjustment;

        // Record the remeasurement event
        const eventId = ulid();
        await this.dbInstance.insert(leaseEvent).values({
            id: eventId,
            leaseId: leaseRecord.id,
            kind: 'INDEX',
            effectiveOn: effectiveDate,
            indexRate: newIndexRate.toString(),
            deltaTerm: null,
            deltaPay: deltaLiability.toString(),
            scopeChangePct: null,
            terminationFlag: false,
            notes: `CPI indexation: ${newIndexRate} (${(newIndexRate * 100 - 100).toFixed(2)}% change)`,
            createdAt: new Date(),
            createdBy: userId
        });

        // Update opening measures
        await this.dbInstance
            .update(leaseOpening)
            .set({
                initialRou: newRou.toString(),
                computedAt: new Date(),
                computedBy: userId
            })
            .where(eq(leaseOpening.id, opening.id));

        // Rebuild schedule from effective date
        await this.rebuildScheduleFromDate(leaseRecord.id, effectiveDateObj, newDiscountRate);

        return eventId;
    }

    /**
     * Process lease modifications
     */
    async processModification(
        companyId: string,
        userId: string,
        leaseCode: string,
        deltaTerm: number | undefined,
        deltaPay: number | undefined,
        scopeChangePct: number | undefined,
        effectiveDate: string,
        notes?: string
    ): Promise<string> {
        return await this.recordEvent(companyId, userId, {
            lease_code: leaseCode,
            kind: 'SCOPE',
            effective_on: effectiveDate,
            delta_term: deltaTerm,
            delta_pay: deltaPay,
            scope_change_pct: scopeChangePct,
            termination_flag: false,
            notes
        });
    }

    /**
     * Process early termination
     */
    async processTermination(
        companyId: string,
        userId: string,
        leaseCode: string,
        effectiveDate: string,
        notes?: string
    ): Promise<string> {
        return await this.recordEvent(companyId, userId, {
            lease_code: leaseCode,
            kind: 'TERMINATION',
            effective_on: effectiveDate,
            termination_flag: true,
            notes
        });
    }

    /**
     * Get lease events for a lease
     */
    async getLeaseEvents(
        companyId: string,
        leaseCode: string
    ): Promise<any[]> {
        return await this.dbInstance
            .select({
                id: leaseEvent.id,
                kind: leaseEvent.kind,
                effective_on: leaseEvent.effectiveOn,
                index_rate: leaseEvent.indexRate,
                delta_term: leaseEvent.deltaTerm,
                delta_pay: leaseEvent.deltaPay,
                scope_change_pct: leaseEvent.scopeChangePct,
                termination_flag: leaseEvent.terminationFlag,
                notes: leaseEvent.notes,
                created_at: leaseEvent.createdAt,
                created_by: leaseEvent.createdBy
            })
            .from(leaseEvent)
            .innerJoin(lease, eq(leaseEvent.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.leaseCode, leaseCode)
            ))
            .orderBy(desc(leaseEvent.effectiveOn));
    }

    /**
     * Rebuild schedule from a specific date with new discount rate
     */
    private async rebuildScheduleFromDate(
        leaseId: string,
        effectiveDate: Date,
        newDiscountRate: number
    ): Promise<void> {
        // Delete existing schedule from effective date onwards
        await this.dbInstance
            .delete(leaseSchedule)
            .where(and(
                eq(leaseSchedule.leaseId, leaseId),
                sql`(year > ${effectiveDate.getFullYear()} OR (year = ${effectiveDate.getFullYear()} AND month >= ${effectiveDate.getMonth() + 1}))`
            ));

        // Get lease data
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(eq(lease.id, leaseId))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        const leaseRecord = leaseData[0]!;

        // Get opening measures
        const openingData = await this.dbInstance
            .select()
            .from(leaseOpening)
            .where(eq(leaseOpening.leaseId, leaseId))
            .limit(1);

        if (openingData.length === 0) {
            throw new Error("Opening measures not found");
        }

        const opening = openingData[0]!;

        // Get remaining cashflows
        const cashflows = await this.dbInstance
            .select()
            .from(leaseCashflow)
            .where(and(
                eq(leaseCashflow.leaseId, leaseId),
                gte(leaseCashflow.dueOn, effectiveDate.toISOString().split('T')[0]!)
            ))
            .orderBy(asc(leaseCashflow.dueOn));

        // Calculate new schedule
        const monthlyRate = newDiscountRate / 12;
        const endDate = new Date(leaseRecord.endOn);
        const totalMonths = this.getTotalMonths(effectiveDate, endDate);
        const monthlyAmortization = Number(opening.initialRou) / totalMonths;

        let currentLiability = Number(opening.initialLiability);
        let currentRou = Number(opening.initialRou);

        // Generate monthly schedule from effective date
        for (let month = 0; month < totalMonths; month++) {
            const scheduleDate = new Date(effectiveDate);
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

            // Insert schedule row
            await this.dbInstance.insert(leaseSchedule).values({
                id: ulid(),
                leaseId,
                year,
                month: monthNum,
                openLiab: currentLiability.toString(),
                interest: interest.toString(),
                payment: payment.toString(),
                fxReval: "0", // Would be calculated from FX rates
                closeLiab: newLiability.toString(),
                rouAmort: rouAmortization.toString(),
                rouCarry: newRou.toString(),
                notes: null,
                createdAt: new Date()
            });

            currentLiability = newLiability;
            currentRou = newRou;
        }
    }

    /**
     * Calculate total months between two dates
     */
    private getTotalMonths(start: Date, end: Date): number {
        return (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) + 1;
    }

    /**
     * Find payment amount for a specific month
     */
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
}

export class LeaseDisclosureService {
    constructor(private dbInstance = db) { }

    /**
     * Generate period disclosures for MFRS 16 compliance
     */
    async generateDisclosures(
        companyId: string,
        data: LeaseDisclosureReqType
    ): Promise<LeaseDisclosureResponseType> {
        // Get all active leases for the period
        const leases = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.status, 'ACTIVE')
            ));

        // Calculate maturity analysis
        const maturityAnalysis = await this.calculateMaturityAnalysis(leases, data.year, data.month);

        // Calculate rollforward
        const rollforward = await this.calculateRollforward(companyId, data.year, data.month);

        // Calculate weighted average discount rate
        const wadr = await this.calculateWADR(leases);

        // Calculate expenses
        const expenses = await this.calculateExpenses(companyId, data.year, data.month);

        // Calculate total cash outflow
        const totalCashOutflow = await this.calculateTotalCashOutflow(companyId, data.year, data.month);

        return {
            maturity_analysis: maturityAnalysis,
            rollforward,
            wadr,
            expenses,
            total_cash_outflow: totalCashOutflow
        };
    }

    private async calculateMaturityAnalysis(leases: any[], year: number, month: number): Promise<any> {
        const maturityBands = {
            within_1_year: 0,
            between_1_2_years: 0,
            between_2_3_years: 0,
            between_3_5_years: 0,
            beyond_5_years: 0,
            total_undiscounted: 0
        };

        const currentDate = new Date(year, month - 1, 1);

        for (const leaseRecord of leases) {
            // Get cashflows for this lease
            const cashflows = await this.dbInstance
                .select()
                .from(leaseCashflow)
                .where(eq(leaseCashflow.leaseId, leaseRecord.id));

            for (const cf of cashflows) {
                const cfDate = new Date(cf.dueOn);
                const monthsToPayment = (cfDate.getFullYear() - currentDate.getFullYear()) * 12 +
                    (cfDate.getMonth() - currentDate.getMonth());

                const amount = Number(cf.amount);
                maturityBands.total_undiscounted += amount;

                // Categorize by maturity band
                if (monthsToPayment <= 12) {
                    maturityBands.within_1_year += amount;
                } else if (monthsToPayment <= 24) {
                    maturityBands.between_1_2_years += amount;
                } else if (monthsToPayment <= 36) {
                    maturityBands.between_2_3_years += amount;
                } else if (monthsToPayment <= 60) {
                    maturityBands.between_3_5_years += amount;
                } else {
                    maturityBands.beyond_5_years += amount;
                }
            }
        }

        return maturityBands;
    }

    private async calculateRollforward(companyId: string, year: number, month: number): Promise<any> {
        // Get opening liability from previous month
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const openingSchedules = await this.dbInstance
            .select({
                close_liab: leaseSchedule.closeLiab
            })
            .from(leaseSchedule)
            .innerJoin(lease, eq(leaseSchedule.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(leaseSchedule.year, prevYear),
                eq(leaseSchedule.month, prevMonth),
                eq(lease.status, 'ACTIVE')
            ));

        const openingLiability = openingSchedules.reduce((sum, s) => sum + Number(s.close_liab), 0);

        // Get current month data
        const currentSchedules = await this.dbInstance
            .select({
                interest: leaseSchedule.interest,
                payment: leaseSchedule.payment,
                fx_reval: leaseSchedule.fxReval,
                close_liab: leaseSchedule.closeLiab
            })
            .from(leaseSchedule)
            .innerJoin(lease, eq(leaseSchedule.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(leaseSchedule.year, year),
                eq(leaseSchedule.month, month),
                eq(lease.status, 'ACTIVE')
            ));

        const interestExpense = currentSchedules.reduce((sum, s) => sum + Number(s.interest), 0);
        const payments = currentSchedules.reduce((sum, s) => sum + Number(s.payment), 0);
        const fxRevaluations = currentSchedules.reduce((sum, s) => sum + Number(s.fx_reval), 0);
        const closingLiability = currentSchedules.reduce((sum, s) => sum + Number(s.close_liab), 0);

        // Get remeasurements from events
        const remeasurementEvents = await this.dbInstance
            .select({
                delta_pay: leaseEvent.deltaPay
            })
            .from(leaseEvent)
            .innerJoin(lease, eq(leaseEvent.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(leaseEvent.kind, 'INDEX'),
                gte(leaseEvent.effectiveOn, `${year}-${month.toString().padStart(2, '0')}-01`),
                lte(leaseEvent.effectiveOn, `${year}-${month.toString().padStart(2, '0')}-31`)
            ));

        const remeasurements = remeasurementEvents.reduce((sum, e) => sum + Number(e.delta_pay || 0), 0);

        return {
            opening_liability: openingLiability,
            interest_expense: interestExpense,
            payments: payments,
            remeasurements: remeasurements,
            fx_revaluations: fxRevaluations,
            closing_liability: closingLiability
        };
    }

    private async calculateWADR(leases: any[]): Promise<number> {
        if (leases.length === 0) return 0;

        let totalWeightedRate = 0;
        let totalWeight = 0;

        for (const leaseRecord of leases) {
            // Get opening liability as weight
            const openingData = await this.dbInstance
                .select()
                .from(leaseOpening)
                .where(eq(leaseOpening.leaseId, leaseRecord.id))
                .limit(1);

            if (openingData.length > 0) {
                const rate = Number(leaseRecord.discountRate);
                const weight = Number(openingData[0]!.initialLiability);
                totalWeightedRate += rate * weight;
                totalWeight += weight;
            }
        }

        return totalWeight > 0 ? totalWeightedRate / totalWeight : 0;
    }

    private async calculateExpenses(companyId: string, year: number, month: number): Promise<any> {
        // Get short-term exempt leases
        const shortTermLeases = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.shortTermExempt, true),
                eq(lease.status, 'ACTIVE')
            ));

        let shortTermExpense = 0;
        for (const leaseRecord of shortTermLeases) {
            const cashflows = await this.dbInstance
                .select()
                .from(leaseCashflow)
                .where(and(
                    eq(leaseCashflow.leaseId, leaseRecord.id),
                    gte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-01`),
                    lte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-31`)
                ));

            shortTermExpense += cashflows.reduce((sum, cf) => sum + Number(cf.amount), 0);
        }

        // Get low-value exempt leases
        const lowValueLeases = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.lowValueExempt, true),
                eq(lease.status, 'ACTIVE')
            ));

        let lowValueExpense = 0;
        for (const leaseRecord of lowValueLeases) {
            const cashflows = await this.dbInstance
                .select()
                .from(leaseCashflow)
                .where(and(
                    eq(leaseCashflow.leaseId, leaseRecord.id),
                    gte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-01`),
                    lte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-31`)
                ));

            lowValueExpense += cashflows.reduce((sum, cf) => sum + Number(cf.amount), 0);
        }

        // Get variable lease payments
        const variableCashflows = await this.dbInstance
            .select({
                amount: leaseCashflow.amount
            })
            .from(leaseCashflow)
            .innerJoin(lease, eq(leaseCashflow.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(leaseCashflow.variableFlag, true),
                gte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-01`),
                lte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-31`)
            ));

        const variableExpense = variableCashflows.reduce((sum, cf) => sum + Number(cf.amount), 0);

        return {
            short_term: shortTermExpense,
            low_value: lowValueExpense,
            variable: variableExpense
        };
    }

    private async calculateTotalCashOutflow(companyId: string, year: number, month: number): Promise<number> {
        // Get all cashflows for the period
        const cashflows = await this.dbInstance
            .select({
                amount: leaseCashflow.amount
            })
            .from(leaseCashflow)
            .innerJoin(lease, eq(leaseCashflow.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.status, 'ACTIVE'),
                gte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-01`),
                lte(leaseCashflow.dueOn, `${year}-${month.toString().padStart(2, '0')}-31`)
            ));

        return cashflows.reduce((sum, cf) => sum + Number(cf.amount), 0);
    }

    /**
     * Store disclosures in database
     */
    async storeDisclosures(
        companyId: string,
        year: number,
        month: number,
        disclosures: LeaseDisclosureResponseType
    ): Promise<string> {
        const disclosureId = ulid();

        await this.dbInstance.insert(leaseDisclosure).values({
            id: disclosureId,
            companyId,
            year,
            month,
            maturityJsonb: JSON.stringify(disclosures.maturity_analysis),
            rollforwardJsonb: JSON.stringify(disclosures.rollforward),
            wadr: disclosures.wadr.toString(),
            shortTermExpense: disclosures.expenses.short_term.toString(),
            lowValueExpense: disclosures.expenses.low_value.toString(),
            variableExpense: disclosures.expenses.variable.toString(),
            totalCashOutflow: disclosures.total_cash_outflow.toString(),
            createdAt: new Date()
        });

        return disclosureId;
    }

    /**
     * Enhanced disclosure snapshot with M28.1 features
     */
    async generateDisclosureSnapshot(
        companyId: string,
        data: LeaseDisclosureSnapshotReqType
    ): Promise<LeaseDisclosureSnapshotResponseType> {
        const snapshotId = ulid();
        const period = `${data.year}-${data.month.toString().padStart(2, '0')}`;

        // Get all active leases for the period
        const leases = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.status, 'ACTIVE')
            ));

        let maturityAnalysis = null;
        let rollforward = null;
        let wadr = 0;
        let expenses = null;
        let totalCashOutflow = 0;

        // Calculate maturity analysis if requested
        if (data.include_maturity) {
            maturityAnalysis = await this.calculateMaturityAnalysis(leases, data.year, data.month);
        }

        // Calculate rollforward if requested
        if (data.include_rollforward) {
            rollforward = await this.calculateRollforward(companyId, data.year, data.month);
        }

        // Calculate weighted average discount rate if requested
        if (data.include_wadr) {
            wadr = await this.calculateWADR(leases);
        }

        // Calculate expenses
        expenses = await this.calculateExpenses(companyId, data.year, data.month);

        // Calculate total cash outflow
        totalCashOutflow = await this.calculateTotalCashOutflow(companyId, data.year, data.month);

        // Store snapshot in database
        await this.storeDisclosures(
            companyId,
            data.year,
            data.month,
            {
                maturity_analysis: maturityAnalysis || {
                    within_1_year: 0,
                    between_1_2_years: 0,
                    between_2_3_years: 0,
                    between_3_5_years: 0,
                    beyond_5_years: 0,
                    total_undiscounted: 0
                },
                rollforward: rollforward || {
                    opening_liability: 0,
                    interest_expense: 0,
                    payments: 0,
                    remeasurements: 0,
                    fx_revaluations: 0,
                    closing_liability: 0
                },
                wadr,
                expenses: expenses || {
                    short_term: 0,
                    low_value: 0,
                    variable: 0
                },
                total_cash_outflow: totalCashOutflow
            }
        );

        return {
            snapshot_id: snapshotId,
            period,
            maturity_analysis: maturityAnalysis || {
                within_1_year: 0,
                between_1_2_years: 0,
                between_2_3_years: 0,
                between_3_5_years: 0,
                beyond_5_years: 0,
                total_undiscounted: 0
            },
            rollforward: rollforward || {
                opening_liability: 0,
                interest_expense: 0,
                payments: 0,
                remeasurements: 0,
                fx_revaluations: 0,
                closing_liability: 0
            },
            wadr,
            expenses: expenses || {
                short_term: 0,
                low_value: 0,
                variable: 0
            },
            total_cash_outflow: totalCashOutflow,
            generated_at: new Date().toISOString()
        };
    }
}

export class LeaseEvidenceService {
    constructor(private dbInstance = db) { }

    /**
     * Link evidence to lease (M26.4 integration)
     */
    async linkEvidence(
        companyId: string,
        userId: string,
        data: LeaseEvidenceReqType
    ): Promise<string> {
        // Find lease
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.leaseCode, data.lease_code)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        const leaseRecord = leaseData[0]!;

        // Insert attachment
        const attachmentId = ulid();
        await this.dbInstance.insert(leaseAttachment).values({
            id: attachmentId,
            leaseId: leaseRecord.id,
            evidenceId: data.evidence_id,
            attachmentType: data.attachment_type,
            description: data.description,
            uploadedBy: userId,
            uploadedAt: new Date()
        });

        return attachmentId;
    }

    /**
     * Get evidence attachments for a lease
     */
    async getLeaseEvidence(
        companyId: string,
        leaseCode: string
    ): Promise<any[]> {
        return await this.dbInstance
            .select({
                id: leaseAttachment.id,
                evidence_id: leaseAttachment.evidenceId,
                attachment_type: leaseAttachment.attachmentType,
                description: leaseAttachment.description,
                uploaded_by: leaseAttachment.uploadedBy,
                uploaded_at: leaseAttachment.uploadedAt
            })
            .from(leaseAttachment)
            .innerJoin(lease, eq(leaseAttachment.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(lease.leaseCode, leaseCode)
            ))
            .orderBy(desc(leaseAttachment.uploadedAt));
    }

    /**
     * M28.3: Get component disclosures for a period
     */
    async getComponentDisclosures(
        companyId: string,
        year: number,
        month: number
    ): Promise<any> {
        // Get component carrying amounts by class
        const componentCarryingAmounts = await this.dbInstance
            .select({
                class: leaseComponent.class,
                carrying_amount: leaseComponentSched.closeCarry
            })
            .from(leaseComponent)
            .innerJoin(leaseComponentSched, eq(leaseComponent.id, leaseComponentSched.leaseComponentId))
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseComponentSched.year, year),
                eq(leaseComponentSched.month, month),
                eq(leaseComponent.status, 'ACTIVE')
            ));

        // Aggregate by class
        const carryingByClass = {
            Land: 0,
            Building: 0,
            'Fit-out': 0,
            'IT/Equipment': 0,
            Vehicles: 0,
            Others: 0
        };

        for (const comp of componentCarryingAmounts) {
            const amount = Number(comp.carrying_amount);
            if (comp.class in carryingByClass) {
                carryingByClass[comp.class as keyof typeof carryingByClass] += amount;
            }
        }

        // Get component amortization by class
        const componentAmortization = await this.dbInstance
            .select({
                class: leaseComponent.class,
                amortization: leaseComponentSched.rouAmort
            })
            .from(leaseComponent)
            .innerJoin(leaseComponentSched, eq(leaseComponent.id, leaseComponentSched.leaseComponentId))
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseComponentSched.year, year),
                eq(leaseComponentSched.month, month),
                eq(leaseComponent.status, 'ACTIVE')
            ));

        const amortByClass = {
            Land: 0,
            Building: 0,
            'Fit-out': 0,
            'IT/Equipment': 0,
            Vehicles: 0,
            Others: 0
        };

        for (const comp of componentAmortization) {
            const amount = Number(comp.amortization);
            if (comp.class in amortByClass) {
                amortByClass[comp.class as keyof typeof amortByClass] += amount;
            }
        }

        // Get restoration provisions movement
        const restorationMovement = await this.calculateRestorationProvisionsMovement(
            companyId,
            year,
            month
        );

        return {
            year,
            month,
            component_carrying_amounts: carryingByClass,
            component_amortization: amortByClass,
            restoration_provisions_movement: restorationMovement
        };
    }

    /**
     * M28.3: Get impairment disclosures for a period
     */
    async getImpairmentDisclosures(
        companyId: string,
        year: number,
        month: number
    ): Promise<any> {
        // Get impairment charges by class
        const impairmentCharges = await this.dbInstance
            .select({
                class: leaseComponent.class,
                allocated_loss: leaseImpairLine.allocatedLoss
            })
            .from(leaseImpairLine)
            .innerJoin(leaseComponent, eq(leaseImpairLine.leaseComponentId, leaseComponent.id))
            .innerJoin(leaseImpairTest, eq(leaseImpairLine.impairTestId, leaseImpairTest.id))
            .innerJoin(leaseImpairPost, eq(leaseImpairTest.id, leaseImpairPost.impairTestId))
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseImpairPost.year, year),
                eq(leaseImpairPost.month, month),
                eq(leaseImpairTest.status, 'POSTED')
            ));

        const chargesByClass = {
            Land: 0,
            Building: 0,
            'Fit-out': 0,
            'IT/Equipment': 0,
            Vehicles: 0,
            Others: 0
        };

        const chargesByCgu: Record<string, number> = {};

        for (const charge of impairmentCharges) {
            const amount = Number(charge.allocated_loss);
            if (charge.class in chargesByClass) {
                chargesByClass[charge.class as keyof typeof chargesByClass] += amount;
            }
        }

        // Get impairment reversals by class
        const impairmentReversals = await this.dbInstance
            .select({
                class: leaseComponent.class,
                allocated_reversal: leaseImpairLine.allocatedReversal
            })
            .from(leaseImpairLine)
            .innerJoin(leaseComponent, eq(leaseImpairLine.leaseComponentId, leaseComponent.id))
            .innerJoin(leaseImpairTest, eq(leaseImpairLine.impairTestId, leaseImpairTest.id))
            .innerJoin(leaseImpairPost, eq(leaseImpairTest.id, leaseImpairPost.impairTestId))
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseImpairPost.year, year),
                eq(leaseImpairPost.month, month),
                eq(leaseImpairTest.status, 'POSTED')
            ));

        const reversalsByClass = {
            Land: 0,
            Building: 0,
            'Fit-out': 0,
            'IT/Equipment': 0,
            Vehicles: 0,
            Others: 0
        };

        for (const reversal of impairmentReversals) {
            const amount = Number(reversal.allocated_reversal);
            if (reversal.class in reversalsByClass) {
                reversalsByClass[reversal.class as keyof typeof reversalsByClass] += amount;
            }
        }

        const totalCharges = Object.values(chargesByClass).reduce((sum, val) => sum + val, 0);
        const totalReversals = Object.values(reversalsByClass).reduce((sum, val) => sum + val, 0);

        return {
            year,
            month,
            impairment_charges: {
                by_class: chargesByClass,
                by_cgu: chargesByCgu,
                total: totalCharges
            },
            impairment_reversals: {
                by_class: reversalsByClass,
                by_cgu: {},
                total: totalReversals
            },
            net_impairment: totalCharges - totalReversals
        };
    }

    /**
     * Calculate restoration provisions movement
     */
    private async calculateRestorationProvisionsMovement(
        companyId: string,
        year: number,
        month: number
    ): Promise<any> {
        // This would typically query the lease_restoration_prov table
        // For now, return placeholder data
        return {
            opening: 0,
            additions: 0,
            unwind_interest: 0,
            utilizations: 0,
            remeasurements: 0,
            closing: 0
        };
    }

}
