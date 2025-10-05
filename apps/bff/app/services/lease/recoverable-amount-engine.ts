import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql } from "drizzle-orm";
import {
    leaseImpTest,
    leaseImpLine,
    leaseCgu,
    leaseComponent,
    leaseComponentSched
} from "@aibos/db-adapter/schema";
import type {
    ImpairmentTestUpsertType
} from "@aibos/contracts";

export class RecoverableAmountEngine {
    constructor(private dbInstance = db) { }

    /**
     * Create impairment test with VIU calculation
     */
    async createImpairmentTest(
        companyId: string,
        userId: string,
        data: ImpairmentTestUpsertType
    ): Promise<string> {
        const testId = ulid();

        // Calculate recoverable amount based on method
        let recoverableAmount = 0;
        let loss = 0;

        if (data.method === 'VIU') {
            recoverableAmount = await this.calculateValueInUse(data.cashflows, data.discount_rate);
        } else if (data.method === 'FVLCD') {
            recoverableAmount = await this.calculateFairValueLessCostsOfDisposal(data.cashflows);
        } else if (data.method === 'HIGHER') {
            const viu = await this.calculateValueInUse(data.cashflows, data.discount_rate);
            const fvlcd = await this.calculateFairValueLessCostsOfDisposal(data.cashflows);
            recoverableAmount = Math.max(viu, fvlcd);
        }

        loss = Math.max(0, data.carrying_amount - recoverableAmount);

        // Create the test
        await this.dbInstance
            .insert(leaseImpTest)
            .values({
                id: testId,
                companyId,
                cguId: data.cgu_id,
                cguCode: (data as any).cgu_code || '', // Add missing cguCode field with type assertion
                level: (data as any).level || 'CGU', // Add missing level field with type assertion
                asOfDate: data.as_of_date,
                method: data.method,
                discountRate: data.discount_rate.toString(), // Convert to string
                cashflows: data.cashflows,
                carryingAmount: data.carrying_amount.toString(), // Convert to string
                recoverableAmount: recoverableAmount.toString(), // Convert to string
                loss: loss.toString(), // Convert to string
                reversalCap: data.reversal_cap?.toString() || "0", // Convert to string
                trigger: (data as any).trigger || 'MANUAL', // Add missing trigger field with type assertion
                status: 'DRAFT',
                createdAt: new Date(),
                createdBy: userId,
                updatedAt: new Date(),
                updatedBy: userId
            });

        // Create component-level allocation lines
        await this.createImpairmentLines(testId, userId, data.carrying_amount, loss);

        return testId;
    }

    /**
     * Calculate Value in Use (VIU) using discounted cash flows
     */
    private async calculateValueInUse(
        cashflows: Record<string, any>,
        discountRate: number
    ): Promise<number> {
        // Extract cash flow projections from the cashflows object
        const projections = cashflows.projections || [];
        let viu = 0;

        for (const projection of projections) {
            const year = projection.year || 0;
            const amount = projection.amount || 0;

            // Discount to present value
            const pv = amount / Math.pow(1 + discountRate, year);
            viu += pv;
        }

        return viu;
    }

    /**
     * Calculate Fair Value Less Costs of Disposal (FVLCD)
     */
    private async calculateFairValueLessCostsOfDisposal(
        cashflows: Record<string, any>
    ): Promise<number> {
        // This would typically integrate with external appraisal systems
        // For now, use the fair value provided in cashflows
        const fairValue = cashflows.fairValue || 0;
        const costsOfDisposal = cashflows.costsOfDisposal || 0;

        return Math.max(0, fairValue - costsOfDisposal);
    }

    /**
     * Create impairment lines for component-level allocation
     */
    private async createImpairmentLines(
        testId: string,
        userId: string,
        totalCarryingAmount: number,
        totalLoss: number
    ): Promise<void> {
        // Get CGU components and their carrying amounts
        const test = await this.dbInstance
            .select({
                cguId: leaseImpTest.cguId,
                carryingAmount: leaseImpTest.carryingAmount
            })
            .from(leaseImpTest)
            .where(eq(leaseImpTest.id, testId))
            .limit(1);

        if (test.length === 0) {
            throw new Error('Impairment test not found');
        }

        const cguId = test[0]?.cguId;
        if (!cguId) {
            throw new Error('CGU ID not found in impairment test');
        }

        // Get components allocated to this CGU
        const components = await this.dbInstance
            .select({
                leaseComponentId: leaseComponent.id,
                code: leaseComponent.code,
                name: leaseComponent.name
            })
            .from(leaseComponent)
            .innerJoin(
                sql`lease_cgu_link`,
                sql`lease_cgu_link.lease_component_id = lease_component.id`
            )
            .where(sql`lease_cgu_link.cgu_id = ${cguId}`);

        for (const component of components) {
            // Get component carrying amount from latest schedule
            const latestSchedule = await this.dbInstance
                .select({
                    closingRou: leaseComponentSched.closingRou,
                    closingLiability: leaseComponentSched.closingLiability
                })
                .from(leaseComponentSched)
                .where(eq(leaseComponentSched.leaseComponentId, component.leaseComponentId))
                .orderBy(desc(leaseComponentSched.year), desc(leaseComponentSched.month))
                .limit(1);

            if (latestSchedule.length > 0) {
                const schedule = latestSchedule[0];
                if (!schedule) continue; // Skip if schedule is undefined
                const componentCarryingAmount = Number(schedule.closingRou || 0) - Number(schedule.closingLiability || 0);
                const allocationPct = componentCarryingAmount / totalCarryingAmount;
                const allocatedLoss = totalLoss * allocationPct;

                await this.dbInstance
                    .insert(leaseImpLine)
                    .values({
                        id: ulid(),
                        impairTestId: testId, // Use correct field name
                        leaseComponentId: component.leaseComponentId,
                        carryingAmount: componentCarryingAmount.toString(), // Add required field
                        allocatedLoss: allocatedLoss.toString(), // Add required field
                        allocatedReversal: "0", // Add required field
                        afterAmount: (componentCarryingAmount - allocatedLoss).toString(), // Add required field
                        carrying: componentCarryingAmount.toString(), // Convert to string
                        allocPct: allocationPct.toString(), // Convert to string
                        loss: allocatedLoss.toString(), // Convert to string
                        reversalCap: allocatedLoss.toString(), // Convert to string
                        testId: testId, // Add field
                        posted: false,
                        notes: null,
                        createdAt: new Date(),
                        createdBy: userId
                    });
            }
        }
    }

