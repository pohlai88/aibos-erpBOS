import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    revSchedule,
    revPob
} from "@aibos/db-adapter/schema";
import type {
    ScheduleBuildReqType,
    ScheduleQueryType,
    ScheduleResponseType
} from "@aibos/contracts";

export class RevScheduleService {
    constructor(private dbInstance = db) { }

    /**
     * Build recognition schedule for a POB
     */
    async buildSchedule(
        companyId: string,
        userId: string,
        data: ScheduleBuildReqType
    ): Promise<{ success: boolean; message: string; periods_created: number }> {
        // Get POB details
        const pobs = await this.dbInstance
            .select()
            .from(revPob)
            .where(and(
                eq(revPob.companyId, companyId),
                eq(revPob.id, data.pob_id)
            ))
            .limit(1);

        if (pobs.length === 0) {
            throw new Error("POB not found");
        }

        const pob = pobs[0]!;
        const startDate = new Date(data.start_date);
        const endDate = data.end_date ? new Date(data.end_date) : new Date(pob.endDate || startDate);

        // Calculate schedule based on method
        const scheduleEntries = this.calculateSchedule(
            pob.id,
            companyId,
            pob.allocatedAmount,
            pob.currency,
            startDate,
            endDate,
            data.method
        );

        // Insert schedule entries
        await this.dbInstance.insert(revSchedule).values(scheduleEntries);

        return {
            success: true,
            message: `Schedule built for ${scheduleEntries.length} periods`,
            periods_created: scheduleEntries.length
        };
    }

    /**
     * Calculate schedule entries based on recognition method
     */
    private calculateSchedule(
        pobId: string,
        companyId: string,
        totalAmount: string,
        currency: string,
        startDate: Date,
        endDate: Date,
        method: string
    ): any[] {
        const amount = Number(totalAmount);
        const entries: any[] = [];

        switch (method) {
            case 'POINT_IN_TIME':
                // Recognize everything on start date
                entries.push({
                    id: ulid(),
                    companyId,
                    pobId,
                    year: startDate.getFullYear(),
                    month: startDate.getMonth() + 1,
                    planned: amount,
                    recognized: 0,
                    status: 'PLANNED',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                break;

            case 'RATABLE_DAILY': {
                // Daily ratable over the period
                const dailyAmount = this.calculateDailyRatable(amount, startDate, endDate);
                let currentDate = new Date(startDate);
                let remainingAmount = amount;

                while (currentDate <= endDate && remainingAmount > 0.01) {
                    const dailyAllocation = Math.min(dailyAmount, remainingAmount);
                    remainingAmount -= dailyAllocation;

                    entries.push({
                        id: ulid(),
                        companyId,
                        pobId,
                        year: currentDate.getFullYear(),
                        month: currentDate.getMonth() + 1,
                        planned: dailyAllocation,
                        recognized: 0,
                        status: 'PLANNED',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    currentDate.setDate(currentDate.getDate() + 1);
                }
                break;
            }

            case 'RATABLE_MONTHLY': {
                // Monthly ratable over the period
                const monthlyAmount = this.calculateMonthlyRatable(amount, startDate, endDate);
                let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                let remainingAmount = amount;

                while (currentMonth <= endMonth && remainingAmount > 0.01) {
                    const monthlyAllocation = Math.min(monthlyAmount, remainingAmount);
                    remainingAmount -= monthlyAllocation;

                    entries.push({
                        id: ulid(),
                        companyId,
                        pobId,
                        year: currentMonth.getFullYear(),
                        month: currentMonth.getMonth() + 1,
                        planned: monthlyAllocation,
                        recognized: 0,
                        status: 'PLANNED',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    currentMonth.setMonth(currentMonth.getMonth() + 1);
                }
                break;
            }

            case 'USAGE':
                // Usage-based - no planned amounts, only recognized as usage occurs
                // This would be handled by usage bridge events
                break;
        }

        return entries;
    }

    /**
     * Calculate daily ratable amount
     */
    private calculateDailyRatable(totalAmount: number, startDate: Date, endDate: Date): number {
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return totalAmount / totalDays;
    }

    /**
     * Calculate monthly ratable amount
     */
    private calculateMonthlyRatable(totalAmount: number, startDate: Date, endDate: Date): number {
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const endMonth = endDate.getMonth();
        const endYear = endDate.getFullYear();

        const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
        return totalAmount / totalMonths;
    }

    /**
     * Query schedule entries
     */
    async querySchedule(
        companyId: string,
        query: ScheduleQueryType
    ): Promise<ScheduleResponseType[]> {
        const conditions = [eq(revSchedule.companyId, companyId)];

        if (query.pob_id) {
            conditions.push(eq(revSchedule.pobId, query.pob_id));
        }
        if (query.year) {
            conditions.push(eq(revSchedule.year, query.year));
        }
        if (query.month) {
            conditions.push(eq(revSchedule.month, query.month));
        }
        if (query.status) {
            conditions.push(eq(revSchedule.status, query.status));
        }

        const schedules = await this.dbInstance
            .select()
            .from(revSchedule)
            .where(and(...conditions))
            .orderBy(asc(revSchedule.year), asc(revSchedule.month))
            .limit(query.limit)
            .offset(query.offset);

        return schedules.map(schedule => ({
            id: schedule.id,
            company_id: schedule.companyId,
            pob_id: schedule.pobId,
            year: schedule.year,
            month: schedule.month,
            planned: Number(schedule.planned),
            recognized: Number(schedule.recognized),
            status: schedule.status,
            created_at: schedule.createdAt.toISOString(),
            updated_at: schedule.updatedAt.toISOString()
        }));
    }

    /**
     * Update schedule recognition amounts
     */
    async updateRecognition(
        companyId: string,
        pobId: string,
        year: number,
        month: number,
        recognizedAmount: number
    ): Promise<void> {
        const schedules = await this.dbInstance
            .select()
            .from(revSchedule)
            .where(and(
                eq(revSchedule.companyId, companyId),
                eq(revSchedule.pobId, pobId),
                eq(revSchedule.year, year),
                eq(revSchedule.month, month)
            ))
            .limit(1);

        if (schedules.length === 0) {
            throw new Error("Schedule entry not found");
        }

        const schedule = schedules[0]!;
        const newRecognized = Number(schedule.recognized) + recognizedAmount;
        const planned = Number(schedule.planned);

        let status = 'PLANNED';
        if (newRecognized >= planned) {
            status = 'DONE';
        } else if (newRecognized > 0) {
            status = 'PARTIAL';
        }

        await this.dbInstance
            .update(revSchedule)
            .set({
                recognized: newRecognized.toString(),
                status: status as 'PLANNED' | 'PARTIAL' | 'DONE',
                updatedAt: new Date()
            })
            .where(eq(revSchedule.id, schedule.id));
    }
}
