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
    LeaseRunReqType,
    LeaseRunResponseType,
    LeasePostingRunReqType,
    LeasePostingRunResponseType
} from "@aibos/contracts";
import { postJournal } from "@/services/gl/journals";

export class LeasePostingService {
    constructor(public dbInstance = db) { }

    /**
     * Generate and post monthly lease journal entries
     */
    async runMonthlyPosting(
        companyId: string,
        userId: string,
        data: LeaseRunReqType
    ): Promise<LeaseRunResponseType> {
        // Check if period is already posted
        if (!data.dry_run) {
            const existingLocks = await this.dbInstance
                .select()
                .from(leasePostLock)
                .where(and(
                    eq(leasePostLock.companyId, companyId),
                    eq(leasePostLock.year, data.year),
                    eq(leasePostLock.month, data.month)
                ))
                .limit(1);

            if (existingLocks.length > 0) {
                throw new Error(`Period ${data.year}-${data.month.toString().padStart(2, '0')} is already posted`);
            }
        }

        // Get lease schedules for the period
        const schedules = await this.dbInstance
            .select({
                lease_code: lease.leaseCode,
                open_liab: leaseSchedule.openLiab,
                interest: leaseSchedule.interest,
                payment: leaseSchedule.payment,
                fx_reval: leaseSchedule.fxReval,
                rou_amort: leaseSchedule.rouAmort
            })
            .from(leaseSchedule)
            .innerJoin(lease, eq(leaseSchedule.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(leaseSchedule.year, data.year),
                eq(leaseSchedule.month, data.month),
                eq(lease.status, 'ACTIVE')
            ));

        const journalLines: any[] = [];
        let totalInterest = 0;
        let totalPayments = 0;
        let totalAmortization = 0;
        let fxRevaluations = 0;

        // Generate journal entries for each lease
        for (const schedule of schedules) {
            const interest = Number(schedule.interest);
            const payment = Number(schedule.payment);
            const amortization = Number(schedule.rou_amort);
            const fxReval = Number(schedule.fx_reval);

            // Interest expense entry
            if (interest > 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: "LEASE_INTEREST_EXPENSE",
                    cr_account: "LEASE_LIABILITY",
                    amount: interest,
                    memo: `Lease interest - ${schedule.lease_code}`
                });
                totalInterest += interest;
            }

