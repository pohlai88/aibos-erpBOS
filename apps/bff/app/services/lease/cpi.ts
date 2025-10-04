import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    lease,
    leaseCpiIndex,
    leaseRemeasureArtifact,
    leaseEvent,
    leaseCashflow,
    leaseOpening,
    leaseSchedule
} from "@aibos/db-adapter/schema";
import type {
    LeaseCpiUpsertType,
    LeaseCpiQueryType,
    LeaseEventApplyReqType,
    LeaseEventApplyResponseType,
    LeaseScheduleRebuildReqType,
    LeaseScheduleRebuildResponseType
} from "@aibos/contracts";
import { createHash } from "crypto";

export class LeaseCpiService {
    constructor(private dbInstance = db) { }

    /**
     * Upsert CPI index values with lag policy
     */
    async upsertCpiIndex(
        companyId: string,
        userId: string,
        data: LeaseCpiUpsertType
    ): Promise<{ rows_inserted: number; rows_updated: number }> {
        let inserted = 0;
        let updated = 0;

        for (const row of data.rows) {
            // Check if row already exists
            const existing = await this.dbInstance
                .select()
                .from(leaseCpiIndex)
                .where(and(
                    eq(leaseCpiIndex.companyId, companyId),
                    eq(leaseCpiIndex.indexCode, data.index_code),
                    eq(leaseCpiIndex.indexDate, row.date)
                ))
                .limit(1);

            if (existing.length > 0) {
                // Update existing row
                await this.dbInstance
                    .update(leaseCpiIndex)
                    .set({
                        indexValue: row.value.toString(),
                        lagMonths: data.lag_months
                    })
                    .where(eq(leaseCpiIndex.id, existing[0]!.id));
                updated++;
            } else {
                // Insert new row
                await this.dbInstance.insert(leaseCpiIndex).values({
                    id: ulid(),
                    companyId,
                    indexCode: data.index_code,
                    indexDate: row.date,
                    indexValue: row.value.toString(),
                    lagMonths: data.lag_months,
                    createdBy: userId
                });
                inserted++;
            }
        }

        return { rows_inserted: inserted, rows_updated: updated };
    }

    /**
     * Query CPI index values
     */
    async queryCpiIndex(
        companyId: string,
        query: LeaseCpiQueryType
    ): Promise<any[]> {
        let whereConditions = [eq(leaseCpiIndex.companyId, companyId)];

        if (query.index_code) {
            whereConditions.push(eq(leaseCpiIndex.indexCode, query.index_code));
        }

        if (query.date_from) {
            whereConditions.push(gte(leaseCpiIndex.indexDate, query.date_from));
        }

        if (query.date_to) {
            whereConditions.push(lte(leaseCpiIndex.indexDate, query.date_to));
        }

        return await this.dbInstance
            .select({
                id: leaseCpiIndex.id,
                index_code: leaseCpiIndex.indexCode,
                index_date: leaseCpiIndex.indexDate,
                index_value: leaseCpiIndex.indexValue,
                lag_months: leaseCpiIndex.lagMonths,
                created_at: leaseCpiIndex.createdAt
            })
            .from(leaseCpiIndex)
            .where(and(...whereConditions))
            .orderBy(asc(leaseCpiIndex.indexCode), asc(leaseCpiIndex.indexDate));
    }

    /**
     * Get CPI index value for a specific date with lag policy
     */
    async getCpiValue(
        companyId: string,
        indexCode: string,
        effectiveDate: string,
        lagMonths: number = 0
    ): Promise<number | null> {
        // Calculate the lagged date
        const effectiveDateObj = new Date(effectiveDate);
        const laggedDate = new Date(effectiveDateObj);
        laggedDate.setMonth(laggedDate.getMonth() - lagMonths);

        // Find the most recent CPI value on or before the lagged date
        const cpiData = await this.dbInstance
            .select()
            .from(leaseCpiIndex)
            .where(and(
                eq(leaseCpiIndex.companyId, companyId),
                eq(leaseCpiIndex.indexCode, indexCode),
                lte(leaseCpiIndex.indexDate, laggedDate.toISOString().split('T')[0]!)
            ))
            .orderBy(desc(leaseCpiIndex.indexDate))
            .limit(1);

        return cpiData.length > 0 ? Number(cpiData[0]!.indexValue) : null;
    }
}

