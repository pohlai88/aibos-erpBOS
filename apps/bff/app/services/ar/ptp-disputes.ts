import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
    arPtp,
    arDispute
} from "@aibos/db-adapter/schema";
import type {
    PtpCreateType,
    PtpResolveType,
    DisputeCreateType,
    DisputeResolveType,
    PtpRecordType,
    DisputeRecordType
} from "@aibos/contracts";
import type { PtpRecord, DisputeRecord } from "./types";

export class ArPtpDisputesService {
    constructor(private dbInstance = db) { }

    /**
     * Create a Promise to Pay (PTP) record
     */
    async createPtp(
        companyId: string,
        req: PtpCreateType,
        createdBy: string
    ): Promise<PtpRecord> {
        const ptpId = ulid();

        await this.dbInstance.insert(arPtp).values({
            id: ptpId,
            companyId,
            customerId: req.customer_id,
            invoiceId: req.invoice_id,
            promisedDate: req.promised_date,
            amount: req.amount.toString(),
            reason: req.reason,
            status: 'open',
            createdBy,
        });

        const ptpData: any = {
            id: ptpId,
            companyId,
            customerId: req.customer_id,
            invoiceId: req.invoice_id,
            promisedDate: req.promised_date,
            amount: req.amount,
            status: 'open',
            createdAt: new Date().toISOString(),
            createdBy,
        };

        if (req.reason !== undefined) {
            ptpData.reason = req.reason;
        }

        return ptpData;
    }

    /**
     * Resolve a PTP record
     */
    async resolvePtp(
        companyId: string,
        req: PtpResolveType,
        decidedBy: string
    ): Promise<PtpRecord> {
        const now = new Date().toISOString();

        await this.dbInstance
            .update(arPtp)
            .set({
                status: req.outcome,
                decidedAt: new Date(),
                decidedBy,
            })
            .where(
                and(
                    eq(arPtp.id, req.id),
                    eq(arPtp.companyId, companyId)
                )
            );

        // Return updated record
        const updated = await this.dbInstance
            .select()
            .from(arPtp)
            .where(eq(arPtp.id, req.id))
            .limit(1);

        if (updated.length === 0) {
            throw new Error(`PTP ${req.id} not found`);
        }

        const ptp = updated[0]!;
        const ptpData: any = {
            id: ptp.id,
            companyId: ptp.companyId,
            customerId: ptp.customerId,
            invoiceId: ptp.invoiceId,
            promisedDate: ptp.promisedDate,
            amount: parseFloat(ptp.amount),
            status: ptp.status as any,
            createdAt: ptp.createdAt.toISOString(),
            createdBy: ptp.createdBy,
        };

        if (ptp.reason !== null) {
            ptpData.reason = ptp.reason;
        }

        if (ptp.decidedAt !== null) {
            ptpData.decidedAt = ptp.decidedAt.toISOString();
        }

        if (ptp.decidedBy !== null) {
            ptpData.decidedBy = ptp.decidedBy;
        }

        return ptpData;
    }

    /**
     * Create a dispute record
     */
    async createDispute(
        companyId: string,
        req: DisputeCreateType,
        createdBy: string
    ): Promise<DisputeRecord> {
        const disputeId = ulid();

        await this.dbInstance.insert(arDispute).values({
            id: disputeId,
            companyId,
            customerId: req.customer_id,
            invoiceId: req.invoice_id,
            reasonCode: req.reason_code,
            detail: req.detail,
            status: 'open',
            createdBy,
        });

        const disputeData: any = {
            id: disputeId,
            companyId,
            customerId: req.customer_id,
            invoiceId: req.invoice_id,
            reasonCode: req.reason_code,
            status: 'open',
            createdAt: new Date().toISOString(),
            createdBy,
        };

        if (req.detail !== undefined) {
            disputeData.detail = req.detail;
        }

        return disputeData;
    }

    /**
     * Resolve a dispute record
     */
    async resolveDispute(
        companyId: string,
        req: DisputeResolveType,
        resolvedBy: string
    ): Promise<DisputeRecord> {
        const now = new Date().toISOString();

        await this.dbInstance
            .update(arDispute)
            .set({
                status: req.status,
                resolvedAt: new Date(),
                resolvedBy,
            })
            .where(
                and(
                    eq(arDispute.id, req.id),
                    eq(arDispute.companyId, companyId)
                )
            );

        // Return updated record
        const updated = await this.dbInstance
            .select()
            .from(arDispute)
            .where(eq(arDispute.id, req.id))
            .limit(1);

        if (updated.length === 0) {
            throw new Error(`Dispute ${req.id} not found`);
        }

        const dispute = updated[0]!;
        const disputeData: any = {
            id: dispute.id,
            companyId: dispute.companyId,
            customerId: dispute.customerId,
            invoiceId: dispute.invoiceId,
            reasonCode: dispute.reasonCode,
            status: dispute.status as any,
            createdAt: dispute.createdAt.toISOString(),
            createdBy: dispute.createdBy,
        };

        if (dispute.detail !== null) {
            disputeData.detail = dispute.detail;
        }

        if (dispute.resolvedAt !== null) {
            disputeData.resolvedAt = dispute.resolvedAt.toISOString();
        }

        if (dispute.resolvedBy !== null) {
            disputeData.resolvedBy = dispute.resolvedBy;
        }

        return disputeData;
    }

