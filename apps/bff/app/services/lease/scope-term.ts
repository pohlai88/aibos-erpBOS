import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    lease,
    leaseMod,
    leaseModLine,
    leaseComponent,
    leaseComponentSchedDelta,
    leaseCashflow,
    leaseOpening
} from "@aibos/db-adapter/schema";
import type {
    LeaseModCreateReqType,
    LeaseModCreateResponseType
} from "@aibos/contracts";

export class ScopeTermService {
    constructor(private dbInstance = db) { }

    /**
     * Create a scope modification (partial termination, area change)
     */
    async createScopeModification(
        companyId: string,
        userId: string,
        data: LeaseModCreateReqType
    ): Promise<LeaseModCreateResponseType> {
        const { lease_id, effective_on, reason, lines } = data;

        // Validate lease exists
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.id, lease_id),
                eq(lease.companyId, companyId)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        // Validate scope modification lines
        for (const line of lines) {
            if (!['AREA_CHANGE', 'INCREASE', 'DECREASE'].includes(line.action)) {
                throw new Error(`Invalid action for scope modification: ${line.action}`);
            }
            if (line.action === 'AREA_CHANGE' && !line.qty_delta) {
                throw new Error("Area change requires quantity delta");
            }
        }

        // Create modification header
        const modId = ulid();
        await this.dbInstance.insert(leaseMod).values({
            id: modId,
            companyId,
            leaseId: lease_id,
            effectiveOn: effective_on,
            kind: 'SCOPE',
            reason,
            status: 'DRAFT',
            createdBy: userId,
            updatedBy: userId
        });

        // Create modification lines
        for (const line of lines) {
            await this.dbInstance.insert(leaseModLine).values({
                id: ulid(),
                modId,
                leaseComponentId: line.lease_component_id,
                action: line.action,
                qtyDelta: line.qty_delta?.toString(),
                amountDelta: line.amount_delta?.toString(),
                notes: line.notes ? JSON.stringify(line.notes) : null
            });
        }

