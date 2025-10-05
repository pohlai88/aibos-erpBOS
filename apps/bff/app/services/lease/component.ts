import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, asc } from "drizzle-orm";
import {
    lease,
    leaseComponent,
    leaseComponentSched,
    leaseOpening,
    leaseSchedule,
    leaseCashflow
} from "@aibos/db-adapter/schema";
import type {
    LeaseComponentDesignReqType,
    LeaseComponentDesignResponseType,
    LeaseComponentScheduleResponseType
} from "@aibos/contracts";

export class ComponentDesignService {
    constructor(private dbInstance = db) { }

    /**
     * Design components from allocation splits
     */
    async designFromAllocation(
        companyId: string,
        userId: string,
        leaseId: string,
        splits: LeaseComponentDesignReqType['splits']
    ): Promise<LeaseComponentDesignResponseType> {
        // Validate lease exists
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.id, leaseId),
                eq(lease.companyId, companyId)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        const leaseRecord = leaseData[0]!;

        // Validate splits array is not empty
        if (!splits || splits.length === 0) {
            throw new Error("At least one component split is required");
        }

        // Validate each split has required fields
        for (const split of splits) {
            if (!split.code || !split.name || !split.class) {
                throw new Error("Each component split must have code, name, and class");
            }
            if (split.pct_of_rou <= 0 || split.pct_of_rou > 1) {
                throw new Error(`Component ${split.code} percentage must be between 0 and 1, got ${split.pct_of_rou}`);
            }
            if (split.useful_life_months <= 0) {
                throw new Error(`Component ${split.code} useful life must be positive, got ${split.useful_life_months}`);
            }
        }
        const totalPct = splits.reduce((sum: number, split: LeaseComponentDesignReqType['splits'][0]) => sum + split.pct_of_rou, 0);
        if (Math.abs(totalPct - 1.0) > 0.00001) {
            throw new Error(`Component percentages must sum to 1.00000, got ${totalPct.toFixed(5)}`);
        }

        // Validate life windows align with lease term
        const leaseStart = new Date(leaseRecord.commenceOn);
        const leaseEnd = new Date(leaseRecord.endOn);
        const leaseTermMonths = this.getTotalMonths(leaseStart, leaseEnd);

        for (const split of splits) {
            if (split.useful_life_months > leaseTermMonths) {
                throw new Error(`Component ${split.code} useful life (${split.useful_life_months} months) exceeds lease term (${leaseTermMonths} months)`);
            }
        }

        // Get opening measures for allocation
        const openingData = await this.dbInstance
            .select()
            .from(leaseOpening)
            .where(eq(leaseOpening.leaseId, leaseId))
            .limit(1);

        if (openingData.length === 0) {
            throw new Error("Opening measures not found");
        }

        const opening = openingData[0]!;
        const initialRou = Number(opening.initialRou);
        const incentivesReceived = Number(opening.incentivesReceived);
        const restorationCost = Number(opening.restorationCost);

        // Create components
        const createdComponents = [];
        for (const split of splits) {
            const componentId = ulid();

            // Calculate allocations
            const componentRou = initialRou * split.pct_of_rou;
            const incentiveAlloc = incentivesReceived * split.pct_of_rou;
            const restorationAlloc = restorationCost * split.pct_of_rou;

            await this.dbInstance.insert(leaseComponent).values({
                id: componentId,
                companyId,
                leaseId,
                code: split.code,
                name: split.name,
                class: split.class,
                uom: split.uom,
                pctOfRou: split.pct_of_rou.toString(),
                usefulLifeMonths: split.useful_life_months,
                method: split.method,
                unitsBasis: split.units_basis?.toString(),
                incentiveAlloc: incentiveAlloc.toString(),
                restorationAlloc: restorationAlloc.toString(),
                startOn: leaseRecord.commenceOn,
                endOn: leaseRecord.endOn,
                status: 'ACTIVE',
                createdAt: new Date(),
                createdBy: userId,
                updatedAt: new Date(),
                updatedBy: userId
            });

            createdComponents.push({
                id: componentId,
                code: split.code,
                name: split.name,
                class: split.class,
                pct_of_rou: split.pct_of_rou,
                useful_life_months: split.useful_life_months,
                method: split.method,
                component_rou: componentRou,
                incentive_alloc: incentiveAlloc,
                restoration_alloc: restorationAlloc
            });
        }