    /**
     * Get all PTP records for a customer
     */
    async getCustomerPtps(companyId: string, customerId: string): Promise<PtpRecord[]> {
        const ptps = await this.dbInstance
            .select()
            .from(arPtp)
            .where(
                and(
                    eq(arPtp.companyId, companyId),
                    eq(arPtp.customerId, customerId)
                )
            )
            .orderBy(desc(arPtp.createdAt));

        return ptps.map(ptp => {
            const ptpData: any = {
                id: ptp.id,
                companyId: ptp.companyId,
                customerId: ptp.customerId,
                invoiceId: ptp.invoiceId,
                promisedDate: ptp.promisedDate,
                amount: parseFloat(ptp.amount),
                status: ptp.status as any,
                createdAt: ptp.createdAt.toISOString(),
                createdBy: ptp.createdBy,
            };

            if (ptp.reason !== null) {
                ptpData.reason = ptp.reason;
            }

            if (ptp.decidedAt !== null) {
                ptpData.decidedAt = ptp.decidedAt.toISOString();
            }

            if (ptp.decidedBy !== null) {
                ptpData.decidedBy = ptp.decidedBy;
            }

            return ptpData;
        });
    }

    /**
     * Get all dispute records for a customer
     */
    async getCustomerDisputes(companyId: string, customerId: string): Promise<DisputeRecord[]> {
        const disputes = await this.dbInstance
            .select()
            .from(arDispute)
            .where(
                and(
                    eq(arDispute.companyId, companyId),
                    eq(arDispute.customerId, customerId)
                )
            )
            .orderBy(desc(arDispute.createdAt));

        return disputes.map(dispute => {
            const disputeData: any = {
                id: dispute.id,
                companyId: dispute.companyId,
                customerId: dispute.customerId,
                invoiceId: dispute.invoiceId,
                reasonCode: dispute.reasonCode,
                status: dispute.status as any,
                createdAt: dispute.createdAt.toISOString(),
                createdBy: dispute.createdBy,
            };

            if (dispute.detail !== null) {
                disputeData.detail = dispute.detail;
            }

            if (dispute.resolvedAt !== null) {
                disputeData.resolvedAt = dispute.resolvedAt.toISOString();
            }

            if (dispute.resolvedBy !== null) {
                disputeData.resolvedBy = dispute.resolvedBy;
            }

            return disputeData;
        });
    }

    /**
     * Get overdue PTPs
     */
    async getOverduePtps(companyId: string): Promise<PtpRecord[]> {
        const today = new Date().toISOString().split('T')[0]!;

        const ptps = await this.dbInstance
            .select()
            .from(arPtp)
            .where(
                and(
                    eq(arPtp.companyId, companyId),
                    eq(arPtp.status, 'open'),
                    lte(arPtp.promisedDate, today)
                )
            )
            .orderBy(arPtp.promisedDate);

        return ptps.map(ptp => {
            const ptpData: any = {
                id: ptp.id,
                companyId: ptp.companyId,
                customerId: ptp.customerId,
                invoiceId: ptp.invoiceId,
                promisedDate: ptp.promisedDate,
                amount: parseFloat(ptp.amount),
                status: ptp.status as any,
                createdAt: ptp.createdAt.toISOString(),
                createdBy: ptp.createdBy,
            };

            if (ptp.reason !== null) {
                ptpData.reason = ptp.reason;
            }

            if (ptp.decidedAt !== null) {
                ptpData.decidedAt = ptp.decidedAt.toISOString();
            }

            if (ptp.decidedBy !== null) {
                ptpData.decidedBy = ptp.decidedBy;
            }

            return ptpData;
        });
    }