        return {
            mod_id: modId,
            lease_id,
            status: 'DRAFT',
            created_at: new Date().toISOString()
        };
    }

    /**
     * Create a term modification (extension/shortening)
     */
    async createTermModification(
        companyId: string,
        userId: string,
        data: LeaseModCreateReqType
    ): Promise<LeaseModCreateResponseType> {
        const { lease_id, effective_on, reason, lines } = data;

        // Validate lease exists
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(and(
                eq(lease.id, lease_id),
                eq(lease.companyId, companyId)
            ))
            .limit(1);

        if (leaseData.length === 0) {
            throw new Error("Lease not found");
        }

        // Validate term modification lines
        for (const line of lines) {
            if (!['EXTEND', 'SHORTEN'].includes(line.action)) {
                throw new Error(`Invalid action for term modification: ${line.action}`);
            }
        }

        // Create modification header
        const modId = ulid();
        await this.dbInstance.insert(leaseMod).values({
            id: modId,
            companyId,
            leaseId: lease_id,
            effectiveOn: effective_on,
            kind: 'TERM',
            reason,
            status: 'DRAFT',
            createdBy: userId,
            updatedBy: userId
        });

        // Create modification lines
        for (const line of lines) {
            await this.dbInstance.insert(leaseModLine).values({
                id: ulid(),
                modId,
                action: line.action,
                qtyDelta: line.qty_delta?.toString(), // months delta
                amountDelta: line.amount_delta?.toString(),
                notes: line.notes ? JSON.stringify(line.notes) : null
            });
        }

        return {
            mod_id: modId,
            lease_id,
            status: 'DRAFT',
            created_at: new Date().toISOString()
        };
    }

    /**
     * Apply scope modification
     */
    async applyScopeModification(
        companyId: string,
        userId: string,
        modId: string
    ): Promise<void> {
        // Get modification details
        const modData = await this.dbInstance
            .select()
            .from(leaseMod)
            .where(and(
                eq(leaseMod.id, modId),
                eq(leaseMod.companyId, companyId),
                eq(leaseMod.kind, 'SCOPE')
            ))
            .limit(1);

        if (modData.length === 0) {
            throw new Error("Scope modification not found");
        }

        const modification = modData[0]!;

        // Get modification lines
        const modLines = await this.dbInstance
            .select()
            .from(leaseModLine)
            .where(eq(leaseModLine.modId, modId));

        if (modLines.length === 0) {
            throw new Error("No scope modification lines found");
        }

        // Get lease components
        const components = await this.dbInstance
            .select()
            .from(leaseComponent)
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseComponent.leaseId, modification.leaseId),
                eq(leaseComponent.status, 'ACTIVE')
            ));

        const effectiveDate = new Date(modification.effectiveOn);
        const currentYear = effectiveDate.getFullYear();
        const currentMonth = effectiveDate.getMonth() + 1;

        // Apply scope changes
        for (const line of modLines) {
            if (line.action === 'AREA_CHANGE' && line.leaseComponentId) {
                const qtyDelta = Number(line.qtyDelta || 0);
                const amountDelta = Number(line.amountDelta || 0);

                // Calculate proportional adjustment
                const component = components.find(c => c.id === line.leaseComponentId);
                if (component) {
                    const currentCarrying = Number(component.pctOfRou);
                    const adjustmentRatio = qtyDelta / currentCarrying;
                    
                    // Create schedule delta
                    await this.dbInstance.insert(leaseComponentSchedDelta).values({
                        id: ulid(),
                        leaseComponentId: line.leaseComponentId,
                        modId,
                        year: currentYear,
                        month: currentMonth,
                        liabDelta: amountDelta.toString(),
                        rouDelta: amountDelta.toString(),
                        interestDelta: "0",
                        notes: JSON.stringify({
                            scope_change: true,
                            qty_delta: qtyDelta,
                            amount_delta: amountDelta,
                            adjustment_ratio: adjustmentRatio
                        })
                    });
                }
            } else if (line.action === 'DECREASE' && line.leaseComponentId) {
                // Partial termination - derecognize component
                const derecognitionAmount = Number(line.amountDelta || 0);
                
                await this.dbInstance.insert(leaseComponentSchedDelta).values({
                    id: ulid(),
                    leaseComponentId: line.leaseComponentId,
                    modId,
                    year: currentYear,
                    month: currentMonth,
                    liabDelta: (-derecognitionAmount).toString(),
                    rouDelta: (-derecognitionAmount).toString(),
                    interestDelta: "0",
                    notes: JSON.stringify({
                        partial_termination: true,
                        derecognition_amount: derecognitionAmount
                    })
                });

                // Mark component as closed
                await this.dbInstance
                    .update(leaseComponent)
                    .set({
                        status: 'CLOSED',
                        updatedAt: new Date(),
                        updatedBy: userId
                    })
                    .where(eq(leaseComponent.id, line.leaseComponentId));
            }
        }

        // Update modification status
        await this.dbInstance
            .update(leaseMod)
            .set({
                status: 'APPLIED',
                updatedAt: new Date(),
                updatedBy: userId
            })
            .where(eq(leaseMod.id, modId));
    }

    /**
     * Apply term modification
     */
    async applyTermModification(
        companyId: string,
        userId: string,
        modId: string
    ): Promise<void> {
        // Get modification details
        const modData = await this.dbInstance
            .select()
            .from(leaseMod)
            .where(and(
                eq(leaseMod.id, modId),
                eq(leaseMod.companyId, companyId),
                eq(leaseMod.kind, 'TERM')
            ))
            .limit(1);

        if (modData.length === 0) {
            throw new Error("Term modification not found");
        }

        const modification = modData[0]!;

        // Get modification lines
        const modLines = await this.dbInstance
            .select()
            .from(leaseModLine)
            .where(eq(leaseModLine.modId, modId));

        if (modLines.length === 0) {
            throw new Error("No term modification lines found");
        }

        // Calculate total term change
        let totalTermDelta = 0;
        for (const line of modLines) {
            if (line.action === 'EXTEND' || line.action === 'SHORTEN') {
                const monthsDelta = Number(line.qtyDelta || 0);
                totalTermDelta += line.action === 'EXTEND' ? monthsDelta : -monthsDelta;
            }
        }

        // Update lease end date
        const leaseData = await this.dbInstance
            .select()
            .from(lease)
            .where(eq(lease.id, modification.leaseId))
            .limit(1);

        if (leaseData.length > 0) {
            const currentEndDate = new Date(leaseData[0]!.endOn);
            const newEndDate = new Date(currentEndDate);
            newEndDate.setMonth(newEndDate.getMonth() + totalTermDelta);

            await this.dbInstance
                .update(lease)
                .set({
                    endOn: newEndDate.toISOString().split('T')[0]!,
                    updatedAt: new Date(),
                    updatedBy: userId
                })
                .where(eq(lease.id, modification.leaseId));
        }

        // Update component end dates
        const components = await this.dbInstance
            .select()
            .from(leaseComponent)
            .where(and(
                eq(leaseComponent.companyId, companyId),
                eq(leaseComponent.leaseId, modification.leaseId),
                eq(leaseComponent.status, 'ACTIVE')
            ));

        for (const component of components) {
            const currentEndDate = new Date(component.endOn);
            const newEndDate = new Date(currentEndDate);
            newEndDate.setMonth(newEndDate.getMonth() + totalTermDelta);

            await this.dbInstance
                .update(leaseComponent)
                .set({
                    endOn: newEndDate.toISOString().split('T')[0]!,
                    updatedAt: new Date(),
                    updatedBy: userId
                })
                .where(eq(leaseComponent.id, component.id));
        }

        // Update modification status
        await this.dbInstance
            .update(leaseMod)
            .set({
                status: 'APPLIED',
                updatedAt: new Date(),
                updatedBy: userId
            })
            .where(eq(leaseMod.id, modId));
    }

    /**
     * Calculate derecognition amount for partial termination
     */
    async calculateDerecognitionAmount(
        companyId: string,
        leaseId: string,
        componentId: string,
        effectiveDate: string
    ): Promise<{
        liability_amount: number;
        rou_amount: number;
        gain_loss: number;
    }> {
        // Get component details
        const component = await this.dbInstance
            .select()
            .from(leaseComponent)
            .where(and(
                eq(leaseComponent.id, componentId),
                eq(leaseComponent.companyId, companyId)
            ))
            .limit(1);

        if (component.length === 0) {
            throw new Error("Component not found");
        }

        const comp = component[0]!;

        // Calculate carrying amounts at effective date
        // This would typically involve calculating from component schedules
        // For now, using proportional allocation based on component percentage
        const componentPct = Number(comp.pctOfRou);
        
        // Get lease opening measures
        const opening = await this.dbInstance
            .select()
            .from(leaseOpening)
            .where(eq(leaseOpening.leaseId, leaseId))
            .limit(1);

        if (opening.length === 0) {
            throw new Error("Opening measures not found");
        }

        const initialLiability = Number(opening[0]!.initialLiability);
        const initialRou = Number(opening[0]!.initialRou);

        // Calculate proportional amounts (simplified - would need proper schedule calculation)
        const liabilityAmount = initialLiability * componentPct;
        const rouAmount = initialRou * componentPct;

        // Calculate gain/loss (difference between carrying amounts)
        const gainLoss = rouAmount - liabilityAmount;

        return {
            liability_amount: liabilityAmount,
            rou_amount: rouAmount,
            gain_loss: gainLoss
        };
    }

    /**
     * Get scope modifications for a lease
     */
    async getScopeModifications(
        companyId: string,
        leaseId: string
    ): Promise<Array<{
        mod_id: string;
        effective_on: string;
        reason: string;
        status: string;
        scope_changes: Array<{
            component_id: string;
            component_code: string;
            action: string;
            qty_delta: number;
            amount_delta: number;
        }>;
        created_at: string;
    }>> {
        const modifications = await this.dbInstance
            .select({
                id: leaseMod.id,
                effectiveOn: leaseMod.effectiveOn,
                reason: leaseMod.reason,
                status: leaseMod.status,
                createdAt: leaseMod.createdAt
            })
            .from(leaseMod)
            .where(and(
                eq(leaseMod.companyId, companyId),
                eq(leaseMod.leaseId, leaseId),
                eq(leaseMod.kind, 'SCOPE')
            ))
            .orderBy(desc(leaseMod.effectiveOn));

        const result = [];
        for (const mod of modifications) {
            // Get modification lines
            const lines = await this.dbInstance
                .select({
                    leaseComponentId: leaseModLine.leaseComponentId,
                    action: leaseModLine.action,
                    qtyDelta: leaseModLine.qtyDelta,
                    amountDelta: leaseModLine.amountDelta
                })
                .from(leaseModLine)
                .where(eq(leaseModLine.modId, mod.id));

            const scopeChanges = [];
            for (const line of lines) {
                if (line.leaseComponentId) {
                    // Get component details
                    const component = await this.dbInstance
                        .select({
                            code: leaseComponent.code
                        })
                        .from(leaseComponent)
                        .where(eq(leaseComponent.id, line.leaseComponentId))
                        .limit(1);

                    scopeChanges.push({
                        component_id: line.leaseComponentId,
                        component_code: component[0]?.code || 'Unknown',
                        action: line.action,
                        qty_delta: Number(line.qtyDelta || 0),
                        amount_delta: Number(line.amountDelta || 0)
                    });
                }
            }

            result.push({
                mod_id: mod.id,
                effective_on: mod.effectiveOn,
                reason: mod.reason,
                status: mod.status,
                scope_changes: scopeChanges,
                created_at: mod.createdAt.toISOString()
            });
        }

        return result;
    }
}