        return {
            lease_id: leaseId,
            components: createdComponents,
            total_rou: initialRou,
            total_incentives: incentivesReceived,
            total_restoration: restorationCost,
            design_proof: {
                total_pct: totalPct,
                lease_term_months: leaseTermMonths,
                validation_passed: true
            }
        };
    }

    /**
     * Get components for a lease
     */
    async getLeaseComponents(
        companyId: string,
        leaseId: string
    ): Promise<Array<{
        id: string;
        code: string;
        name: string;
        class: string;
        uom: string | null;
        pct_of_rou: string;
        useful_life_months: number;
        method: string;
        units_basis: string | null;
        incentive_alloc: string;
        restoration_alloc: string;
        start_on: string;
        end_on: string;
        status: string;
        created_at: Date;
        created_by: string;
    }>> {
        return await this.dbInstance
            .select({
                id: leaseComponent.id,
                code: leaseComponent.code,
                name: leaseComponent.name,
                class: leaseComponent.class,
                uom: leaseComponent.uom,
                pct_of_rou: leaseComponent.pctOfRou,
                useful_life_months: leaseComponent.usefulLifeMonths,
                method: leaseComponent.method,
                units_basis: leaseComponent.unitsBasis,
                incentive_alloc: leaseComponent.incentiveAlloc,
                restoration_alloc: leaseComponent.restorationAlloc,
                start_on: leaseComponent.startOn,
                end_on: leaseComponent.endOn,
                status: leaseComponent.status,
                created_at: leaseComponent.createdAt,
                created_by: leaseComponent.createdBy
            })
            .from(leaseComponent)
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseComponent.leaseId, leaseId)
            ))
            .orderBy(asc(leaseComponent.code));
    }

    /**
     * Update component allocation
     */
    async updateComponentAllocation(
        companyId: string,
        userId: string,
        componentId: string,
        updates: Partial<LeaseComponentDesignReqType['splits'][0]>
    ): Promise<void> {
        // Validate component exists
        const componentData = await this.dbInstance
            .select()
            .from(leaseComponent)
            .where(and(
                eq(leaseComponent.id, componentId),
                eq(leaseComponent.companyId, companyId)
            ))
            .limit(1);

        if (componentData.length === 0) {
            throw new Error("Component not found");
        }

        const _component = componentData[0]!;

        // Update component
        const updateData: Partial<{
            name: string;
            class: string;
            uom: string;
            pctOfRou: string;
            usefulLifeMonths: number;
            method: string;
            unitsBasis: string;
            updatedAt: Date;
            updatedBy: string;
        }> = {
            updatedAt: new Date(),
            updatedBy: userId
        };

        if (updates.name) updateData.name = updates.name;
        if (updates.class) updateData.class = updates.class;
        if (updates.uom) updateData.uom = updates.uom;
        if (updates.pct_of_rou) updateData.pctOfRou = updates.pct_of_rou.toString();
        if (updates.useful_life_months) updateData.usefulLifeMonths = updates.useful_life_months;
        if (updates.method) updateData.method = updates.method;
        if (updates.units_basis) updateData.unitsBasis = updates.units_basis.toString();

        await this.dbInstance
            .update(leaseComponent)
            .set(updateData)
            .where(eq(leaseComponent.id, componentId));
    }

    /**
     * Calculate total months between two dates
     */
    private getTotalMonths(start: Date, end: Date): number {
        return (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) + 1;
    }
}

export class ComponentScheduleService {
    constructor(private dbInstance = db) { }

    /**
     * Build schedules for all components of a lease
     */
    async buildSchedules(
        companyId: string,
        userId: string,
        leaseId: string
    ): Promise<LeaseComponentScheduleResponseType> {
        // Get lease data
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.id, leaseId),
                eq(lease.companyId, companyId)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        const leaseRecord = leaseData[0]!;

