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
    leaseAttachment
} from "@aibos/db-adapter/schema";
import type {
    LeaseUpsertType,
    LeaseCashflowRowType,
    LeaseQueryType
} from "@aibos/contracts";

export class LeaseRegistrationService {
    constructor(private dbInstance = db) { }

    /**
     * Create or update a lease with cashflows
     */
    async upsertLease(
        companyId: string,
        userId: string,
        data: LeaseUpsertType,
        cashflows: LeaseCashflowRowType[]
    ): Promise<string> {
        const leaseId = ulid();

        // Validate lease term
        const commenceDate = new Date(data.commence_on);
        const endDate = new Date(data.end_on);
        const termMonths = (endDate.getFullYear() - commenceDate.getFullYear()) * 12 +
            (endDate.getMonth() - commenceDate.getMonth());

        if (termMonths <= 0) {
            throw new Error("Lease end date must be after commencement date");
        }

        // Check for short-term exemption
        const isShortTerm = termMonths <= 12 && data.short_term_exempt;

        // Insert lease
        await this.dbInstance.insert(lease).values({
            id: leaseId,
            companyId,
            leaseCode: data.lease_code,
            lessor: data.lessor,
            assetClass: data.asset_class,
            ccy: data.ccy,
            commenceOn: data.commence_on,
            endOn: data.end_on,
            paymentFrequency: data.payment_frequency,
            discountRate: data.discount_rate.toString(),
            rateKind: data.rate_kind,
            indexCode: data.index_code,
            shortTermExempt: isShortTerm,
            lowValueExempt: data.low_value_exempt,
            presentCcy: data.present_ccy,
            status: data.status,
            createdAt: new Date(),
            createdBy: userId,
            updatedAt: new Date(),
            updatedBy: userId
        });

        // Insert cashflows
        for (const cf of cashflows) {
            await this.dbInstance.insert(leaseCashflow).values({
                id: ulid(),
                leaseId,
                dueOn: cf.due_on,
                amount: cf.amount.toString(),
                inSubstanceFixed: cf.in_substance_fixed,
                variableFlag: cf.variable_flag,
                indexBase: cf.index_base?.toString(),
                indexLinkId: cf.index_link_id,
                paidFlag: false,
                createdAt: new Date()
            });
        }

        // Calculate opening measures (only for non-exempt leases)
        if (!isShortTerm && !data.low_value_exempt) {
            await this.calculateOpeningMeasures(leaseId, userId, cashflows, data.discount_rate);
        }

        return leaseId;
    }

    /**
     * Calculate opening measures: ROU asset and lease liability
     */
    private async calculateOpeningMeasures(
        leaseId: string,
        userId: string,
        cashflows: LeaseCashflowRowType[],
        discountRate: number
    ): Promise<void> {
        // Calculate present value of lease payments
        let pvLeasePayments = 0;
        const monthlyRate = discountRate / 12;

        for (const cf of cashflows) {
            if (cf.in_substance_fixed) {
                const monthsFromCommence = this.getMonthsFromCommence(cf.due_on);
                const pv = cf.amount / Math.pow(1 + monthlyRate, monthsFromCommence);
                pvLeasePayments += pv;
            }
        }

        // ROU asset = Lease liability + initial direct costs + restoration cost - incentives received
        const initialLiability = pvLeasePayments;
        const initialRou = initialLiability; // Simplified - would include IDC, restoration, incentives

        await this.dbInstance.insert(leaseOpening).values({
            id: ulid(),
            leaseId,
            initialLiability: initialLiability.toString(),
            initialRou: initialRou.toString(),
            incentivesReceived: "0",
            initialDirectCosts: "0",
            restorationCost: "0",
            computedAt: new Date(),
            computedBy: userId
        });
    }

    private getMonthsFromCommence(dueOn: string): number {
        // Simplified calculation - would need actual lease commencement date
        const dueDate = new Date(dueOn);
        const now = new Date();
        return (dueDate.getFullYear() - now.getFullYear()) * 12 +
            (dueDate.getMonth() - now.getMonth());
    }

    /**
     * Query leases with filters
     */
    async queryLeases(
        companyId: string,
        query: LeaseQueryType
    ): Promise<any[]> {
        let whereConditions = [eq(lease.companyId, companyId)];

        if (query.asset_class) {
            whereConditions.push(eq(lease.assetClass, query.asset_class));
        }

        if (query.status) {
            whereConditions.push(eq(lease.status, query.status));
        }

        if (query.commence_from) {
            whereConditions.push(gte(lease.commenceOn, query.commence_from));
        }

        if (query.commence_to) {
            whereConditions.push(lte(lease.commenceOn, query.commence_to));
        }

        if (query.lessor) {
            whereConditions.push(sql`${lease.lessor} ILIKE ${'%' + query.lessor + '%'}`);
        }

        return await this.dbInstance
            .select()
            .from(lease)
            .where(and(...whereConditions))
            .orderBy(desc(lease.createdAt))
            .limit(query.limit)
            .offset(query.offset);
    }
}