    /**
     * Get PTP records for a company with optional filtering
     */
    async getPtpRecords(
        companyId: string,
        status?: 'open' | 'kept' | 'broken' | 'cancelled',
        customerId?: string
    ): Promise<PtpRecord[]> {
        const conditions = [eq(arPtp.companyId, companyId)];

        if (status) {
            conditions.push(eq(arPtp.status, status));
        }

        if (customerId) {
            conditions.push(eq(arPtp.customerId, customerId));
        }

        const ptps = await this.dbInstance
            .select()
            .from(arPtp)
            .where(and(...conditions))
            .orderBy(desc(arPtp.createdAt));

        return ptps.map(ptp => {
            const ptpData: any = {
                id: ptp.id,
                companyId: ptp.companyId,
                customerId: ptp.customerId,
                invoiceId: ptp.invoiceId,
                promisedDate: ptp.promisedDate,
                amount: parseFloat(ptp.amount),
                status: ptp.status as any,
                createdAt: ptp.createdAt.toISOString(),
                createdBy: ptp.createdBy,
            };

            if (ptp.reason !== null) {
                ptpData.reason = ptp.reason;
            }

            if (ptp.decidedAt !== null) {
                ptpData.decidedAt = ptp.decidedAt.toISOString();
            }

            if (ptp.decidedBy !== null) {
                ptpData.decidedBy = ptp.decidedBy;
            }

            return ptpData;
        });
    }

    /**
     * Get dispute records for a company with optional filtering
     */
    async getDisputeRecords(
        companyId: string,
        status?: 'open' | 'resolved' | 'written_off',
        customerId?: string
    ): Promise<DisputeRecord[]> {
        const conditions = [eq(arDispute.companyId, companyId)];

        if (status) {
            conditions.push(eq(arDispute.status, status));
        }

        if (customerId) {
            conditions.push(eq(arDispute.customerId, customerId));
        }

        const disputes = await this.dbInstance
            .select()
            .from(arDispute)
            .where(and(...conditions))
            .orderBy(desc(arDispute.createdAt));

        return disputes.map(dispute => {
            const disputeData: any = {
                id: dispute.id,
                companyId: dispute.companyId,
                customerId: dispute.customerId,
                invoiceId: dispute.invoiceId,
                reasonCode: dispute.reasonCode,
                status: dispute.status as any,
                createdAt: dispute.createdAt.toISOString(),
                createdBy: dispute.createdBy,
            };

            if (dispute.detail !== null) {
                disputeData.detail = dispute.detail;
            }

            if (dispute.resolvedAt !== null) {
                disputeData.resolvedAt = dispute.resolvedAt.toISOString();
            }

            if (dispute.resolvedBy !== null) {
                disputeData.resolvedBy = dispute.resolvedBy;
            }

            return disputeData;
        });
    }

    /**
     * Get PTP statistics for a company
     */
    async getPtpStats(companyId: string): Promise<any> {
        const ptps = await this.dbInstance
            .select()
            .from(arPtp)
            .where(eq(arPtp.companyId, companyId));

        const stats = {
            total_open: 0,
            total_kept: 0,
            total_broken: 0,
            total_cancelled: 0,
            total_amount_open: 0,
            total_amount_kept: 0,
            total_amount_broken: 0,
            total_amount_cancelled: 0
        };

        for (const ptp of ptps) {
            const amount = parseFloat(ptp.amount);

            switch (ptp.status) {
                case 'open':
                    stats.total_open++;
                    stats.total_amount_open += amount;
                    break;
                case 'kept':
                    stats.total_kept++;
                    stats.total_amount_kept += amount;
                    break;
                case 'broken':
                    stats.total_broken++;
                    stats.total_amount_broken += amount;
                    break;
                case 'cancelled':
                    stats.total_cancelled++;
                    stats.total_amount_cancelled += amount;
                    break;
            }
        }

        return stats;
    }

    /**
     * Get dispute statistics for a company
     */
    async getDisputeStats(companyId: string): Promise<any> {
        const disputes = await this.dbInstance
            .select()
            .from(arDispute)
            .where(eq(arDispute.companyId, companyId));

        const stats = {
            total_open: 0,
            total_resolved: 0,
            total_written_off: 0,
            total_amount_open: 0,
            total_amount_resolved: 0,
            total_amount_written_off: 0,
            by_reason: {
                PRICING: 0,
                SERVICE: 0,
                DELIVERY: 0,
                QUALITY: 0,
                OTHER: 0
            }
        };

        for (const dispute of disputes) {
            // Count by status
            switch (dispute.status) {
                case 'open':
                    stats.total_open++;
                    break;
                case 'resolved':
                    stats.total_resolved++;
                    break;
                case 'written_off':
                    stats.total_written_off++;
                    break;
            }

            // Count by reason code
            if (dispute.reasonCode in stats.by_reason) {
                stats.by_reason[dispute.reasonCode as keyof typeof stats.by_reason]++;
            }
        }

        return stats;
    }
}