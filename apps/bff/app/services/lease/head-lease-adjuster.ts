import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    sublease,
    leaseComponentSublet,
    leaseComponent,
    leaseComponentSched,
    leaseComponentSchedDelta,
    leaseMod,
    leaseModLine,
    lease
} from "@aibos/db-adapter/schema";
import type {
    HeadLeaseAdjustmentReqType,
    HeadLeaseAdjustmentResponseType
} from "@aibos/contracts";

export class HeadLeaseAdjuster {
    constructor(private dbInstance = db) { }

    /**
     * Adjust head lease ROU when subleasing components
     */
    async adjustHeadLease(
        companyId: string,
        userId: string,
        data: HeadLeaseAdjustmentReqType
    ): Promise<HeadLeaseAdjustmentResponseType> {
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

        // Get component links
        const componentLinks = await this.dbInstance
            .select({
                id: leaseComponentSublet.id,
                leaseComponentId: leaseComponentSublet.leaseComponentId,
                proportion: leaseComponentSublet.proportion,
                method: leaseComponentSublet.method,
                // Component details
                componentCode: leaseComponent.code,
                componentName: leaseComponent.name,
                componentClass: leaseComponent.class,
                componentPctOfRou: leaseComponent.pctOfRou,
                componentUsefulLifeMonths: leaseComponent.usefulLifeMonths
            })
            .from(leaseComponentSublet)
            .leftJoin(leaseComponent, eq(leaseComponentSublet.leaseComponentId, leaseComponent.id))
            .where(eq(leaseComponentSublet.subleaseId, data.subleaseId));

        if (componentLinks.length === 0) {
            throw new Error("No component links found for sublease");
        }

        // Create modification record for head lease
        const modId = ulid();
        await this.dbInstance
            .insert(leaseMod)
            .values({
                id: modId,
                companyId,
                leaseId: subleaseData.headLeaseId,
                effectiveOn: subleaseData.startOn,
                kind: 'SCOPE',
                reason: `Sublease adjustment for ${subleaseData.subleaseCode}`,
                status: 'DRAFT',
                createdBy: userId,
                updatedBy: userId
            });

        // Create modification lines for each component
        const modLines: any[] = [];
        let totalRouReduction = 0;

        for (const link of componentLinks) {
            const rouReduction = Number(link.componentPctOfRou) * Number(link.proportion);
            totalRouReduction += rouReduction;

            modLines.push({
                id: ulid(),
                modId,
                leaseComponentId: link.leaseComponentId,
                action: 'AREA_CHANGE',
                qtyDelta: -Number(link.proportion), // Negative for reduction
                amountDelta: null,
                notes: {
                    subleaseId: data.subleaseId,
                    subleaseCode: subleaseData.subleaseCode,
                    originalProportion: link.componentPctOfRou,
                    subletProportion: link.proportion,
                    rouReduction
                },
                createdAt: new Date()
            });
        }

        if (modLines.length > 0) {
            await this.dbInstance
                .insert(leaseModLine)
                .values(modLines);
        }

        // Calculate schedule deltas for affected components
        const scheduleDeltas = await this.calculateScheduleDeltas(
            subleaseData.headLeaseId,
            componentLinks,
            subleaseData.startOn
        );

        if (scheduleDeltas.length > 0) {
            await this.dbInstance
                .insert(leaseComponentSchedDelta)
                .values(scheduleDeltas);
        }

        return {
            modId,
            subleaseId: data.subleaseId,
            headLeaseId: subleaseData.headLeaseId,
            totalRouReduction,
            affectedComponents: componentLinks.length,
            scheduleDeltas: scheduleDeltas.length,
            status: 'DRAFT'
        };
    }

