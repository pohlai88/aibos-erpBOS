import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import {
    leaseOnerousAssessment,
    leaseOnerousRoll,
    leaseComponent,
    lease
} from "@aibos/db-adapter/schema";
import type {
    OnerousAssessmentUpsertType,
    OnerousAssessmentQueryType
} from "@aibos/contracts";

export class OnerousAssessor {
    constructor(private dbInstance = db) { }

    /**
     * Create or update onerous contract assessment
     */
    async upsertAssessment(
        companyId: string,
        userId: string,
        data: OnerousAssessmentUpsertType
    ): Promise<string> {
        const assessmentId = ulid();

        // Calculate provision amount
        const provision = Math.max(0, data.unavoidable_cost - data.expected_benefit);

        await this.dbInstance
            .insert(leaseOnerousAssessment)
            .values({
                id: assessmentId,
                companyId,
                asOfDate: data.as_of_date,
                leaseComponentId: data.lease_component_id || null,
                serviceItem: data.service_item,
                termMonths: data.term_months,
                unavoidableCost: data.unavoidable_cost.toString(), // Convert to string
                expectedBenefit: data.expected_benefit.toString(), // Convert to string
                provision: provision.toString(), // Convert to string
                status: 'DRAFT',
                createdAt: new Date(),
                createdBy: userId,
                updatedAt: new Date(),
                updatedBy: userId
            } as any); // Add type assertion to fix array insert issue

        return assessmentId;
    }

