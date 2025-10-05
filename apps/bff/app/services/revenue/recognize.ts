import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    revRecRun,
    revRecLine,
    revSchedule,
    revPob,
    revPolicy,
    revPostLock
} from "@aibos/db-adapter/schema";
import type {
    RecognizeRunReqType,
    RecognizeRunRespType,
    RecognitionRunQueryType,
    RecognitionRunResponseType,
    RecognitionLineResponseType
} from "@aibos/contracts";

export class RevRecognitionService {
    constructor(private dbInstance = db) { }

    /**
     * Run revenue recognition for a period
     */
    async runRecognition(
        companyId: string,
        userId: string,
        data: RecognizeRunReqType
    ): Promise<RecognizeRunRespType> {
        // Check if period is already posted
        if (!data.dry_run) {
            const existingLocks = await this.dbInstance
                .select()
                .from(revPostLock)
                .where(and(
                    eq(revPostLock.companyId, companyId),
                    eq(revPostLock.year, data.year),
                    eq(revPostLock.month, data.month)
                ))
                .limit(1);

            if (existingLocks.length > 0) {
                throw new Error(`Period ${data.year}-${data.month.toString().padStart(2, '0')} is already posted`);
            }
        }

        // Create recognition run
        const runId = ulid();
        await this.dbInstance.insert(revRecRun).values({
            id: runId,
            companyId,
            periodYear: data.year,
            periodMonth: data.month,
            status: 'DRAFT',
            stats: {},
            createdAt: new Date(),
            createdBy: userId
        });

        // Get company policy
        const policies = await this.dbInstance
            .select()
            .from(revPolicy)
            .where(eq(revPolicy.companyId, companyId))
            .limit(1);

        if (policies.length === 0) {
            throw new Error("Revenue policy not configured for company");
        }

        const policy = policies[0]!;

        // Get schedules for the period
        const schedules = await this.dbInstance
            .select()
            .from(revSchedule)
            .where(and(
                eq(revSchedule.companyId, companyId),
                eq(revSchedule.year, data.year),
                eq(revSchedule.month, data.month),
                eq(revSchedule.status, 'PLANNED')
            ));

        let totalAmount = 0;
        let linesCreated = 0;
        let unbilledArAmount = 0;
        let deferredRevAmount = 0;
        let revenueAmount = 0;

        // Process each schedule entry
        for (const schedule of schedules) {
            const plannedAmount = Number(schedule.planned);
            const recognizedAmount = Number(schedule.recognized);
            const deltaAmount = plannedAmount - recognizedAmount;

            if (deltaAmount <= 0) {
                continue; // Skip if no recognition needed
            }

            // Get POB details to determine posting path
            const pobs = await this.dbInstance
                .select()
                .from(revPob)
                .where(and(
                    eq(revPob.companyId, companyId),
                    eq(revPob.id, schedule.pobId)
                ))
                .limit(1);

            if (pobs.length === 0) {
                continue; // Skip if POB not found
            }

            const pob = pobs[0]!;
            const isUnbilled = this.isUnbilledScenario(pob, data.year, data.month);

            // Create recognition line
            const lineId = ulid();
            const drAccount = isUnbilled ? policy.unbilledArAccount : policy.deferredRevAccount;
            const crAccount = policy.revAccount;

            await this.dbInstance.insert(revRecLine).values({
                id: lineId,
                runId,
                companyId,
                pobId: schedule.pobId,
                year: data.year,
                month: data.month,
                amount: deltaAmount.toString(),
                drAccount,
                crAccount,
                memo: `Revenue recognition for POB ${pob.name}`,
                createdAt: new Date()
            });

            // Update schedule
            await this.dbInstance
                .update(revSchedule)
                .set({
                    recognized: (recognizedAmount + deltaAmount).toString(),
                    status: plannedAmount === (recognizedAmount + deltaAmount) ? 'DONE' : 'PARTIAL',
                    updatedAt: new Date()
                })
                .where(eq(revSchedule.id, schedule.id));

            totalAmount += deltaAmount;
            linesCreated++;

            if (isUnbilled) {
                unbilledArAmount += deltaAmount;
            } else {
                deferredRevAmount += deltaAmount;
            }
            revenueAmount += deltaAmount;
        }

        // Post to GL if not dry run
        if (!data.dry_run && linesCreated > 0) {
            await this.postToGL(runId, companyId, userId);

            // Create post lock
            await this.dbInstance.insert(revPostLock).values({
                id: ulid(),
                companyId,
                year: data.year,
                month: data.month,
                postedAt: new Date(),
                postedBy: userId
            });

            // Update run status
            await this.dbInstance
                .update(revRecRun)
                .set({
                    status: 'POSTED',
                    stats: {
                        pobs_processed: schedules.length,
                        lines_created: linesCreated,
                        total_amount: totalAmount,
                        unbilled_ar_amount: unbilledArAmount,
                        deferred_rev_amount: deferredRevAmount,
                        revenue_amount: revenueAmount
                    }
                })
                .where(eq(revRecRun.id, runId));
        } else {
            // Update run stats for dry run
            await this.dbInstance
                .update(revRecRun)
                .set({
                    stats: {
                        pobs_processed: schedules.length,
                        lines_created: linesCreated,
                        total_amount: totalAmount,
                        unbilled_ar_amount: unbilledArAmount,
                        deferred_rev_amount: deferredRevAmount,
                        revenue_amount: revenueAmount
                    }
                })
                .where(eq(revRecRun.id, runId));
        }

        return {
            run_id: runId,
            year: data.year,
            month: data.month,
            status: data.dry_run ? 'DRAFT' : 'POSTED',
            total_amount: totalAmount,
            lines_created: linesCreated,
            dry_run: data.dry_run,
            stats: {
                pobs_processed: schedules.length,
                unbilled_ar_amount: unbilledArAmount,
                deferred_rev_amount: deferredRevAmount,
                revenue_amount: revenueAmount
            }
        };
    }