    /**
     * Calculate schedule deltas for affected components
     */
    private async calculateScheduleDeltas(
        headLeaseId: string,
        componentLinks: any[],
        effectiveDate: string
    ): Promise<any[]> {
        const deltas: any[] = [];
        const effectiveDateObj = new Date(effectiveDate);

        for (const link of componentLinks) {
            // Get existing component schedule
            const existingSchedule = await this.dbInstance
                .select()
                .from(leaseComponentSched)
                .where(and(
                    eq(leaseComponentSched.leaseComponentId, link.leaseComponentId),
                    gte(leaseComponentSched.year, effectiveDateObj.getFullYear())
                ))
                .orderBy(asc(leaseComponentSched.year), asc(leaseComponentSched.month));

            // Calculate deltas for each period
            for (const scheduleRow of existingSchedule) {
                const scheduleDate = new Date(scheduleRow.year, scheduleRow.month - 1);

                // Only apply deltas from effective date onwards
                if (scheduleDate >= effectiveDateObj) {
                    const rouReduction = Number(scheduleRow.rouAmort) * Number(link.proportion);
                    const interestReduction = Number(scheduleRow.interest) * Number(link.proportion);

                    deltas.push({
                        id: ulid(),
                        leaseComponentId: link.leaseComponentId,
                        modId: null, // Will be set by caller
                        year: scheduleRow.year,
                        month: scheduleRow.month,
                        liabDelta: 0, // No liability change for scope reduction
                        rouDelta: -rouReduction, // Negative for reduction
                        interestDelta: -interestReduction, // Negative for reduction
                        notes: {
                            subletProportion: link.proportion,
                            originalRouAmort: scheduleRow.rouAmort,
                            originalInterest: scheduleRow.interest
                        },
                        createdAt: new Date()
                    });
                }
            }
        }

        return deltas;
    }

    /**
     * Revert head lease adjustment when sublease is terminated
     */
    async revertHeadLeaseAdjustment(
        companyId: string,
        userId: string,
        subleaseId: string
    ): Promise<HeadLeaseAdjustmentResponseType> {
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

        // Find existing modification for this sublease
        const existingMod = await this.dbInstance
            .select()
            .from(leaseMod)
            .where(and(
                eq(leaseMod.leaseId, subleaseData.headLeaseId),
                eq(leaseMod.kind, 'SCOPE'),
                sql`reason LIKE ${`%${subleaseData.subleaseCode}%`}`
            ))
            .limit(1);

        if (existingMod.length === 0) {
            throw new Error("No existing modification found for sublease");
        }

        const modRecord = existingMod[0]!;

        // Create reversal modification
        const reversalModId = ulid();
        await this.dbInstance
            .insert(leaseMod)
            .values({
                id: reversalModId,
                companyId,
                leaseId: subleaseData.headLeaseId,
                effectiveOn: subleaseData.endOn,
                kind: 'SCOPE',
                reason: `Sublease termination reversal for ${subleaseData.subleaseCode}`,
                status: 'DRAFT',
                createdBy: userId,
                updatedBy: userId
            });

        // Get original modification lines
        const originalLines = await this.dbInstance
            .select()
            .from(leaseModLine)
            .where(eq(leaseModLine.modId, modRecord.id));

        // Create reversal lines (opposite of original)
        const reversalLines = originalLines.map(line => ({
            id: ulid(),
            modId: reversalModId,
            leaseComponentId: line.leaseComponentId,
            action: line.action,
            qtyDelta: line.qtyDelta ? String(-Number(line.qtyDelta)) : null, // Reverse the delta
            amountDelta: line.amountDelta ? String(-Number(line.amountDelta)) : null,
            notes: {
                ...(line.notes || {}),
                reversalOf: modRecord.id,
                subleaseId
            },
            createdAt: new Date()
        }));

        if (reversalLines.length > 0) {
            await this.dbInstance
                .insert(leaseModLine)
                .values(reversalLines);
        }

        return {
            modId: reversalModId,
            subleaseId,
            headLeaseId: subleaseData.headLeaseId,
            totalRouReduction: 0, // Reversal
            affectedComponents: reversalLines.length,
            scheduleDeltas: 0, // Will be calculated separately
            status: 'DRAFT'
        };
    }
}
