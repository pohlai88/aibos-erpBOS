import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    lease,
    leaseComponent,
    leaseRestoration
} from "@aibos/db-adapter/schema";
import type {
    LeaseRestorationUpsertType,
    LeaseRestorationQueryType,
    LeaseRestorationPostReqType,
    LeaseRestorationPostResponseType
} from "@aibos/contracts";
import { postJournal } from "@/services/gl/journals";

/**
 * M28.7: Lease Restoration Service
 * 
 * Handles restoration provisions per IAS 37 requirements
 * for lease exit scenarios
 */
export class LeaseRestorationService {
    constructor(private dbInstance = db) { }

    /**
     * Create or update restoration provision
     */
    async upsertRestoration(
        companyId: string,
        userId: string,
        data: LeaseRestorationUpsertType
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

        // Find component if specified
        let componentId: string | null = null;
        if (data.component_code) {
            const componentData = await this.dbInstance
                .select()
                .from(leaseComponent)
                .where(and(
                    eq(leaseComponent.leaseId, leaseRecord.id),
                    eq(leaseComponent.code, data.component_code)
                ))
                .limit(1);

            if (componentData.length === 0) {
                throw new Error("Lease component not found");
            }

            componentId = componentData[0]!.id;
        }

        // Check if restoration already exists
        const conditions = [
            eq(leaseRestoration.leaseId, leaseRecord.id),
            eq(leaseRestoration.asOfDate, data.as_of_date)
        ];

        if (componentId) {
            conditions.push(eq(leaseRestoration.componentId, componentId));
        }

        const existingRestoration = await this.dbInstance
            .select()
            .from(leaseRestoration)
            .where(and(...conditions))
            .limit(1);

        if (existingRestoration.length > 0) {
            // Update existing restoration
            const restorationId = existingRestoration[0]!.id;

            await this.dbInstance
                .update(leaseRestoration)
                .set({
                    estimate: data.estimate.toString(),
                    discountRate: data.discount_rate.toString(),
                    notes: data.notes ? JSON.stringify({ notes: data.notes }) : null,
                    updatedAt: new Date(),
                    updatedBy: userId
                })
                .where(eq(leaseRestoration.id, restorationId));

            return restorationId;
        } else {
            // Create new restoration
            const restorationId = ulid();

            // Calculate present value
            const presentValue = this.calculatePresentValue(
                data.estimate,
                data.discount_rate,
                data.as_of_date
            );

            await this.dbInstance.insert(leaseRestoration).values({
                id: restorationId,
                leaseId: leaseRecord.id,
                componentId,
                asOfDate: data.as_of_date,
                estimate: data.estimate.toString(),
                discountRate: data.discount_rate.toString(),
                opening: "0",
                charge: presentValue.toString(),
                unwind: "0",
                utilization: "0",
                closing: presentValue.toString(),
                posted: false,
                notes: data.notes ? JSON.stringify({ notes: data.notes }) : null,
                createdAt: new Date(),
                createdBy: userId,
                updatedAt: new Date(),
                updatedBy: userId
            });

            return restorationId;
        }
    }