    /**
     * Query onerous assessments
     */
    async queryAssessments(
        companyId: string,
        query: OnerousAssessmentQueryType
    ) {
        const conditions = [eq(leaseOnerousAssessment.companyId, companyId)];

        if (query.as_of_date) {
            conditions.push(eq(leaseOnerousAssessment.asOfDate, query.as_of_date));
        }
        if (query.lease_component_id) {
            conditions.push(eq(leaseOnerousAssessment.leaseComponentId, query.lease_component_id));
        }
        if (query.service_item) {
            conditions.push(sql`${leaseOnerousAssessment.serviceItem} ILIKE ${`%${query.service_item}%`}`);
        }
        if (query.status) {
            conditions.push(eq(leaseOnerousAssessment.status, query.status));
        }

        const assessments = await this.dbInstance
            .select({
                id: leaseOnerousAssessment.id,
                asOfDate: leaseOnerousAssessment.asOfDate,
                leaseComponentId: leaseOnerousAssessment.leaseComponentId,
                serviceItem: leaseOnerousAssessment.serviceItem,
                termMonths: leaseOnerousAssessment.termMonths,
                unavoidableCost: leaseOnerousAssessment.unavoidableCost,
                expectedBenefit: leaseOnerousAssessment.expectedBenefit,
                provision: leaseOnerousAssessment.provision,
                status: leaseOnerousAssessment.status,
                createdAt: leaseOnerousAssessment.createdAt,
                createdBy: leaseOnerousAssessment.createdBy,
                updatedAt: leaseOnerousAssessment.updatedAt,
                updatedBy: leaseOnerousAssessment.updatedBy,
                componentCode: leaseComponent.code,
                componentName: leaseComponent.name,
                leaseCode: lease.leaseCode
            })
            .from(leaseOnerousAssessment)
            .leftJoin(leaseComponent, eq(leaseOnerousAssessment.leaseComponentId, leaseComponent.id))
            .leftJoin(lease, eq(leaseComponent.leaseId, lease.id))
            .where(and(...conditions))
            .orderBy(desc(leaseOnerousAssessment.asOfDate), desc(leaseOnerousAssessment.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return assessments;
    }

    /**
     * Get assessment details with roll history
     */
    async getAssessmentDetails(assessmentId: string) {
        const assessment = await this.dbInstance
            .select({
                id: leaseOnerousAssessment.id,
                companyId: leaseOnerousAssessment.companyId,
                asOfDate: leaseOnerousAssessment.asOfDate,
                leaseComponentId: leaseOnerousAssessment.leaseComponentId,
                serviceItem: leaseOnerousAssessment.serviceItem,
                termMonths: leaseOnerousAssessment.termMonths,
                unavoidableCost: leaseOnerousAssessment.unavoidableCost,
                expectedBenefit: leaseOnerousAssessment.expectedBenefit,
                provision: leaseOnerousAssessment.provision,
                status: leaseOnerousAssessment.status,
                createdAt: leaseOnerousAssessment.createdAt,
                createdBy: leaseOnerousAssessment.createdBy,
                updatedAt: leaseOnerousAssessment.updatedAt,
                updatedBy: leaseOnerousAssessment.updatedBy,
                componentCode: leaseComponent.code,
                componentName: leaseComponent.name,
                leaseCode: lease.leaseCode
            })
            .from(leaseOnerousAssessment)
            .leftJoin(leaseComponent, eq(leaseOnerousAssessment.leaseComponentId, leaseComponent.id))
            .leftJoin(lease, eq(leaseComponent.leaseId, lease.id))
            .where(eq(leaseOnerousAssessment.id, assessmentId))
            .limit(1);

        if (assessment.length === 0) {
            throw new Error('Onerous assessment not found');
        }

        // Get roll history
        const rolls = await this.dbInstance
            .select({
                id: leaseOnerousRoll.id,
                year: leaseOnerousRoll.year,
                month: leaseOnerousRoll.month,
                opening: leaseOnerousRoll.opening,
                charge: leaseOnerousRoll.charge,
                unwind: leaseOnerousRoll.unwind,
                utilization: leaseOnerousRoll.utilization,
                closing: leaseOnerousRoll.closing,
                posted: leaseOnerousRoll.posted,
                notes: leaseOnerousRoll.notes,
                createdAt: leaseOnerousRoll.createdAt,
                createdBy: leaseOnerousRoll.createdBy
            })
            .from(leaseOnerousRoll)
            .where(eq(leaseOnerousRoll.assessmentId, assessmentId))
            .orderBy(desc(leaseOnerousRoll.year), desc(leaseOnerousRoll.month));

        return {
            ...assessment[0],
            rolls
        };
    }

    /**
     * Update assessment
     */
    async updateAssessment(
        assessmentId: string,
        userId: string,
        data: Partial<OnerousAssessmentUpsertType>
    ): Promise<void> {
        const updateData: any = {
            updatedAt: new Date(),
            updatedBy: userId
        };

        if (data.as_of_date) updateData.asOfDate = data.as_of_date;
        if (data.lease_component_id !== undefined) updateData.leaseComponentId = data.lease_component_id;
        if (data.service_item) updateData.serviceItem = data.service_item;
        if (data.term_months !== undefined) updateData.termMonths = data.term_months;
        if (data.unavoidable_cost !== undefined) updateData.unavoidableCost = data.unavoidable_cost;
        if (data.expected_benefit !== undefined) updateData.expectedBenefit = data.expected_benefit;

        // Recalculate provision if costs or benefits changed
        if (data.unavoidable_cost !== undefined || data.expected_benefit !== undefined) {
            const unavoidableCost = data.unavoidable_cost !== undefined ? data.unavoidable_cost : updateData.unavoidableCost;
            const expectedBenefit = data.expected_benefit !== undefined ? data.expected_benefit : updateData.expectedBenefit;
            updateData.provision = Math.max(0, unavoidableCost - expectedBenefit);
        }

        await this.dbInstance
            .update(leaseOnerousAssessment)
            .set(updateData)
            .where(eq(leaseOnerousAssessment.id, assessmentId));
    }

    /**
     * Recognize onerous provision
     */
    async recognizeProvision(
        assessmentId: string,
        userId: string
    ): Promise<void> {
        await this.dbInstance
            .update(leaseOnerousAssessment)
            .set({
                status: 'RECOGNIZED',
                updatedAt: new Date(),
                updatedBy: userId
            })
            .where(eq(leaseOnerousAssessment.id, assessmentId));
    }

    /**
     * Release onerous provision (when contract is settled)
     */
    async releaseProvision(
        assessmentId: string,
        userId: string
    ): Promise<void> {
        await this.dbInstance
            .update(leaseOnerousAssessment)
            .set({
                status: 'RELEASED',
                updatedAt: new Date(),
                updatedBy: userId
            })
            .where(eq(leaseOnerousAssessment.id, assessmentId));
    }

    /**
     * Get onerous assessments summary
     */
    async getAssessmentsSummary(
        companyId: string,
        asOfDate?: string
    ) {
        const conditions = [eq(leaseOnerousAssessment.companyId, companyId)];

        if (asOfDate) {
            conditions.push(eq(leaseOnerousAssessment.asOfDate, asOfDate));
        }

        const summary = await this.dbInstance
            .select({
                status: leaseOnerousAssessment.status,
                count: sql<number>`count(*)`.as('count'),
                totalProvision: sql<number>`sum(${leaseOnerousAssessment.provision})`.as('totalProvision'),
                totalUnavoidableCost: sql<number>`sum(${leaseOnerousAssessment.unavoidableCost})`.as('totalUnavoidableCost'),
                totalExpectedBenefit: sql<number>`sum(${leaseOnerousAssessment.expectedBenefit})`.as('totalExpectedBenefit')
            })
            .from(leaseOnerousAssessment)
            .where(and(...conditions))
            .groupBy(leaseOnerousAssessment.status);

        return summary;
    }

    /**
     * Identify potential onerous contracts
     */
    async identifyPotentialOnerous(
        companyId: string,
        userId: string,
        asOfDate: string
    ): Promise<Array<{
        leaseComponentId: string;
        componentCode: string;
        componentName: string;
        leaseCode: string;
        reason: string;
        estimatedCost: number;
        estimatedBenefit: number;
    }>> {
        // This would integrate with various systems to identify potential onerous contracts
        // For now, return empty array as placeholder
        return [];
    }
}
