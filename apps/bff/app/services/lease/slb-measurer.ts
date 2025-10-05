import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    slbTxn,
    slbAllocation,
    slbMeasure,
    lease,
    leaseCashflow,
    leaseOpening
} from "@aibos/db-adapter/schema";
import type {
    SlbMeasureReqType,
    SlbMeasureResponseType
} from "@aibos/contracts";

export class SlbMeasurer {
    constructor(private dbInstance = db) { }

    /**
     * Measure SLB transaction and calculate allocations
     */
    async measureSlbTransaction(
        companyId: string,
        userId: string,
        data: SlbMeasureReqType
    ): Promise<SlbMeasureResponseType> {
        // Get SLB transaction details
        const slbRecord = await this.dbInstance
            .select()
            .from(slbTxn)
            .where(and(
                eq(slbTxn.id, data.slbId),
                eq(slbTxn.companyId, companyId)
            ))
            .limit(1);

        if (slbRecord.length === 0) {
            throw new Error("SLB transaction not found");
        }

        const slbData = slbRecord[0]!;

        if (!slbData.controlTransferred) {
            throw new Error("Cannot measure SLB transaction - control not transferred");
        }

        // Calculate proportions and allocations
        const measurement = await this.calculateSlbAllocation(slbData);

        // Clear existing allocation
        await this.dbInstance
            .delete(slbAllocation)
            .where(eq(slbAllocation.slbId, data.slbId));

        // Create new allocation
        await this.dbInstance
            .insert(slbAllocation)
            .values({
                id: ulid(),
                slbId: data.slbId,
                proportionTransferred: String(measurement.proportionTransferred),
                gainRecognized: String(measurement.gainRecognized),
                gainDeferred: String(measurement.gainDeferred),
                rouRetained: String(measurement.rouRetained),
                notes: measurement.notes,
                createdBy: userId
            });

        // Update SLB status
        await this.dbInstance
            .update(slbTxn)
            .set({
                status: 'MEASURED',
                updatedBy: userId,
                updatedAt: new Date()
            })
            .where(eq(slbTxn.id, data.slbId));

        return {
            slbId: data.slbId,
            proportionTransferred: measurement.proportionTransferred,
            gainRecognized: measurement.gainRecognized,
            gainDeferred: measurement.gainDeferred,
            rouRetained: measurement.rouRetained,
            leasebackLiability: measurement.leasebackLiability,
            status: 'MEASURED',
            measurement
        };
    }

    /**
     * Calculate SLB allocation based on MFRS 16 requirements
     */
    private async calculateSlbAllocation(slbData: any): Promise<{
        proportionTransferred: number;
        gainRecognized: number;
        gainDeferred: number;
        rouRetained: number;
        leasebackLiability: number;
        notes: any;
    }> {
        const salePrice = Number(slbData.salePrice);
        const fmv = Number(slbData.fmv);
        const carryingAmount = await this.getAssetCarryingAmount(slbData);

        // Calculate total gain
        const totalGain = salePrice - carryingAmount;

        // Calculate proportion transferred
        // This is based on the fair value of rights transferred vs total fair value
        const proportionTransferred = await this.calculateProportionTransferred(slbData);

        // Calculate ROU retained (based on leaseback terms)
        const rouRetained = await this.calculateRouRetained(slbData);

        // Calculate leaseback liability (present value of leaseback payments)
        const leasebackLiability = await this.calculateLeasebackLiability(slbData);

        // Allocate gains
        const gainRecognized = totalGain * proportionTransferred;
        const gainDeferred = totalGain - gainRecognized;

        // Adjust for fair value differences
        const fairValueAdjustment = salePrice - fmv;
        const adjustedGainRecognized = gainRecognized + (fairValueAdjustment * proportionTransferred);
        const adjustedGainDeferred = gainDeferred + (fairValueAdjustment * (1 - proportionTransferred));

        return {
            proportionTransferred,
            gainRecognized: Math.max(0, adjustedGainRecognized),
            gainDeferred: Math.max(0, adjustedGainDeferred),
            rouRetained,
            leasebackLiability,
            notes: {
                totalGain,
                carryingAmount,
                fairValueAdjustment,
                originalGainRecognized: gainRecognized,
                originalGainDeferred: gainDeferred,
                calculationMethod: 'MFRS_16_PROPORTIONATE'
            }
        };
    }