export class LeaseRemeasureService {
    constructor(private dbInstance = db) { }

    /**
     * Apply remeasurement event and create proof artifact
     */
    async applyEvent(
        companyId: string,
        userId: string,
        data: LeaseEventApplyReqType
    ): Promise<LeaseEventApplyResponseType> {
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

        // Find event
        const eventData = await this.dbInstance
            .select()
            .from(leaseEvent)
            .where(and(
                eq(leaseEvent.id, data.event_id),
                eq(leaseEvent.leaseId, leaseRecord.id)
            ))
            .limit(1);

        if (eventData.length === 0) {
            throw new Error("Event not found");
        }

        const event = eventData[0]!;

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

        // Calculate remeasurement based on event type
        const artifact = await this.calculateRemeasurement(
            leaseRecord,
            event,
            opening,
            userId
        );

        // Store proof artifact
        const artifactId = await this.storeRemeasurementArtifact(
            leaseRecord.id,
            event.id,
            event.kind,
            artifact,
            userId
        );

        // Update opening measures if needed
        if (artifact.outputs.delta_rou !== 0) {
            await this.dbInstance
                .update(leaseOpening)
                .set({
                    initialRou: (Number(opening.initialRou) + artifact.outputs.delta_rou).toString(),
                    computedAt: new Date(),
                    computedBy: userId
                })
                .where(eq(leaseOpening.id, opening.id));
        }

        // Rebuild schedule if needed
        let scheduleRebuilt = false;
        if (artifact.outputs.new_discount_rate !== Number(leaseRecord.discountRate)) {
            await this.rebuildScheduleFromDate(
                leaseRecord.id,
                new Date(event.effectiveOn),
                artifact.outputs.new_discount_rate
            );
            scheduleRebuilt = true;
        }

        return {
            event_id: event.id,
            artifact_id: artifactId,
            delta_liability: artifact.outputs.delta_liability,
            delta_rou: artifact.outputs.delta_rou,
            new_discount_rate: artifact.outputs.new_discount_rate,
            schedule_rebuilt: scheduleRebuilt,
            proof_checksum: artifact.checksum
        };
    }

    /**
     * Calculate remeasurement based on event type
     */
    private async calculateRemeasurement(
        leaseRecord: any,
        event: any,
        opening: any,
        userId: string
    ): Promise<any> {
        const inputs = {
            lease_id: leaseRecord.id,
            event_id: event.id,
            event_type: event.kind,
            effective_date: event.effectiveOn,
            current_discount_rate: Number(leaseRecord.discountRate),
            current_liability: Number(opening.initialLiability),
            current_rou: Number(opening.initialRou),
            index_rate: event.indexRate ? Number(event.indexRate) : null,
            delta_term: event.deltaTerm,
            delta_pay: event.deltaPay ? Number(event.deltaPay) : null,
            scope_change_pct: event.scopeChangePct ? Number(event.scopeChangePct) : null
        };

        const calculations: any = {};
        const outputs: any = {};

        switch (event.kind) {
            case 'INDEX':
                await this.calculateIndexRemeasurement(inputs, calculations, outputs);
                break;
            case 'RATE':
                await this.calculateRateRemeasurement(inputs, calculations, outputs);
                break;
            case 'TERM':
                await this.calculateTermRemeasurement(inputs, calculations, outputs);
                break;
            case 'SCOPE':
                await this.calculateScopeRemeasurement(inputs, calculations, outputs);
                break;
            case 'TERMINATION':
                await this.calculateTerminationRemeasurement(inputs, calculations, outputs);
                break;
            default:
                throw new Error(`Unknown event type: ${event.kind}`);
        }

        // Generate checksum for integrity
        const artifactData = { inputs, calculations, outputs };
        const checksum = createHash('sha256')
            .update(JSON.stringify(artifactData))
            .digest('hex');

        return {
            inputs,
            calculations,
            outputs,
            checksum
        };
    }