    /**
     * Get impairment test details with lines
     */
    async getImpairmentTestDetails(testId: string) {
        const test = await this.dbInstance
            .select({
                id: leaseImpTest.id,
                companyId: leaseImpTest.companyId,
                cguId: leaseImpTest.cguId,
                asOfDate: leaseImpTest.asOfDate,
                method: leaseImpTest.method,
                discountRate: leaseImpTest.discountRate,
                cashflows: leaseImpTest.cashflows,
                carryingAmount: leaseImpTest.carryingAmount,
                recoverableAmount: leaseImpTest.recoverableAmount,
                loss: leaseImpTest.loss,
                reversalCap: leaseImpTest.reversalCap,
                status: leaseImpTest.status,
                createdAt: leaseImpTest.createdAt,
                createdBy: leaseImpTest.createdBy,
                updatedAt: leaseImpTest.updatedAt,
                updatedBy: leaseImpTest.updatedBy,
                cguCode: leaseCgu.code,
                cguName: leaseCgu.name
            })
            .from(leaseImpTest)
            .innerJoin(leaseCgu, eq(leaseImpTest.cguId, leaseCgu.id))
            .where(eq(leaseImpTest.id, testId))
            .limit(1);

        if (test.length === 0) {
            throw new Error('Impairment test not found');
        }

        // Get impairment lines
        const lines = await this.dbInstance
            .select({
                id: leaseImpLine.id,
                leaseComponentId: leaseImpLine.leaseComponentId,
                carrying: leaseImpLine.carrying,
                allocPct: leaseImpLine.allocPct,
                loss: leaseImpLine.loss,
                reversalCap: leaseImpLine.reversalCap,
                posted: leaseImpLine.posted,
                notes: leaseImpLine.notes,
                componentCode: leaseComponent.code,
                componentName: leaseComponent.name
            })
            .from(leaseImpLine)
            .innerJoin(leaseComponent, eq(leaseImpLine.leaseComponentId, leaseComponent.id))
            .where(eq(leaseImpLine.testId, testId));

        return {
            ...test[0],
            lines
        };
    }

    /**
     * Update impairment test
     */
    async updateImpairmentTest(
        testId: string,
        userId: string,
        data: Partial<ImpairmentTestUpsertType>
    ): Promise<void> {
        const updateData: any = {
            updatedAt: new Date(),
            updatedBy: userId
        };

        if (data.method) updateData.method = data.method;
        if (data.discount_rate !== undefined) updateData.discountRate = data.discount_rate;
        if (data.cashflows) updateData.cashflows = data.cashflows;
        if (data.carrying_amount !== undefined) updateData.carryingAmount = data.carrying_amount;
        if (data.reversal_cap !== undefined) updateData.reversalCap = data.reversal_cap;

        // Recalculate if key fields changed
        if (data.method || data.discount_rate !== undefined || data.cashflows || data.carrying_amount !== undefined) {
            let recoverableAmount = 0;

            if (data.method === 'VIU' || updateData.method === 'VIU') {
                recoverableAmount = await this.calculateValueInUse(
                    data.cashflows || updateData.cashflows,
                    data.discount_rate !== undefined ? data.discount_rate : updateData.discountRate
                );
            } else if (data.method === 'FVLCD' || updateData.method === 'FVLCD') {
                recoverableAmount = await this.calculateFairValueLessCostsOfDisposal(
                    data.cashflows || updateData.cashflows
                );
            } else if (data.method === 'HIGHER' || updateData.method === 'HIGHER') {
                const viu = await this.calculateValueInUse(
                    data.cashflows || updateData.cashflows,
                    data.discount_rate !== undefined ? data.discount_rate : updateData.discountRate
                );
                const fvlcd = await this.calculateFairValueLessCostsOfDisposal(
                    data.cashflows || updateData.cashflows
                );
                recoverableAmount = Math.max(viu, fvlcd);
            }

            const carryingAmount = data.carrying_amount !== undefined ? data.carrying_amount : updateData.carryingAmount;
            const loss = Math.max(0, carryingAmount - recoverableAmount);

            updateData.recoverableAmount = recoverableAmount;
            updateData.loss = loss;
        }

        await this.dbInstance
            .update(leaseImpTest)
            .set(updateData)
            .where(eq(leaseImpTest.id, testId));
    }
}