    /**
     * Calculate proportion of rights transferred
     */
    private async calculateProportionTransferred(slbData: any): Promise<number> {
        if (!slbData.leasebackId) {
            // No leaseback - 100% transferred
            return 1.0;
        }

        // Get leaseback lease details
        const leasebackLease = await this.dbInstance
            .select()
            .from(lease)
            .where(eq(lease.id, slbData.leasebackId))
            .limit(1);

        if (leasebackLease.length === 0) {
            throw new Error("Leaseback lease not found");
        }

        const leaseback = leasebackLease[0]!;

        // Calculate proportion based on leaseback terms vs total asset value
        // This is a simplified calculation - in practice, this would involve
        // detailed analysis of the leaseback terms and market conditions

        const leasebackTermMonths = this.getTotalMonths(
            new Date(leaseback.commenceOn),
            new Date(leaseback.endOn)
        );

        // Assume 20-year economic life for most assets
        const economicLifeMonths = 20 * 12;
        const timeProportion = Math.min(leasebackTermMonths / economicLifeMonths, 1.0);

        // Adjust for leaseback payment terms
        const leasebackPayments = await this.getLeasebackPayments(slbData.leasebackId);
        const totalLeasebackPayments = leasebackPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const paymentProportion = Math.min(totalLeasebackPayments / Number(slbData.fmv), 1.0);

        // Weighted average of time and payment proportions
        const proportionTransferred = Math.max(0, Math.min(1, (timeProportion * 0.6 + paymentProportion * 0.4)));

        return proportionTransferred;
    }

    /**
     * Calculate ROU asset retained
     */
    private async calculateRouRetained(slbData: any): Promise<number> {
        if (!slbData.leasebackId) {
            return 0;
        }

        // Get leaseback opening measures
        const opening = await this.dbInstance
            .select()
            .from(leaseOpening)
            .where(eq(leaseOpening.leaseId, slbData.leasebackId))
            .limit(1);

        if (opening.length === 0) {
            throw new Error("Leaseback opening measures not found");
        }

        const openingRecord = opening[0]!;
        const totalRou = Number(openingRecord.initialRou);

        // ROU retained is the portion not transferred
        const proportionTransferred = await this.calculateProportionTransferred(slbData);
        const rouRetained = totalRou * (1 - proportionTransferred);

        return rouRetained;
    }

    /**
     * Calculate leaseback liability
     */
    private async calculateLeasebackLiability(slbData: any): Promise<number> {
        if (!slbData.leasebackId) {
            return 0;
        }

        // Get leaseback opening measures
        const opening = await this.dbInstance
            .select()
            .from(leaseOpening)
            .where(eq(leaseOpening.leaseId, slbData.leasebackId))
            .limit(1);

        if (opening.length === 0) {
            throw new Error("Leaseback opening measures not found");
        }

        const openingRecord = opening[0]!;
        return Number(openingRecord.initialLiability);
    }

    /**
     * Get asset carrying amount
     */
    private async getAssetCarryingAmount(slbData: any): Promise<number> {
        // In a real implementation, this would query the fixed asset ledger
        // For now, we'll use a simplified calculation based on FMV and age
        const fmv = Number(slbData.fmv);

        // Assume 50% depreciation for demonstration
        // In practice, this would be calculated from actual asset records
        return fmv * 0.5;
    }

    /**
     * Get leaseback payments
     */
    private async getLeasebackPayments(leasebackId: string): Promise<any[]> {
        return await this.dbInstance
            .select()
            .from(leaseCashflow)
            .where(eq(leaseCashflow.leaseId, leasebackId))
            .orderBy(asc(leaseCashflow.dueOn));
    }

    /**
     * Get total months between two dates
     */
    private getTotalMonths(startDate: Date, endDate: Date): number {
        const yearDiff = endDate.getFullYear() - startDate.getFullYear();
        const monthDiff = endDate.getMonth() - startDate.getMonth();
        return yearDiff * 12 + monthDiff;
    }
}