    /**
     * Calculate index-based remeasurement
     */
    private async calculateIndexRemeasurement(
        inputs: any,
        calculations: any,
        outputs: any
    ): Promise<void> {
        if (!inputs.index_rate) {
            throw new Error("Index rate is required for INDEX remeasurement");
        }

        // Calculate new discount rate
        const newDiscountRate = inputs.current_discount_rate * inputs.index_rate;
        calculations.new_discount_rate = newDiscountRate;
        calculations.index_multiplier = inputs.index_rate;

        // Get remaining cashflows
        const remainingCashflows = await this.dbInstance
            .select()
            .from(leaseCashflow)
            .where(and(
                eq(leaseCashflow.leaseId, inputs.lease_id),
                gte(leaseCashflow.dueOn, inputs.effective_date)
            ))
            .orderBy(asc(leaseCashflow.dueOn));

        // Calculate new present value
        const monthlyRate = newDiscountRate / 12;
        const effectiveDateObj = new Date(inputs.effective_date);
        let newPresentValue = 0;

        for (const cf of remainingCashflows) {
            const cfDate = new Date(cf.dueOn);
            const monthsFromEffective = (cfDate.getFullYear() - effectiveDateObj.getFullYear()) * 12 +
                (cfDate.getMonth() - effectiveDateObj.getMonth());

            const amount = Number(cf.amount);
            const presentValue = amount / Math.pow(1 + monthlyRate, monthsFromEffective);
            newPresentValue += presentValue;
        }

        calculations.new_present_value = newPresentValue;
        calculations.monthly_rate = monthlyRate;
        calculations.remaining_cashflows_count = remainingCashflows.length;

        // Calculate delta liability
        const deltaLiability = newPresentValue - inputs.current_liability;
        calculations.delta_liability = deltaLiability;

        // Calculate ROU adjustment (proportional)
        const rouAdjustment = (deltaLiability / inputs.current_liability) * inputs.current_rou;
        calculations.rou_adjustment = rouAdjustment;

        // Set outputs
        outputs.delta_liability = deltaLiability;
        outputs.delta_rou = rouAdjustment;
        outputs.new_discount_rate = newDiscountRate;
    }

    /**
     * Calculate rate-based remeasurement
     */
    private async calculateRateRemeasurement(
        inputs: any,
        calculations: any,
        outputs: any
    ): Promise<void> {
        // Similar to index but with direct rate change
        const newDiscountRate = inputs.index_rate || inputs.current_discount_rate;
        calculations.new_discount_rate = newDiscountRate;

        // Recalculate present value with new rate
        const remainingCashflows = await this.dbInstance
            .select()
            .from(leaseCashflow)
            .where(and(
                eq(leaseCashflow.leaseId, inputs.lease_id),
                gte(leaseCashflow.dueOn, inputs.effective_date)
            ))
            .orderBy(asc(leaseCashflow.dueOn));

        const monthlyRate = newDiscountRate / 12;
        const effectiveDateObj = new Date(inputs.effective_date);
        let newPresentValue = 0;

        for (const cf of remainingCashflows) {
            const cfDate = new Date(cf.dueOn);
            const monthsFromEffective = (cfDate.getFullYear() - effectiveDateObj.getFullYear()) * 12 +
                (cfDate.getMonth() - effectiveDateObj.getMonth());

            const amount = Number(cf.amount);
            const presentValue = amount / Math.pow(1 + monthlyRate, monthsFromEffective);
            newPresentValue += presentValue;
        }

        const deltaLiability = newPresentValue - inputs.current_liability;
        const rouAdjustment = (deltaLiability / inputs.current_liability) * inputs.current_rou;

        outputs.delta_liability = deltaLiability;
        outputs.delta_rou = rouAdjustment;
        outputs.new_discount_rate = newDiscountRate;
    }

    /**
     * Calculate term-based remeasurement
     */
    private async calculateTermRemeasurement(
        inputs: any,
        calculations: any,
        outputs: any
    ): Promise<void> {
        if (!inputs.delta_term) {
            throw new Error("Delta term is required for TERM remeasurement");
        }

        // For term changes, we need to adjust the remaining cashflows
        // This is a simplified calculation - in practice, you'd need to regenerate cashflows
        const deltaLiability = inputs.delta_pay || 0;
        const rouAdjustment = (deltaLiability / inputs.current_liability) * inputs.current_rou;

        outputs.delta_liability = deltaLiability;
        outputs.delta_rou = rouAdjustment;
        outputs.new_discount_rate = inputs.current_discount_rate;
    }

