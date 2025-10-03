import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
    arPtp,
    arDispute,
    cfReceiptSignal
} from "@aibos/adapters-db/schema";
import type {
    PtpCreateType,
    PtpResolveType,
    DisputeCreateType,
    DisputeResolveType,
    PtpRecordType,
    DisputeRecordType
} from "@aibos/contracts";

// --- AR Promise-to-Pay & Disputes Service (M24) ---------------------------------

export class ArPtpDisputesService {
    constructor(private db = pool) { }

    // Create Promise-to-Pay
    async createPtp(
        companyId: string,
        req: PtpCreateType,
        createdBy: string
    ): Promise<string> {
        const id = ulid();

        await this.db.insert(arPtp).values({
            id,
            companyId,
            customerId: req.customer_id,
            invoiceId: req.invoice_id,
            promisedDate: req.promised_date,
            amount: req.amount,
            reason: req.reason || null,
            status: 'open',
            createdBy,
        });

        return id;
    }

    // Resolve Promise-to-Pay
    async resolvePtp(
        companyId: string,
        req: PtpResolveType,
        decidedBy: string
    ): Promise<void> {
        const now = new Date().toISOString();

        await this.db
            .update(arPtp)
            .set({
                status: req.outcome,
                decidedAt: now,
                decidedBy,
            })
            .where(
                and(
                    eq(arPtp.id, req.id),
                    eq(arPtp.companyId, companyId)
                )
            );

        // If PTP was kept, emit receipt signal for M22
        if (req.outcome === 'kept') {
            const ptp = await this.db
                .select()
                .from(arPtp)
                .where(eq(arPtp.id, req.id))
                .limit(1);

            if (ptp.length > 0) {
                await this.emitReceiptSignal(
                    companyId,
                    ptp[0].promisedDate,
                    ptp[0].amount,
                    'PTP',
                    req.id
                );
            }
        }
    }

    // Create Dispute
    async createDispute(
        companyId: string,
        req: DisputeCreateType,
        createdBy: string
    ): Promise<string> {
        const id = ulid();

        await this.db.insert(arDispute).values({
            id,
            companyId,
            customerId: req.customer_id,
            invoiceId: req.invoice_id,
            reasonCode: req.reason_code,
            detail: req.detail || null,
            status: 'open',
            createdBy,
        });

        return id;
    }

    // Resolve Dispute
    async resolveDispute(
        companyId: string,
        req: DisputeResolveType,
        resolvedBy: string
    ): Promise<void> {
        const now = new Date().toISOString();

        await this.db
            .update(arDispute)
            .set({
                status: req.status,
                resolvedAt: now,
                resolvedBy,
            })
            .where(
                and(
                    eq(arDispute.id, req.id),
                    eq(arDispute.companyId, companyId)
                )
            );

        // If dispute was written off, create journal entry
        if (req.status === 'written_off') {
            await this.createWriteOffJournal(companyId, req.id, resolvedBy);
        }
    }

    // Get PTP records
    async getPtpRecords(
        companyId: string,
        status?: 'open' | 'kept' | 'broken' | 'cancelled',
        customerId?: string
    ): Promise<PtpRecordType[]> {
        let query = this.db
            .select()
            .from(arPtp)
            .where(eq(arPtp.companyId, companyId));

        if (status) {
            query = query.where(eq(arPtp.status, status));
        }

        if (customerId) {
            query = query.where(eq(arPtp.customerId, customerId));
        }

        const records = await query.orderBy(desc(arPtp.createdAt));

        return records.map(record => ({
            id: record.id,
            customer_id: record.customerId,
            invoice_id: record.invoiceId,
            promised_date: record.promisedDate,
            amount: Number(record.amount),
            reason: record.reason || undefined,
            status: record.status as any,
            created_at: record.createdAt.toISOString(),
            decided_at: record.decidedAt?.toISOString() || undefined,
        }));
    }

    // Get Dispute records
    async getDisputeRecords(
        companyId: string,
        status?: 'open' | 'resolved' | 'written_off',
        customerId?: string
    ): Promise<DisputeRecordType[]> {
        let query = this.db
            .select()
            .from(arDispute)
            .where(eq(arDispute.companyId, companyId));

        if (status) {
            query = query.where(eq(arDispute.status, status));
        }

        if (customerId) {
            query = query.where(eq(arDispute.customerId, customerId));
        }

        const records = await query.orderBy(desc(arDispute.createdAt));

        return records.map(record => ({
            id: record.id,
            customer_id: record.customerId,
            invoice_id: record.invoiceId,
            reason_code: record.reasonCode as any,
            detail: record.detail || undefined,
            status: record.status as any,
            created_at: record.createdAt.toISOString(),
            resolved_at: record.resolvedAt?.toISOString() || undefined,
        }));
    }

    // Get overdue PTPs
    async getOverduePtps(companyId: string): Promise<PtpRecordType[]> {
        const today = new Date().toISOString().split('T')[0];

        const records = await this.db
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

        return records.map(record => ({
            id: record.id,
            customer_id: record.customerId,
            invoice_id: record.invoiceId,
            promised_date: record.promisedDate,
            amount: Number(record.amount),
            reason: record.reason || undefined,
            status: record.status as any,
            created_at: record.createdAt.toISOString(),
            decided_at: record.decidedAt?.toISOString() || undefined,
        }));
    }