            // Payment entry
            if (payment > 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: "LEASE_LIABILITY",
                    cr_account: "CASH",
                    amount: payment,
                    memo: `Lease payment - ${schedule.lease_code}`
                });
                totalPayments += payment;
            }

            // Amortization entry
            if (amortization > 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: "LEASE_AMORTIZATION_EXPENSE",
                    cr_account: "ACCUMULATED_AMORTIZATION_ROU",
                    amount: amortization,
                    memo: `ROU amortization - ${schedule.lease_code}`
                });
                totalAmortization += amortization;
            }

            // FX revaluation entry
            if (fxReval !== 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: fxReval > 0 ? "LEASE_LIABILITY" : "FX_GAIN",
                    cr_account: fxReval > 0 ? "FX_LOSS" : "LEASE_LIABILITY",
                    amount: Math.abs(fxReval),
                    memo: `FX revaluation - ${schedule.lease_code}`
                });
                fxRevaluations += Math.abs(fxReval);
            }
        }

        const runId = ulid();
        const stats = {
            total_leases: schedules.length,
            total_interest: totalInterest,
            total_payments: totalPayments,
            total_amortization: totalAmortization,
            fx_revaluations: fxRevaluations
        };

        // Actually post journal entries if not dry run
        if (!data.dry_run && journalLines.length > 0) {
            try {
                // Group journal lines by lease for balanced entries
                const leaseGroups = this.groupJournalLinesByLease(journalLines);

                for (const [leaseCode, lines] of leaseGroups) {
                    const journalEntry = {
                        date: new Date(data.year, data.month - 1, 1),
                        memo: `Lease posting - ${leaseCode} - ${data.year}-${data.month.toString().padStart(2, '0')}`,
                        lines: [
                            ...lines.map(line => ({
                                accountId: line.dr_account,
                                debit: line.amount,
                                description: line.memo
                            })),
                            ...lines.map(line => ({
                                accountId: line.cr_account,
                                credit: line.amount,
                                description: line.memo
                            }))
                        ]
                    };

                    await postJournal(companyId, journalEntry);
                }

                // Create post lock
                await this.dbInstance.insert(leasePostLock).values({
                    id: ulid(),
                    companyId,
                    year: data.year,
                    month: data.month,
                    status: 'POSTED',
                    postedAt: new Date(),
                    postedBy: userId,
                    createdAt: new Date()
                });
            } catch (error) {
                console.error("Error posting journal entries:", error);
                throw new Error(`Failed to post journal entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return {
            run_id: runId,
            status: data.dry_run ? 'DRAFT' : 'POSTED',
            stats,
            journal_lines: journalLines
        };
    }

    /**
     * Group journal lines by lease code for balanced entries
     */
    private groupJournalLinesByLease(journalLines: any[]): Map<string, any[]> {
        const groups = new Map<string, any[]>();

        for (const line of journalLines) {
            if (!groups.has(line.lease_code)) {
                groups.set(line.lease_code, []);
            }
            groups.get(line.lease_code)!.push(line);
        }

        return groups;
    }

    /**
     * Check if period is locked for posting
     */
    async isPeriodLocked(
        companyId: string,
        year: number,
        month: number
    ): Promise<boolean> {
        const locks = await this.dbInstance
            .select()
            .from(leasePostLock)
            .where(and(
                eq(leasePostLock.companyId, companyId),
                eq(leasePostLock.year, year),
                eq(leasePostLock.month, month)
            ))
            .limit(1);

        return locks.length > 0;
    }

    /**
     * Get posting status for a period
     */
    async getPostingStatus(
        companyId: string,
        year: number,
        month: number
    ): Promise<{
        is_locked: boolean;
        posted_at?: string | undefined;
        posted_by?: string | undefined;
        total_leases: number;
        total_amount: number;
    }> {
        const locks = await this.dbInstance
            .select()
            .from(leasePostLock)
            .where(and(
                eq(leasePostLock.companyId, companyId),
                eq(leasePostLock.year, year),
                eq(leasePostLock.month, month)
            ))
            .limit(1);

        const schedules = await this.dbInstance
            .select({
                interest: leaseSchedule.interest,
                payment: leaseSchedule.payment,
                rou_amort: leaseSchedule.rouAmort
            })
            .from(leaseSchedule)
            .innerJoin(lease, eq(leaseSchedule.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(leaseSchedule.year, year),
                eq(leaseSchedule.month, month),
                eq(lease.status, 'ACTIVE')
            ));

        const totalAmount = schedules.reduce((sum, s) => {
            return sum + Number(s.interest) + Number(s.payment) + Number(s.rou_amort);
        }, 0);

        return {
            is_locked: locks.length > 0,
            posted_at: locks[0]?.postedAt?.toISOString() || undefined,
            posted_by: locks[0]?.postedBy || undefined,
            total_leases: schedules.length,
            total_amount: totalAmount
        };
    }

    /**
     * Enhanced monthly posting with M28.1 features
     */
    async runMonthlyPostingEnhanced(
        companyId: string,
        userId: string,
        data: LeasePostingRunReqType
    ): Promise<LeasePostingRunResponseType> {
        // Check if period is already posted (unless force is true)
        if (!data.dry_run && !data.force) {
            const existingLocks = await this.dbInstance
                .select()
                .from(leasePostLock)
                .where(and(
                    eq(leasePostLock.companyId, companyId),
                    eq(leasePostLock.year, data.year),
                    eq(leasePostLock.month, data.month)
                ))
                .limit(1);

            if (existingLocks.length > 0) {
                return {
                    run_id: ulid(),
                    status: 'LOCKED',
                    stats: {
                        total_leases: 0,
                        total_interest: 0,
                        total_payments: 0,
                        total_amortization: 0,
                        fx_revaluations: 0,
                        journal_entries_created: 0
                    },
                    journal_lines: [],
                    errors: [`Period ${data.year}-${data.month.toString().padStart(2, '0')} is already posted`]
                };
            }
        }

        // Get lease schedules for the period
        const schedules = await this.dbInstance
            .select({
                lease_code: lease.leaseCode,
                open_liab: leaseSchedule.openLiab,
                interest: leaseSchedule.interest,
                payment: leaseSchedule.payment,
                fx_reval: leaseSchedule.fxReval,
                rou_amort: leaseSchedule.rouAmort
            })
            .from(leaseSchedule)
            .innerJoin(lease, eq(leaseSchedule.leaseId, lease.id))
            .where(and(
                eq(lease.companyId, companyId),
                eq(leaseSchedule.year, data.year),
                eq(leaseSchedule.month, data.month),
                eq(lease.status, 'ACTIVE')
            ));

        const journalLines: any[] = [];
        let totalInterest = 0;
        let totalPayments = 0;
        let totalAmortization = 0;
        let fxRevaluations = 0;
        let journalEntriesCreated = 0;

        // Generate journal entries for each lease
        for (const schedule of schedules) {
            const interest = Number(schedule.interest);
            const payment = Number(schedule.payment);
            const amortization = Number(schedule.rou_amort);
            const fxReval = Number(schedule.fx_reval);

            // Interest expense entry
            if (interest > 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: "LEASE_INTEREST_EXPENSE",
                    cr_account: "LEASE_LIABILITY",
                    amount: interest,
                    memo: `Lease interest - ${schedule.lease_code}`
                });
                totalInterest += interest;
            }

            // Payment entry
            if (payment > 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: "LEASE_LIABILITY",
                    cr_account: "CASH",
                    amount: payment,
                    memo: `Lease payment - ${schedule.lease_code}`
                });
                totalPayments += payment;
            }

            // Amortization entry
            if (amortization > 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: "LEASE_AMORTIZATION_EXPENSE",
                    cr_account: "ACCUMULATED_AMORTIZATION_ROU",
                    amount: amortization,
                    memo: `ROU amortization - ${schedule.lease_code}`
                });
                totalAmortization += amortization;
            }

            // FX revaluation entry
            if (fxReval !== 0) {
                journalLines.push({
                    lease_code: schedule.lease_code,
                    dr_account: fxReval > 0 ? "LEASE_LIABILITY" : "FX_GAIN",
                    cr_account: fxReval > 0 ? "FX_LOSS" : "LEASE_LIABILITY",
                    amount: Math.abs(fxReval),
                    memo: `FX revaluation - ${schedule.lease_code}`
                });
                fxRevaluations += Math.abs(fxReval);
            }
        }

        const runId = ulid();
        const stats = {
            total_leases: schedules.length,
            total_interest: totalInterest,
            total_payments: totalPayments,
            total_amortization: totalAmortization,
            fx_revaluations: fxRevaluations,
            journal_entries_created: 0
        };

        // Actually post journal entries if not dry run
        if (!data.dry_run && journalLines.length > 0) {
            try {
                // Group journal lines by lease for balanced entries
                const leaseGroups = this.groupJournalLinesByLease(journalLines);

                for (const [leaseCode, lines] of leaseGroups) {
                    const journalEntry = {
                        date: new Date(data.year, data.month - 1, 1),
                        memo: `Lease posting - ${leaseCode} - ${data.year}-${data.month.toString().padStart(2, '0')}`,
                        lines: [
                            ...lines.map(line => ({
                                accountId: line.dr_account,
                                debit: line.amount,
                                description: line.memo
                            })),
                            ...lines.map(line => ({
                                accountId: line.cr_account,
                                credit: line.amount,
                                description: line.memo
                            }))
                        ]
                    };

                    await postJournal(companyId, journalEntry);
                    journalEntriesCreated++;
                }

                stats.journal_entries_created = journalEntriesCreated;

                // Create post lock
                await this.dbInstance.insert(leasePostLock).values({
                    id: ulid(),
                    companyId,
                    year: data.year,
                    month: data.month,
                    status: 'POSTED',
                    postedAt: new Date(),
                    postedBy: userId,
                    createdAt: new Date()
                });
            } catch (error) {
                console.error("Error posting journal entries:", error);
                return {
                    run_id: runId,
                    status: 'ERROR',
                    stats,
                    journal_lines: journalLines,
                    errors: [`Failed to post journal entries: ${error instanceof Error ? error.message : 'Unknown error'}`]
                };
            }
        }

        return {
            run_id: runId,
            status: data.dry_run ? 'DRAFT' : 'POSTED',
            stats,
            journal_lines: journalLines
        };
    }
}