    /**
     * Determine if this is an unbilled AR scenario vs deferred revenue
     */
    private isUnbilledScenario(pob: any, year: number, month: number): boolean {
        const pobStartDate = new Date(pob.startDate);
        const recognitionDate = new Date(year, month - 1, 1);

        // If recognition date is before POB start date, it's deferred revenue
        // If recognition date is on or after POB start date, it's unbilled AR
        return recognitionDate >= pobStartDate;
    }

    /**
     * Post recognition lines to GL
     */
    private async postToGL(runId: string, companyId: string, userId: string): Promise<void> {
        // Get recognition lines
        const lines = await this.dbInstance
            .select()
            .from(revRecLine)
            .where(eq(revRecLine.runId, runId));

        if (lines.length === 0) {
            return;
        }

        // Import posting service
        const { repo } = await import("@/lib/db");
        const { ensurePostingAllowed } = await import("@/lib/policy");

        // Check period guard
        const postingDate = new Date();
        const postingCheck = await ensurePostingAllowed(companyId, postingDate.toISOString());
        if (postingCheck) {
            throw new Error(`Posting not allowed: ${await postingCheck.text()}`);
        }

        // Create journal entries
        const journalLines = [
            ...lines.map(line => ({
                accountCode: line.drAccount,
                dc: 'D' as const,
                amount: Number(line.amount),
                description: line.memo || 'Revenue recognition'
            })),
            ...lines.map(line => ({
                accountCode: line.crAccount,
                dc: 'C' as const,
                amount: Number(line.amount),
                description: line.memo || 'Revenue recognition'
            }))
        ];

        await repo.insertJournal({
            company_id: companyId,
            posting_date: postingDate.toISOString(),
            currency: 'USD',
            source_doctype: 'REV_RECOGNITION',
            source_id: runId,
            idempotency_key: `rev-recognition-${runId}`,
            base_currency: 'USD',
            rate_used: 1.0,
            lines: journalLines.map(line => ({
                id: crypto.randomUUID(),
                account_code: line.accountCode,
                dc: line.dc,
                amount: { amount: line.amount.toString(), currency: 'USD' },
                currency: 'USD',
                base_amount: { amount: line.amount.toString(), currency: 'USD' },
                base_currency: 'USD',
                txn_amount: { amount: line.amount.toString(), currency: 'USD' },
                txn_currency: 'USD'
            }))
        });
    }

    /**
     * Query recognition runs
     */
    async queryRecognitionRuns(
        companyId: string,
        query: RecognitionRunQueryType
    ): Promise<RecognitionRunResponseType[]> {
        const conditions = [eq(revRecRun.companyId, companyId)];

        if (query.year) {
            conditions.push(eq(revRecRun.periodYear, query.year));
        }
        if (query.month) {
            conditions.push(eq(revRecRun.periodMonth, query.month));
        }
        if (query.status) {
            conditions.push(eq(revRecRun.status, query.status));
        }

        const runs = await this.dbInstance
            .select()
            .from(revRecRun)
            .where(and(...conditions))
            .orderBy(desc(revRecRun.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return runs.map(run => ({
            id: run.id,
            company_id: run.companyId,
            period_year: run.periodYear,
            period_month: run.periodMonth,
            status: run.status,
            stats: run.stats,
            created_at: run.createdAt.toISOString(),
            created_by: run.createdBy
        }));
    }

    /**
     * Get recognition lines for a run
     */
    async getRecognitionLines(
        companyId: string,
        runId: string
    ): Promise<RecognitionLineResponseType[]> {
        const lines = await this.dbInstance
            .select()
            .from(revRecLine)
            .where(and(
                eq(revRecLine.companyId, companyId),
                eq(revRecLine.runId, runId)
            ))
            .orderBy(asc(revRecLine.createdAt));

        return lines.map(line => ({
            id: line.id,
            run_id: line.runId,
            company_id: line.companyId,
            pob_id: line.pobId,
            year: line.year,
            month: line.month,
            amount: Number(line.amount),
            dr_account: line.drAccount,
            cr_account: line.crAccount,
            memo: line.memo || undefined,
            created_at: line.createdAt.toISOString()
        }));
    }
}
