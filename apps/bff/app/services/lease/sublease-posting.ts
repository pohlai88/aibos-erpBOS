import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    sublease,
    subleaseSchedule,
    subleasePostLock,
    lease,
    leaseComponentSublet,
    leaseComponent
} from "@aibos/db-adapter/schema";
import { JournalTemplateService } from "./journal-template-service";
import type {
    SubleasePostingReqType,
    SubleasePostingResponseType
} from "@aibos/contracts";
import { postJournal } from "@/services/gl/journals";

export class SubleasePostingService {
    private journalTemplateService: JournalTemplateService;

    constructor(private dbInstance = db) {
        this.journalTemplateService = new JournalTemplateService();
    }

    /**
     * Post monthly sublease entries
     */
    async postMonthlyEntries(
        companyId: string,
        userId: string,
        data: SubleasePostingReqType
    ): Promise<SubleasePostingResponseType> {
        // Validate required fields
        if (!data.year || !data.month) {
            throw new Error('Year and month are required for posting');
        }

        // Check if already posted
        const existingLock = await this.dbInstance
            .select()
            .from(subleasePostLock)
            .where(and(
                eq(subleasePostLock.subleaseId, data.subleaseId),
                eq(subleasePostLock.year, data.year),
                eq(subleasePostLock.month, data.month)
            ))
            .limit(1);

        if (existingLock.length > 0) {
            return {
                subleaseId: data.subleaseId,
                year: data.year,
                month: data.month,
                journalId: existingLock[0]!.journalId,
                status: 'ALREADY_POSTED',
                message: 'Entries already posted for this period'
            };
        }

        // Get sublease details
        const subleaseRecord = await this.dbInstance
            .select()
            .from(sublease)
            .where(and(
                eq(sublease.id, data.subleaseId),
                eq(sublease.companyId, companyId)
            ))
            .limit(1);

        if (subleaseRecord.length === 0) {
            throw new Error("Sublease not found");
        }

        const subleaseData = subleaseRecord[0]!;

        // Get schedule for the period
        const scheduleRecord = await this.dbInstance
            .select()
            .from(subleaseSchedule)
            .where(and(
                eq(subleaseSchedule.subleaseId, data.subleaseId),
                eq(subleaseSchedule.year, data.year),
                eq(subleaseSchedule.month, data.month)
            ))
            .limit(1);

        if (scheduleRecord.length === 0) {
            throw new Error("Schedule not found for the specified period");
        }

        const scheduleData = scheduleRecord[0]!;

        // Create journal entries based on classification
        let journalId: string;

        if (subleaseData.classification === 'FINANCE') {
            journalId = await this.postFinanceSubleaseEntries(
                companyId,
                userId,
                subleaseData,
                scheduleData,
                data.dryRun || false
            );
        } else {
            journalId = await this.postOperatingSubleaseEntries(
                companyId,
                userId,
                subleaseData,
                scheduleData,
                data.dryRun || false
            );
        }

        // Create post lock (only if not dry run)
        if (!data.dryRun) {
            await this.dbInstance
                .insert(subleasePostLock)
                .values({
                    id: ulid(),
                    subleaseId: data.subleaseId,
                    year: data.year,
                    month: data.month,
                    journalId,
                    postedBy: userId
                });
        }

        return {
            subleaseId: data.subleaseId,
            year: data.year,
            month: data.month,
            journalId: data.dryRun ? null : journalId,
            status: data.dryRun ? 'DRY_RUN' : 'POSTED',
            message: data.dryRun ? 'Dry run completed' : 'Entries posted successfully'
        };
    }

    /**
     * Post finance sublease entries using journal template
     */
    private async postFinanceSubleaseEntries(
        companyId: string,
        userId: string,
        subleaseData: any,
        scheduleData: any,
        dryRun: boolean
    ): Promise<string> {
        // Get finance sublease monthly template
        const template = this.journalTemplateService.getFinanceSubleaseMonthlyTemplate();

        // Prepare variables for template
        const variables = {
            cash_receipt: Number(scheduleData.receipt),
            interest: Number(scheduleData.interestIncome),
            principal: Number(scheduleData.receipt) - Number(scheduleData.interestIncome)
        };

        // Apply template
        const journalId = await this.journalTemplateService.applyTemplate(
            companyId,
            userId,
            template,
            variables,
            `Finance sublease monthly posting - ${subleaseData.subleaseCode}`,
            dryRun
        );

        return journalId;
    }