        // Get components
        const components = await this.dbInstance
            .select()
            .from(leaseComponent)
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseComponent.leaseId, leaseId),
                eq(leaseComponent.status, 'ACTIVE')
            ));

        if (components.length === 0) {
            throw new Error("No active components found for lease");
        }

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

        // Get cashflows for liability calculation
        const cashflows = await this.dbInstance
            .select()
            .from(leaseCashflow)
            .where(eq(leaseCashflow.leaseId, leaseId))
            .orderBy(asc(leaseCashflow.dueOn));

        // Calculate lease-level liability schedule
        const monthlyRate = Number(leaseRecord.discountRate) / 12;
        const leaseStart = new Date(leaseRecord.commenceOn);
        const leaseEnd = new Date(leaseRecord.endOn);
        const totalMonths = this.getTotalMonths(leaseStart, leaseEnd);

        let _currentLiability = Number(opening.initialLiability);

        // Generate schedules for each component
        const componentSchedules = [];
        let totalComponentRou = 0;
        let totalComponentAmort = 0;

        for (const component of components) {
            const componentSchedule = await this.buildComponentSchedule(
                component,
                opening,
                cashflows,
                monthlyRate,
                leaseStart,
                totalMonths
            );

            componentSchedules.push(componentSchedule);
            totalComponentRou += componentSchedule.total_rou;
            totalComponentAmort += componentSchedule.total_amortization;
        }

        // Get lease-level schedule for reconciliation
        const leaseScheduleData = await this.dbInstance
            .select()
            .from(leaseSchedule)
            .where(eq(leaseSchedule.leaseId, leaseId))
            .orderBy(asc(leaseSchedule.year), asc(leaseSchedule.month));

        const totalLeaseRou = Number(opening.initialRou);
        const totalLeaseAmort = leaseScheduleData.reduce((sum: number, s: { rouAmort: string }) => sum + Number(s.rouAmort), 0);

        return {
            lease_id: leaseId,
            component_schedules: componentSchedules,
            reconciliation: {
                total_component_rou: totalComponentRou,
                total_lease_rou: totalLeaseRou,
                rou_difference: totalComponentRou - totalLeaseRou,
                total_component_amort: totalComponentAmort,
                total_lease_amort: totalLeaseAmort,
                amort_difference: totalComponentAmort - totalLeaseAmort,
                reconciliation_passed: Math.abs(totalComponentRou - totalLeaseRou) < 0.01
            },
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Build schedule for a single component
     */
    private async buildComponentSchedule(
        component: {
            id: string;
            companyId: string;
            code: string;
            name: string;
            class: string;
            pctOfRou: string;
            usefulLifeMonths: number;
            method: string;
        },
        opening: {
            initialRou: string;
            initialLiability: string;
        },
        cashflows: Array<{
            dueOn: string;
            amount: string;
        }>,
        monthlyRate: number,
        leaseStart: Date,
        totalMonths: number
    ): Promise<{
        component_id: string;
        component_code: string;
        component_name: string;
        component_class: string;
        method: string;
        total_rou: number;
        total_amortization: number;
        useful_life_months: number;
        schedule_rows: Array<{
            year: number;
            month: number;
            open_carry: number;
            rou_amort: number;
            interest: number;
            close_carry: number;
        }>;
    }> {
        const componentId = component.id;
        const componentRou = Number(component.pctOfRou) * Number(opening.initialRou || 0);
        const usefulLifeMonths = component.usefulLifeMonths;
        const method = component.method;

        // Calculate monthly amortization based on method
        let monthlyAmortization: number;
        switch (method) {
            case 'SL':
                monthlyAmortization = componentRou / usefulLifeMonths;
                break;
            case 'DDB': {
                const ddbRate = 2 / usefulLifeMonths;
                monthlyAmortization = componentRou * ddbRate / 12;
                break;
            }
            case 'Units':
                // For units-based, use SL as fallback until consumption data is available
                monthlyAmortization = componentRou / usefulLifeMonths;
                break;
            default:
                monthlyAmortization = componentRou / usefulLifeMonths;
        }

        // Delete existing schedule
        await this.dbInstance
            .delete(leaseComponentSched)
            .where(eq(leaseComponentSched.leaseComponentId, componentId));

        // Generate monthly schedule
        let currentRou = componentRou;
        let totalAmortization = 0;
        const scheduleRows = [];

        for (let month = 0; month < totalMonths; month++) {
            const scheduleDate = new Date(leaseStart);
            scheduleDate.setMonth(scheduleDate.getMonth() + month);

            const year = scheduleDate.getFullYear();
            const monthNum = scheduleDate.getMonth() + 1;

            // Calculate ROU amortization
            const rouAmortization = Math.min(monthlyAmortization, currentRou);
            const newRou = Math.max(0, currentRou - rouAmortization);

            // Find payment for this month (for liability calculation)
            const _payment = this.findPaymentForMonth(cashflows, scheduleDate);
            const interest = currentRou * monthlyRate; // Simplified - should use liability balance

            // Insert schedule row
            const scheduleId = ulid();
            await this.dbInstance.insert(leaseComponentSched).values({
                id: scheduleId,
                companyId: component.companyId,
                leaseComponentId: componentId,
                year,
                month: monthNum,
                openCarry: currentRou.toString(),
                rouAmort: rouAmortization.toString(),
                interest: interest.toString(),
                closeCarry: newRou.toString(),
                liabInterest: "0", // Would be calculated from liability balance
                liabReduction: "0", // Would be calculated from liability balance
                idx: JSON.stringify({
                    method,
                    monthly_rate: monthlyAmortization,
                    calculation_date: new Date().toISOString()
                }),
                createdAt: new Date()
            });

            scheduleRows.push({
                year,
                month: monthNum,
                open_carry: currentRou,
                rou_amort: rouAmortization,
                interest,
                close_carry: newRou
            });

            currentRou = newRou;
            totalAmortization += rouAmortization;
        }

        return {
            component_id: componentId,
            component_code: component.code,
            component_name: component.name,
            component_class: component.class,
            method,
            total_rou: componentRou,
            total_amortization: totalAmortization,
            useful_life_months: usefulLifeMonths,
            schedule_rows: scheduleRows
        };
    }

    /**
     * Find payment amount for a specific month
     */
    private findPaymentForMonth(cashflows: Array<{ dueOn: string; amount: string }>, date: Date): number {
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
     * Calculate total months between two dates
     */
    private getTotalMonths(start: Date, end: Date): number {
        return (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) + 1;
    }

    /**
     * Get component schedule for a specific period
     */
    async getComponentSchedule(
        companyId: string,
        componentId: string,
        year?: number,
        month?: number
    ): Promise<Array<{
        id: string;
        year: number;
        month: number;
        open_carry: string;
        rou_amort: string;
        interest: string;
        close_carry: string;
        liab_interest: string;
        liab_reduction: string;
        idx: unknown;
        created_at: Date;
    }>> {
        const conditions = [
            eq(leaseComponent.companyId, companyId),
            eq(leaseComponentSched.leaseComponentId, componentId)
        ];

        if (year !== undefined) {
            conditions.push(eq(leaseComponentSched.year, year));
        }
        if (month !== undefined) {
            conditions.push(eq(leaseComponentSched.month, month));
        }

        return await this.dbInstance
            .select({
                id: leaseComponentSched.id,
                year: leaseComponentSched.year,
                month: leaseComponentSched.month,
                open_carry: leaseComponentSched.openCarry,
                rou_amort: leaseComponentSched.rouAmort,
                interest: leaseComponentSched.interest,
                close_carry: leaseComponentSched.closeCarry,
                liab_interest: leaseComponentSched.liabInterest,
                liab_reduction: leaseComponentSched.liabReduction,
                idx: leaseComponentSched.idx,
                created_at: leaseComponentSched.createdAt
            })
            .from(leaseComponentSched)
            .innerJoin(leaseComponent, eq(leaseComponentSched.leaseComponentId, leaseComponent.id))
            .where(and(...conditions))
            .orderBy(asc(leaseComponentSched.year), asc(leaseComponentSched.month));
    }
}