    /**
     * Calculate scope-based remeasurement
     */
    private async calculateScopeRemeasurement(
        inputs: any,
        calculations: any,
        outputs: any
    ): Promise<void> {
        if (!inputs.scope_change_pct) {
            throw new Error("Scope change percentage is required for SCOPE remeasurement");
        }

        const scopeChangeFactor = inputs.scope_change_pct / 100;
        const deltaLiability = inputs.current_liability * scopeChangeFactor;
        const rouAdjustment = inputs.current_rou * scopeChangeFactor;

        // For scope decreases, the adjustment goes to P&L
        if (scopeChangeFactor < 0) {
            calculations.p_and_l_impact = Math.abs(deltaLiability);
        }

        outputs.delta_liability = deltaLiability;
        outputs.delta_rou = rouAdjustment;
        outputs.new_discount_rate = inputs.current_discount_rate;
    }

    /**
     * Calculate termination remeasurement
     */
    private async calculateTerminationRemeasurement(
        inputs: any,
        calculations: any,
        outputs: any
    ): Promise<void> {
        // For termination, we derecognize the entire liability and ROU
        const deltaLiability = -inputs.current_liability;
        const rouAdjustment = -inputs.current_rou;

        calculations.termination_liability = inputs.current_liability;
        calculations.termination_rou = inputs.current_rou;

        outputs.delta_liability = deltaLiability;
        outputs.delta_rou = rouAdjustment;
        outputs.new_discount_rate = inputs.current_discount_rate;
    }

    /**
     * Store remeasurement artifact
     */
    private async storeRemeasurementArtifact(
        leaseId: string,
        eventId: string,
        artifactType: string,
        artifact: any,
        userId: string
    ): Promise<string> {
        const artifactId = ulid();

        await this.dbInstance.insert(leaseRemeasureArtifact).values({
            id: artifactId,
            leaseId,
            eventId,
            artifactType,
            inputsJsonb: JSON.stringify(artifact.inputs),
            calculationsJsonb: JSON.stringify(artifact.calculations),
            outputsJsonb: JSON.stringify(artifact.outputs),
            checksum: artifact.checksum,
            computedBy: userId
        });

        return artifactId;
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

export class LeaseScheduleService {
    constructor(private dbInstance = db) { }

    /**
     * Rebuild lease schedule from a specific date
     */
    async rebuild(
        companyId: string,
        data: LeaseScheduleRebuildReqType
    ): Promise<LeaseScheduleRebuildResponseType> {
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

        // Get remaining cashflows from rebuild date
        const rebuildDate = new Date(data.as_of);
        const remainingCashflows = await this.dbInstance
            .select()
            .from(leaseCashflow)
            .where(and(
                eq(leaseCashflow.leaseId, leaseRecord.id),
                gte(leaseCashflow.dueOn, data.as_of)
            ))
            .orderBy(asc(leaseCashflow.dueOn));

        // Calculate new present value
        const monthlyRate = Number(leaseRecord.discountRate) / 12;
        let newPresentValue = 0;

        for (const cf of remainingCashflows) {
            const cfDate = new Date(cf.dueOn);
            const monthsFromRebuild = (cfDate.getFullYear() - rebuildDate.getFullYear()) * 12 +
                (cfDate.getMonth() - rebuildDate.getMonth());

            const amount = Number(cf.amount);
            const presentValue = amount / Math.pow(1 + monthlyRate, monthsFromRebuild);
            newPresentValue += presentValue;
        }

        // Calculate total months remaining
        const endDate = new Date(leaseRecord.endOn);
        const totalMonths = this.getTotalMonths(rebuildDate, endDate);

        return {
            lease_id: leaseRecord.id,
            rebuild_date: data.as_of,
            total_months: totalMonths,
            new_present_value: newPresentValue,
            monthly_rate: monthlyRate
        };
    }

    /**
     * Calculate total months between two dates
     */
    private getTotalMonths(start: Date, end: Date): number {
        return (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) + 1;
    }
}