    /**
     * Post operating sublease entries using journal template
     */
    private async postOperatingSubleaseEntries(
        companyId: string,
        userId: string,
        subleaseData: any,
        scheduleData: any,
        dryRun: boolean
    ): Promise<string> {
        // Get operating sublease monthly template
        const template = this.journalTemplateService.getOperatingSubleaseMonthlyTemplate();

        // Prepare variables for template
        const variables = {
            receipt: Number(scheduleData.receipt),
            income: Number(scheduleData.leaseIncome)
        };

        // Apply template
        const journalId = await this.journalTemplateService.applyTemplate(
            companyId,
            userId,
            template,
            variables,
            `Operating sublease monthly posting - ${subleaseData.subleaseCode}`,
            dryRun
        );

        return journalId;
    }

    /**
     * Post initial sublease recognition entries
     */
    async postInitialRecognition(
        companyId: string,
        userId: string,
        subleaseId: string,
        dryRun: boolean = false
    ): Promise<SubleasePostingResponseType> {
        // Get sublease details
        const subleaseRecord = await this.dbInstance
            .select()
            .from(sublease)
            .where(and(
                eq(sublease.id, subleaseId),
                eq(sublease.companyId, companyId)
            ))
            .limit(1);

        if (subleaseRecord.length === 0) {
            throw new Error("Sublease not found");
        }

        const subleaseData = subleaseRecord[0]!;

        if (subleaseData.classification !== 'FINANCE') {
            throw new Error("Initial recognition only applies to finance subleases");
        }

        // Get component links to calculate ROU portion transferred
        const componentLinks = await this.dbInstance
            .select({
                proportion: leaseComponentSublet.proportion,
                componentPctOfRou: leaseComponent.pctOfRou
            })
            .from(leaseComponentSublet)
            .leftJoin(leaseComponent, eq(leaseComponentSublet.leaseComponentId, leaseComponent.id))
            .where(eq(leaseComponentSublet.subleaseId, subleaseId));

        // Calculate total ROU portion transferred
        let totalRouTransferred = 0;
        for (const link of componentLinks) {
            totalRouTransferred += Number(link.componentPctOfRou) * Number(link.proportion);
        }

        // Get initial NIS from first schedule row
        const firstSchedule = await this.dbInstance
            .select()
            .from(subleaseSchedule)
            .where(eq(subleaseSchedule.subleaseId, subleaseId))
            .orderBy(asc(subleaseSchedule.year), asc(subleaseSchedule.month))
            .limit(1);

        if (firstSchedule.length === 0) {
            throw new Error("Schedule not found for sublease");
        }

        const initialNis = Number(firstSchedule[0]!.openingNis);

        // Create journal entries
        const journalLines = [
            {
                accountCode: 'NIS',
                dc: 'DR',
                amount: initialNis,
                currency: subleaseData.ccy,
                description: `Net investment in sublease - ${subleaseData.subleaseCode}`
            },
            {
                accountCode: 'ROU',
                dc: 'CR',
                amount: initialNis,
                currency: subleaseData.ccy,
                description: `Right-of-use asset (portion transferred) - ${subleaseData.subleaseCode}`
            }
        ];

        // Post journal
        const transformedLines = journalLines.map(line => ({
            accountId: line.accountCode,
            debit: line.dc === 'DR' ? line.amount : 0,
            credit: line.dc === 'CR' ? line.amount : 0,
            description: line.description
        }));

        const journalId = await postJournal(companyId, {
            date: new Date(subleaseData.startOn),
            memo: `Initial sublease recognition - ${subleaseData.subleaseCode}`,
            lines: transformedLines
        });

        return {
            subleaseId,
            year: new Date(subleaseData.startOn).getFullYear(),
            month: new Date(subleaseData.startOn).getMonth() + 1,
            journalId: dryRun ? null : journalId.journalId,
            status: dryRun ? 'DRY_RUN' : 'POSTED',
            message: dryRun ? 'Dry run completed' : 'Initial recognition posted successfully'
        };
    }
}