    /**
     * Calculate present value of restoration cost
     */
    private calculatePresentValue(
        estimate: number,
        discountRate: number,
        asOfDate: string
    ): number {
        // Simplified calculation - assumes restoration at lease end
        // In practice, this would consider the actual restoration timing
        const asOf = new Date(asOfDate);
        const leaseEnd = new Date(); // Would get actual lease end date
        const yearsToRestoration = Math.max(0, (leaseEnd.getTime() - asOf.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        return estimate / Math.pow(1 + discountRate, yearsToRestoration);
    }

    /**
     * Post restoration provision movements
     */
    async postRestoration(
        companyId: string,
        userId: string,
        data: LeaseRestorationPostReqType
    ): Promise<LeaseRestorationPostResponseType> {
        const { restoration_id, year, month, dry_run } = data;

        // Get restoration details
        const restorationData = await this.dbInstance
            .select()
            .from(leaseRestoration)
            .where(eq(leaseRestoration.id, restoration_id))
            .limit(1);

        if (restorationData.length === 0) {
            throw new Error("Restoration provision not found");
        }

        const restoration = restorationData[0]!;

        // Verify lease belongs to company
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.id, restoration.leaseId),
                eq(lease.companyId, companyId)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        // Calculate movements for the period
        const movements = await this.calculateRestorationMovements(restoration, year, month);

        // Generate journal entries
        const journalLines = this.generateRestorationJournalEntries(restoration, movements, year, month);

        let journalId: string | null = null;
        let status: 'DRAFT' | 'POSTED' | 'ERROR' = 'DRAFT';
        let message = '';

        if (!dry_run) {
            try {
                // Post journal
                const journalResult = await postJournal(companyId, {
                    date: new Date(year, month - 1, 1),
                    memo: `Restoration provision movements for ${year}/${month}`,
                    lines: journalLines.map(line => ({
                        accountId: line.account,
                        debit: line.debit,
                        credit: line.credit,
                        description: line.memo
                    }))
                });

                journalId = journalResult.journalId;
                status = 'POSTED';
                message = 'Restoration provision posted successfully';

                // Update restoration with new balances
                await this.dbInstance
                    .update(leaseRestoration)
                    .set({
                        opening: movements.opening.toString(),
                        charge: movements.charge.toString(),
                        unwind: movements.unwind.toString(),
                        utilization: movements.utilization.toString(),
                        closing: movements.closing.toString(),
                        posted: true,
                        updatedAt: new Date(),
                        updatedBy: userId
                    })
                    .where(eq(leaseRestoration.id, restoration_id));

            } catch (error) {
                status = 'ERROR';
                message = error instanceof Error ? error.message : 'Unknown error';
            }
        } else {
            message = 'Dry run completed successfully';
        }

        return {
            restoration_id,
            journal_id: journalId,
            status,
            message,
            movements: {
                opening: movements.opening,
                charge: movements.charge,
                unwind: movements.unwind,
                utilization: movements.utilization,
                closing: movements.closing
            },
            journal_lines: journalLines
        };
    }

    /**
     * Calculate restoration provision movements
     */
    private async calculateRestorationMovements(
        restoration: any,
        year: number,
        month: number
    ): Promise<{
        opening: number;
        charge: number;
        unwind: number;
        utilization: number;
        closing: number;
    }> {
        // Get previous period closing balance
        const previousPeriod = await this.getPreviousPeriodBalance(restoration.id, year, month);

        const opening = previousPeriod;
        const charge = Number(restoration.charge);
        const unwind = this.calculateUnwindInterest(previousPeriod, Number(restoration.discountRate));
        const utilization = Number(restoration.utilization);
        const closing = opening + charge + unwind - utilization;

        return {
            opening,
            charge,
            unwind,
            utilization,
            closing
        };
    }

    /**
     * Get previous period closing balance
     */
    private async getPreviousPeriodBalance(
        restorationId: string,
        year: number,
        month: number
    ): Promise<number> {
        // Calculate previous period
        let prevYear = year;
        let prevMonth = month - 1;

        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        // Get previous period data (simplified - would query actual previous period)
        const restorationData = await this.dbInstance
            .select()
            .from(leaseRestoration)
            .where(eq(leaseRestoration.id, restorationId))
            .limit(1);

        if (restorationData.length > 0) {
            return Number(restorationData[0]!.closing);
        }

        return 0;
    }

    /**
     * Calculate unwind interest
     */
    private calculateUnwindInterest(
        openingBalance: number,
        discountRate: number
    ): number {
        // Monthly unwind = opening balance * (discount rate / 12)
        return openingBalance * (discountRate / 12);
    }

    /**
     * Generate journal entries for restoration provision
     */
    private generateRestorationJournalEntries(
        restoration: any,
        movements: any,
        year: number,
        month: number
    ): Array<{
        account: string;
        debit: number;
        credit: number;
        memo: string;
    }> {
        const lines: Array<{
            account: string;
            debit: number;
            credit: number;
            memo: string;
        }> = [];

        // Provision charge (if any)
        if (movements.charge > 0) {
            lines.push({
                account: 'Restoration Expense',
                debit: movements.charge,
                credit: 0,
                memo: `Restoration provision charge - ${year}/${month}`
            });

            lines.push({
                account: 'Restoration Provision',
                debit: 0,
                credit: movements.charge,
                memo: `Restoration provision charge - ${year}/${month}`
            });
        }

        // Unwind interest
        if (movements.unwind > 0) {
            lines.push({
                account: 'Finance Cost - Restoration',
                debit: movements.unwind,
                credit: 0,
                memo: `Restoration provision unwind - ${year}/${month}`
            });

            lines.push({
                account: 'Restoration Provision',
                debit: 0,
                credit: movements.unwind,
                memo: `Restoration provision unwind - ${year}/${month}`
            });
        }

        // Utilization (if any)
        if (movements.utilization > 0) {
            lines.push({
                account: 'Restoration Provision',
                debit: movements.utilization,
                credit: 0,
                memo: `Restoration provision utilization - ${year}/${month}`
            });

            lines.push({
                account: 'Cash',
                debit: 0,
                credit: movements.utilization,
                memo: `Restoration provision utilization - ${year}/${month}`
            });
        }

        return lines;
    }

    /**
     * Query restoration provisions
     */
    async queryRestorations(
        companyId: string,
        query: LeaseRestorationQueryType
    ): Promise<any[]> {
        let whereConditions: any[] = [];

        // Build join with lease table for company filtering
        const baseQuery = this.dbInstance
            .select({
                id: leaseRestoration.id,
                leaseId: leaseRestoration.leaseId,
                componentId: leaseRestoration.componentId,
                asOfDate: leaseRestoration.asOfDate,
                estimate: leaseRestoration.estimate,
                discountRate: leaseRestoration.discountRate,
                opening: leaseRestoration.opening,
                charge: leaseRestoration.charge,
                unwind: leaseRestoration.unwind,
                utilization: leaseRestoration.utilization,
                closing: leaseRestoration.closing,
                posted: leaseRestoration.posted,
                notes: leaseRestoration.notes,
                createdAt: leaseRestoration.createdAt,
                createdBy: leaseRestoration.createdBy,
                updatedAt: leaseRestoration.updatedAt,
                updatedBy: leaseRestoration.updatedBy
            })
            .from(leaseRestoration)
            .innerJoin(lease, eq(leaseRestoration.leaseId, lease.id))
            .where(eq(lease.companyId, companyId));

        const additionalConditions = [];

        if (query.lease_code) {
            additionalConditions.push(eq(lease.leaseCode, query.lease_code));
        }

        if (query.as_of_date_from) {
            additionalConditions.push(gte(leaseRestoration.asOfDate, query.as_of_date_from));
        }

        if (query.as_of_date_to) {
            additionalConditions.push(lte(leaseRestoration.asOfDate, query.as_of_date_to));
        }

        if (query.posted !== undefined) {
            additionalConditions.push(eq(leaseRestoration.posted, query.posted));
        }

        // Combine all conditions including the existing companyId condition
        const allConditions = additionalConditions.length > 0
            ? and(eq(lease.companyId, companyId), ...additionalConditions)
            : eq(lease.companyId, companyId);

        // Build the complete query with all conditions
        const restorations = await this.dbInstance
            .select({
                id: leaseRestoration.id,
                leaseId: leaseRestoration.leaseId,
                asOfDate: leaseRestoration.asOfDate,
                estimate: leaseRestoration.estimate,
                discountRate: leaseRestoration.discountRate,
                opening: leaseRestoration.opening,
                charge: leaseRestoration.charge,
                unwind: leaseRestoration.unwind,
                utilization: leaseRestoration.utilization,
                closing: leaseRestoration.closing,
                posted: leaseRestoration.posted,
                notes: leaseRestoration.notes,
                createdAt: leaseRestoration.createdAt,
                createdBy: leaseRestoration.createdBy,
                updatedAt: leaseRestoration.updatedAt,
                updatedBy: leaseRestoration.updatedBy
            })
            .from(leaseRestoration)
            .innerJoin(lease, eq(leaseRestoration.leaseId, lease.id))
            .where(allConditions)
            .orderBy(desc(leaseRestoration.asOfDate))
            .limit(query.limit)
            .offset(query.offset);

        return restorations;
    }

    /**
     * Get restoration provision roll-forward for disclosures
     */
    async getRestorationRollForward(
        companyId: string,
        year: number,
        month: number
    ): Promise<{
        opening: number;
        charge: number;
        unwind: number;
        utilization: number;
        closing: number;
    }> {
        const restorations = await this.dbInstance
            .select({
                opening: leaseRestoration.opening,
                charge: leaseRestoration.charge,
                unwind: leaseRestoration.unwind,
                utilization: leaseRestoration.utilization,
                closing: leaseRestoration.closing
            })
            .from(leaseRestoration)
            .innerJoin(lease, eq(leaseRestoration.leaseId, lease.id))
            .where(eq(lease.companyId, companyId));

        let totalOpening = 0;
        let totalCharge = 0;
        let totalUnwind = 0;
        let totalUtilization = 0;
        let totalClosing = 0;

        for (const restoration of restorations) {
            totalOpening += Number(restoration.opening);
            totalCharge += Number(restoration.charge);
            totalUnwind += Number(restoration.unwind);
            totalUtilization += Number(restoration.utilization);
            totalClosing += Number(restoration.closing);
        }

        return {
            opening: totalOpening,
            charge: totalCharge,
            unwind: totalUnwind,
            utilization: totalUtilization,
            closing: totalClosing
        };
    }
}