    // Get PTP statistics
    async getPtpStats(companyId: string): Promise<{
        total_open: number;
        total_kept: number;
        total_broken: number;
        total_cancelled: number;
        overdue_count: number;
        total_amount_open: number;
        total_amount_kept: number;
    }> {
        const today = new Date().toISOString().split('T')[0];

        const [openCount, keptCount, brokenCount, cancelledCount, overdueCount] = await Promise.all([
            this.db.select({ count: sql<number>`count(*)` }).from(arPtp).where(and(eq(arPtp.companyId, companyId), eq(arPtp.status, 'open'))),
            this.db.select({ count: sql<number>`count(*)` }).from(arPtp).where(and(eq(arPtp.companyId, companyId), eq(arPtp.status, 'kept'))),
            this.db.select({ count: sql<number>`count(*)` }).from(arPtp).where(and(eq(arPtp.companyId, companyId), eq(arPtp.status, 'broken'))),
            this.db.select({ count: sql<number>`count(*)` }).from(arPtp).where(and(eq(arPtp.companyId, companyId), eq(arPtp.status, 'cancelled'))),
            this.db.select({ count: sql<number>`count(*)` }).from(arPtp).where(and(eq(arPtp.companyId, companyId), eq(arPtp.status, 'open'), lte(arPtp.promisedDate, today))),
        ]);

        const [openAmount, keptAmount] = await Promise.all([
            this.db.select({ total: sql<number>`sum(amount)` }).from(arPtp).where(and(eq(arPtp.companyId, companyId), eq(arPtp.status, 'open'))),
            this.db.select({ total: sql<number>`sum(amount)` }).from(arPtp).where(and(eq(arPtp.companyId, companyId), eq(arPtp.status, 'kept'))),
        ]);

        return {
            total_open: openCount[0]?.count || 0,
            total_kept: keptCount[0]?.count || 0,
            total_broken: brokenCount[0]?.count || 0,
            total_cancelled: cancelledCount[0]?.count || 0,
            overdue_count: overdueCount[0]?.count || 0,
            total_amount_open: Number(openAmount[0]?.total || 0),
            total_amount_kept: Number(keptAmount[0]?.total || 0),
        };
    }

    // Get Dispute statistics
    async getDisputeStats(companyId: string): Promise<{
        total_open: number;
        total_resolved: number;
        total_written_off: number;
        by_reason: Record<string, number>;
    }> {
        const [openCount, resolvedCount, writtenOffCount] = await Promise.all([
            this.db.select({ count: sql<number>`count(*)` }).from(arDispute).where(and(eq(arDispute.companyId, companyId), eq(arDispute.status, 'open'))),
            this.db.select({ count: sql<number>`count(*)` }).from(arDispute).where(and(eq(arDispute.companyId, companyId), eq(arDispute.status, 'resolved'))),
            this.db.select({ count: sql<number>`count(*)` }).from(arDispute).where(and(eq(arDispute.companyId, companyId), eq(arDispute.status, 'written_off'))),
        ]);

        const reasonStats = await this.db
            .select({
                reason_code: arDispute.reasonCode,
                count: sql<number>`count(*)`
            })
            .from(arDispute)
            .where(eq(arDispute.companyId, companyId))
            .groupBy(arDispute.reasonCode);

        const byReason: Record<string, number> = {};
        for (const stat of reasonStats) {
            byReason[stat.reason_code] = stat.count;
        }

        return {
            total_open: openCount[0]?.count || 0,
            total_resolved: resolvedCount[0]?.count || 0,
            total_written_off: writtenOffCount[0]?.count || 0,
            by_reason: byReason,
        };
    }

    // Emit receipt signal for M22 integration
    private async emitReceiptSignal(
        companyId: string,
        promisedDate: string,
        amount: number,
        source: 'AUTO_MATCH' | 'PTP' | 'MANUAL',
        refId: string
    ): Promise<void> {
        const date = new Date(promisedDate);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week

        await this.db.insert(cfReceiptSignal).values({
            id: ulid(),
            companyId,
            weekStart: weekStart.toISOString().split('T')[0],
            ccy: 'USD', // Default - would get from invoice
            amount,
            source,
            refId,
        });
    }

    // Create write-off journal entry
    private async createWriteOffJournal(
        companyId: string,
        disputeId: string,
        createdBy: string
    ): Promise<void> {
        // Get dispute details
        const dispute = await this.db
            .select()
            .from(arDispute)
            .where(eq(arDispute.id, disputeId))
            .limit(1);

        if (dispute.length === 0) {
            throw new Error('Dispute not found');
        }

        // TODO: Create journal entry for write-off
        // This would integrate with the existing journal posting system
        console.log('Creating write-off journal entry for dispute:', disputeId);
    }

    // Get aging report with PTP and dispute information
    async getAgingReport(companyId: string, customerId?: string): Promise<{
        customer_id: string;
        customer_name: string;
        total_due: number;
        buckets: Array<{
            bucket: string;
            amount: number;
            invoice_count: number;
            oldest_days: number;
            ptp_count: number;
            dispute_count: number;
        }>;
        as_of_date: string;
    }[]> {
        // This would integrate with the dunning service to get aging data
        // and enrich it with PTP and dispute information
        const asOfDate = new Date().toISOString().split('T')[0];

        // Simplified implementation - in production, this would be more comprehensive
        return [{
            customer_id: customerId || 'unknown',
            customer_name: 'Unknown Customer',
            total_due: 0,
            buckets: [],
            as_of_date: asOfDate,
        }];
    }
}
