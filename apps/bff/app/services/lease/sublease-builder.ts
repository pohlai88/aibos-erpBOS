import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    sublease,
    subleaseCf,
    lease,
    leaseComponent,
    leaseComponentSublet,
    leaseOpening,
    leaseCashflow
} from "@aibos/db-adapter/schema";
import { EvidencePackService } from "./evidence-pack-service";
import type {
    SubleaseCreateReqType,
    SubleaseCreateResponseType,
    SubleaseQueryType,
    SubleaseDetailResponseType
} from "@aibos/contracts";

export class SubleaseBuilder {
    private evidencePackService: EvidencePackService;

    constructor(private dbInstance = db) {
        this.evidencePackService = new EvidencePackService();
    }

    /**
     * Create a new sublease with cashflows
     */
    async createSublease(
        companyId: string,
        userId: string,
        data: SubleaseCreateReqType
    ): Promise<SubleaseCreateResponseType> {
        const subleaseId = ulid();

        // Validate head lease exists and is active
        const headLease = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.id, data.headLeaseId),
                eq(lease.companyId, companyId),
                eq(lease.status, 'ACTIVE')
            ))
            .limit(1);

        if (headLease.length === 0) {
            throw new Error("Head lease not found or not active");
        }

        const headLeaseRecord = headLease[0]!;

        // Classify sublease based on MFRS 16 criteria
        const classification = await this.classifySublease(data, headLeaseRecord);

        // Calculate effective interest rate if finance sublease
        let effectiveRate = null;
        if (classification === 'FINANCE') {
            effectiveRate = await this.calculateEffectiveRate(data.cashflows || []);
        }

        // Create sublease record
        await this.dbInstance
            .insert(sublease)
            .values({
                id: subleaseId,
                companyId,
                headLeaseId: data.headLeaseId,
                subleaseCode: data.subleaseCode,
                startOn: data.startOn,
                endOn: data.endOn,
                classification,
                ccy: data.ccy,
                rate: effectiveRate ? String(effectiveRate) : null,
                status: 'DRAFT',
                createdBy: userId,
                updatedBy: userId
            });

        // Create cashflows
        if (data.cashflows && data.cashflows.length > 0) {
            const cashflowInserts = data.cashflows.map(cf => ({
                id: ulid(),
                subleaseId,
                dueOn: cf.dueOn,
                amount: String(cf.amount),
                variable: cf.variable || null
            }));

            await this.dbInstance
                .insert(subleaseCf)
                .values(cashflowInserts);
        }

        // Link to head lease components if specified
        if (data.componentLinks && data.componentLinks.length > 0) {
            const linkInserts = data.componentLinks.map(link => ({
                id: ulid(),
                leaseComponentId: link.leaseComponentId,
                subleaseId,
                proportion: String(link.proportion),
                method: link.method || 'PROPORTIONATE',
                notes: link.notes || null,
                createdBy: userId
            }));

            await this.dbInstance
                .insert(leaseComponentSublet)
                .values(linkInserts);
        }

        // Create evidence pack for sublease
        try {
            await this.evidencePackService.createSubleaseEvidencePack(
                companyId,
                userId,
                subleaseId,
                {
                    subleaseContract: `Sublease contract for ${data.subleaseCode}`,
                    headLeaseReference: `Head lease: ${headLeaseRecord.leaseCode}`,
                    classificationMemo: `Classification: ${classification} based on MFRS 16 criteria`,
                    cashflowSchedule: `Cashflows: ${data.cashflows?.length || 0} payments`,
                    componentLinks: `Component links: ${data.componentLinks?.length || 0} components`
                }
            );
        } catch (error) {
            console.warn('Failed to create evidence pack for sublease:', error);
            // Don't fail the sublease creation if evidence pack fails
        }

        return {
            subleaseId,
            classification,
            effectiveRate,
            status: 'DRAFT'
        };
    }

    /**
     * Query subleases with filters
     */
    async querySubleases(
        companyId: string,
        query: SubleaseQueryType
    ): Promise<SubleaseDetailResponseType[]> {
        const conditions = [eq(sublease.companyId, companyId)];

        if (query.headLeaseId) {
            conditions.push(eq(sublease.headLeaseId, query.headLeaseId));
        }

        if (query.classification) {
            conditions.push(eq(sublease.classification, query.classification));
        }

        if (query.status) {
            conditions.push(eq(sublease.status, query.status));
        }

        if (query.startFrom) {
            conditions.push(gte(sublease.startOn, query.startFrom));
        }

        if (query.startTo) {
            conditions.push(lte(sublease.startOn, query.startTo));
        }

        const results = await this.dbInstance
            .select({
                id: sublease.id,
                subleaseCode: sublease.subleaseCode,
                headLeaseId: sublease.headLeaseId,
                startOn: sublease.startOn,
                endOn: sublease.endOn,
                classification: sublease.classification,
                ccy: sublease.ccy,
                rate: sublease.rate,
                status: sublease.status,
                createdAt: sublease.createdAt,
                createdBy: sublease.createdBy,
                // Head lease details
                headLeaseCode: lease.leaseCode,
                headLessor: lease.lessor,
                headAssetClass: lease.assetClass
            })
            .from(sublease)
            .leftJoin(lease, eq(sublease.headLeaseId, lease.id))
            .where(and(...conditions))
            .orderBy(desc(sublease.createdAt))
            .limit(query.limit || 50)
            .offset(query.offset || 0);

        return results.map(row => ({
            id: row.id,
            subleaseCode: row.subleaseCode,
            headLeaseId: row.headLeaseId,
            headLeaseCode: row.headLeaseCode,
            headLessor: row.headLessor,
            headAssetClass: row.headAssetClass,
            startOn: row.startOn,
            endOn: row.endOn,
            classification: row.classification as 'FINANCE' | 'OPERATING',
            ccy: row.ccy,
            rate: row.rate ? Number(row.rate) : null,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
            createdBy: row.createdBy,
            cashflows: [], // TODO: Add cashflows data
            componentLinks: [] // TODO: Add component links data
        }));
    }

    /**
     * Get detailed sublease information
     */
    async getSubleaseDetail(
        companyId: string,
        subleaseId: string
    ): Promise<SubleaseDetailResponseType | null> {
        const result = await this.dbInstance
            .select({
                id: sublease.id,
                subleaseCode: sublease.subleaseCode,
                headLeaseId: sublease.headLeaseId,
                startOn: sublease.startOn,
                endOn: sublease.endOn,
                classification: sublease.classification,
                ccy: sublease.ccy,
                rate: sublease.rate,
                status: sublease.status,
                createdAt: sublease.createdAt,
                createdBy: sublease.createdBy,
                // Head lease details
                headLeaseCode: lease.leaseCode,
                headLessor: lease.lessor,
                headAssetClass: lease.assetClass
            })
            .from(sublease)
            .leftJoin(lease, eq(sublease.headLeaseId, lease.id))
            .where(and(
                eq(sublease.id, subleaseId),
                eq(sublease.companyId, companyId)
            ))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        const row = result[0]!;

        // Get cashflows
        const cashflows = await this.dbInstance
            .select()
            .from(subleaseCf)
            .where(eq(subleaseCf.subleaseId, subleaseId))
            .orderBy(asc(subleaseCf.dueOn));

        // Get component links
        const componentLinks = await this.dbInstance
            .select({
                id: leaseComponentSublet.id,
                leaseComponentId: leaseComponentSublet.leaseComponentId,
                proportion: leaseComponentSublet.proportion,
                method: leaseComponentSublet.method,
                notes: leaseComponentSublet.notes,
                componentCode: leaseComponent.code,
                componentName: leaseComponent.name,
                componentClass: leaseComponent.class
            })
            .from(leaseComponentSublet)
            .leftJoin(leaseComponent, eq(leaseComponentSublet.leaseComponentId, leaseComponent.id))
            .where(eq(leaseComponentSublet.subleaseId, subleaseId));

        return {
            id: row.id,
            subleaseCode: row.subleaseCode,
            headLeaseId: row.headLeaseId,
            headLeaseCode: row.headLeaseCode,
            headLessor: row.headLessor,
            headAssetClass: row.headAssetClass,
            startOn: row.startOn,
            endOn: row.endOn,
            classification: row.classification as 'FINANCE' | 'OPERATING',
            ccy: row.ccy,
            rate: row.rate ? Number(row.rate) : null,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
            createdBy: row.createdBy,
            cashflows: cashflows.map(cf => ({
                id: cf.id,
                dueOn: cf.dueOn,
                amount: Number(cf.amount),
                variable: cf.variable
            })),
            componentLinks: componentLinks.map(link => ({
                id: link.id,
                leaseComponentId: link.leaseComponentId,
                componentCode: link.componentCode,
                componentName: link.componentName,
                componentClass: link.componentClass,
                proportion: Number(link.proportion),
                method: link.method,
                notes: link.notes
            }))
        };
    }

    /**
     * Classify sublease based on MFRS 16 criteria
     */
    private async classifySublease(
        data: SubleaseCreateReqType,
        headLease: any
    ): Promise<'FINANCE' | 'OPERATING'> {
        // Get head lease opening measures
        const opening = await this.dbInstance
            .select()
            .from(leaseOpening)
            .where(eq(leaseOpening.leaseId, data.headLeaseId))
            .limit(1);

        if (opening.length === 0) {
            throw new Error("Head lease opening measures not found");
        }

        const openingRecord = opening[0]!;
        const headLeaseRou = Number(openingRecord.initialRou);
        const subleaseTermMonths = this.getTotalMonths(new Date(data.startOn), new Date(data.endOn));
        const headLeaseTermMonths = this.getTotalMonths(new Date(headLease.commenceOn), new Date(headLease.endOn));

        // Calculate sublease proportion
        const subleaseProportion = subleaseTermMonths / headLeaseTermMonths;

        // MFRS 16 classification criteria:
        // 1. Substantially all risks and rewards transferred
        // 2. Lease term covers major part of economic life
        // 3. Present value of payments equals substantially all fair value

        // Calculate present value of sublease payments
        const subleasePv = await this.calculatePresentValue(data.cashflows || [], data.discountRate || 0.05);

        // Classification logic
        const substantiallyAllRisksRewards = subleaseProportion >= 0.9; // 90% threshold
        const majorPartOfEconomicLife = subleaseProportion >= 0.75; // 75% threshold
        const substantiallyAllFairValue = subleasePv >= (headLeaseRou * 0.9); // 90% threshold

        if (substantiallyAllRisksRewards || (majorPartOfEconomicLife && substantiallyAllFairValue)) {
            return 'FINANCE';
        }

        return 'OPERATING';
    }

    /**
     * Calculate effective interest rate for finance sublease
     */
    private async calculateEffectiveRate(cashflows: any[]): Promise<number> {
        if (!cashflows || cashflows.length === 0) {
            return 0;
        }

        // Use IRR calculation (simplified - in production, use proper IRR algorithm)
        const totalAmount = cashflows.reduce((sum, cf) => sum + Number(cf.amount), 0);
        const avgTermMonths = cashflows.length / 2; // Simplified average term

        // Approximate EIR calculation (simplified)
        const annualRate = Math.pow(1 + (totalAmount / 100000), 12 / avgTermMonths) - 1;
        return Math.max(0, Math.min(annualRate, 0.5)); // Cap at 50%
    }

    /**
     * Calculate present value of cashflows
     */
    private async calculatePresentValue(cashflows: any[], discountRate: number): Promise<number> {
        if (!cashflows || cashflows.length === 0) {
            return 0;
        }

        const monthlyRate = discountRate / 12;
        let pv = 0;

        for (const cf of cashflows) {
            const monthsFromStart = this.getMonthsFromStart(new Date(cf.dueOn));
            const discountFactor = Math.pow(1 + monthlyRate, -monthsFromStart);
            pv += Number(cf.amount) * discountFactor;
        }

        return pv;
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
    private getMonthsFromStart(dueDate: Date): number {
        const now = new Date();
        return this.getTotalMonths(now, dueDate);
    }
}
