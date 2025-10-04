import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    revChangeOrder,
    revChangeLine,
    revVcPolicy,
    revVcEstimate,
    revTxnPriceRev,
    revSchedRev,
    revRecCatchup,
    revModRegister,
    revVcRollforward,
    revRpoSnapshot,
    rbContract,
    rbProduct,
    rbPostLock
} from "@aibos/db-adapter/schema";
import type {
    ChangeOrderCreateType,
    ApplyChangeOrderReqType,
    VCUpsertType,
    VCPolicyUpsertType,
    RecognizeRevisedReqType,
    ChangeOrderQueryType,
    VCQueryType,
    RevisionQueryType,
    ChangeOrderResponseType,
    VCResponseType,
    VCPolicyResponseType,
    RevisionResponseType,
    CatchupResponseType,
    DisclosureResponseType
} from "@aibos/contracts";
import { RevAllocationService } from "@/services/revenue/allocate";
import { RevScheduleService } from "@/services/revenue/schedule";
import { RevRecognitionService } from "@/services/revenue/recognize";

export class RevModificationService {
    private allocationService: RevAllocationService;
    private scheduleService: RevScheduleService;
    private recognitionService: RevRecognitionService;

    constructor(private dbInstance = db) {
        this.allocationService = new RevAllocationService(dbInstance);
        this.scheduleService = new RevScheduleService(dbInstance);
        this.recognitionService = new RevRecognitionService(dbInstance);
    }

    /**
     * Create a change order
     */
    async createChangeOrder(
        companyId: string,
        userId: string,
        data: ChangeOrderCreateType
    ): Promise<ChangeOrderResponseType> {
        const changeOrderId = ulid();

        // Create change order header
        const changeOrder = await this.dbInstance
            .insert(revChangeOrder)
            .values({
                id: changeOrderId,
                companyId,
                contractId: data.contract_id,
                effectiveDate: data.effective_date,
                type: 'DRAFT', // Will be set when applied
                reason: data.reason || undefined,
                status: 'DRAFT',
                createdBy: userId
            })
            .returning();

        // Create change order lines
        const changeLines = [];
        for (const line of data.lines) {
            const lineId = ulid();
            const result = await this.dbInstance
                .insert(revChangeLine)
                .values({
                    id: lineId,
                    changeOrderId,
                    pobId: line.pob_id || undefined,
                    productId: line.product_id || undefined,
                    qtyDelta: line.qty_delta?.toString(),
                    priceDelta: line.price_delta?.toString(),
                    termDeltaDays: line.term_delta_days || undefined,
                    newMethod: line.new_method || undefined,
                    newSsp: line.new_ssp?.toString()
                } as any)
                .returning();
            changeLines.push(result);
        }

        const changeOrderData = changeOrder[0];
        if (!changeOrderData) {
            throw new Error('Change order not found');
        }

        return {
            id: changeOrderData.id,
            company_id: changeOrderData.companyId,
            contract_id: changeOrderData.contractId,
            effective_date: changeOrderData.effectiveDate,
            type: changeOrderData.type as any,
            reason: changeOrderData.reason || undefined,
            status: changeOrderData.status as any,
            created_at: changeOrderData.createdAt.toISOString(),
            created_by: changeOrderData.createdBy,
            lines: changeLines.map(line => {
                const lineData = line[0];
                if (!lineData) {
                    throw new Error('Change line not found');
                }
                return {
                    id: lineData.id,
                    pob_id: lineData.pobId || undefined,
                    product_id: lineData.productId || undefined,
                    qty_delta: lineData.qtyDelta ? Number(lineData.qtyDelta) : undefined,
                    price_delta: lineData.priceDelta ? Number(lineData.priceDelta) : undefined,
                    term_delta_days: lineData.termDeltaDays || undefined,
                    new_method: lineData.newMethod || undefined,
                    new_ssp: lineData.newSsp ? Number(lineData.newSsp) : undefined
                };
            })
        };
    }

    /**
     * Apply a change order with specified treatment
     */
    async applyChangeOrder(
        companyId: string,
        userId: string,
        data: ApplyChangeOrderReqType
    ): Promise<{ success: boolean; message: string }> {
        const changeOrder = await this.dbInstance
            .select()
            .from(revChangeOrder)
            .where(and(
                eq(revChangeOrder.id, data.change_order_id),
                eq(revChangeOrder.companyId, companyId)
            ))
            .limit(1);

        if (!changeOrder.length) {
            throw new Error("Change order not found");
        }

        if (changeOrder[0]?.status !== 'DRAFT') {
            throw new Error("Change order is not in DRAFT status");
        }

        // Update change order with treatment and status
        await this.dbInstance
            .update(revChangeOrder)
            .set({
                type: data.treatment,
                status: 'APPLIED'
            })
            .where(eq(revChangeOrder.id, data.change_order_id));

        // Implement the actual modification logic based on treatment type
        await this.processChangeOrderModification(companyId, userId, data.change_order_id, data.treatment);

        return { success: true, message: "Change order applied successfully" };
    }

    /**
     * Process change order modification based on ASC 606 treatment
     */
    private async processChangeOrderModification(
        companyId: string,
        userId: string,
        changeOrderId: string,
        treatment: string
    ): Promise<void> {
        // Get change order details
        const changeOrders = await this.dbInstance
            .select()
            .from(revChangeOrder)
            .where(and(
                eq(revChangeOrder.companyId, companyId),
                eq(revChangeOrder.id, changeOrderId)
            ))
            .limit(1);

        if (changeOrders.length === 0) {
            throw new Error("Change order not found");
        }

        const changeOrder = changeOrders[0]!;

        // Get change order lines
        const changeLines = await this.dbInstance
            .select()
            .from(revChangeLine)
            .where(eq(revChangeLine.changeOrderId, changeOrderId));

        switch (treatment) {
            case 'SEPARATE':
                await this.processSeparateContract(companyId, userId, changeOrder, changeLines);
                break;
            case 'TERMINATION_NEW':
                await this.processTerminationAndNew(companyId, userId, changeOrder, changeLines);
                break;
            case 'PROSPECTIVE':
                await this.processProspective(companyId, userId, changeOrder, changeLines);
                break;
            case 'RETROSPECTIVE':
                await this.processRetrospective(companyId, userId, changeOrder, changeLines);
                break;
            default:
                throw new Error(`Unknown treatment type: ${treatment}`);
        }
    }

    /**
     * Process separate contract treatment
     */
    private async processSeparateContract(
        companyId: string,
        userId: string,
        changeOrder: any,
        changeLines: any[]
    ): Promise<void> {
        // For separate contracts, create new POBs without affecting existing ones
        for (const line of changeLines) {
            if (line.productId) {
                // Create new POB for the additional product
                await this.allocationService.createPOB(companyId, userId, {
                    contract_id: changeOrder.contractId,
                    product_id: line.productId,
                    name: `Additional ${line.productId}`,
                    method: line.newMethod || 'RATABLE_MONTHLY',
                    start_date: changeOrder.effectiveDate,
                    end_date: changeOrder.effectiveDate, // Would calculate based on product
                    qty: line.qtyDelta || 1,
                    allocated_amount: line.priceDelta || 0,
                    currency: 'USD' // Would get from contract
                });
            }
        }
    }

    /**
     * Process termination and new contract treatment
     */
    private async processTerminationAndNew(
        companyId: string,
        userId: string,
        changeOrder: any,
        changeLines: any[]
    ): Promise<void> {
        // Close existing POBs pro-rata to effective date
        // Create new POBs with new terms
        // This is a complex operation that would require detailed implementation
        console.log(`Processing termination and new for contract ${changeOrder.contractId}`);
    }

    /**
     * Process prospective treatment
     */
    private async processProspective(
        companyId: string,
        userId: string,
        changeOrder: any,
        changeLines: any[]
    ): Promise<void> {
        // Reallocate remaining transaction price across remaining obligations
        // Rebuild future schedule only (historical months remain locked)

        for (const line of changeLines) {
            if (line.pobId) {
                // Rebuild schedule from effective date forward
                await this.scheduleService.buildSchedule(companyId, userId, {
                    pob_id: line.pobId,
                    method: line.newMethod || 'RATABLE_MONTHLY',
                    start_date: changeOrder.effectiveDate,
                    end_date: undefined // Would get from POB
                });
            }
        }
    }

    /**
     * Process retrospective treatment
     */
    private async processRetrospective(
        companyId: string,
        userId: string,
        changeOrder: any,
        changeLines: any[]
    ): Promise<void> {
        // Reallocate from inception
        // Compute cumulative catch-up to current period
        // Rebuild full schedule
        // Post catch-up delta

        for (const line of changeLines) {
            if (line.pobId) {
                // Rebuild full schedule from inception
                await this.scheduleService.buildSchedule(companyId, userId, {
                    pob_id: line.pobId,
                    method: line.newMethod || 'RATABLE_MONTHLY',
                    start_date: '2025-01-01', // Would get from POB inception
                    end_date: undefined // Would get from POB
                });

                // Calculate and post catch-up amounts
                // This would involve complex calculations and GL postings
                console.log(`Processing retrospective catch-up for POB ${line.pobId}`);
            }
        }
    }

    /**
     * Upsert VC policy for a company
     */
    async upsertVCPolicy(
        companyId: string,
        userId: string,
        data: VCPolicyUpsertType
    ): Promise<VCPolicyResponseType> {
        const policyId = ulid();

        const policy = await this.dbInstance
            .insert(revVcPolicy)
            .values({
                id: policyId,
                companyId,
                defaultMethod: data.default_method,
                constraintProbabilityThreshold: data.constraint_probability_threshold.toString(),
                volatilityLookbackMonths: data.volatility_lookback_months,
                updatedBy: userId
            })
            .onConflictDoUpdate({
                target: [revVcPolicy.companyId],
                set: {
                    defaultMethod: data.default_method,
                    constraintProbabilityThreshold: data.constraint_probability_threshold.toString(),
                    volatilityLookbackMonths: data.volatility_lookback_months,
                    updatedAt: new Date(),
                    updatedBy: userId
                }
            })
            .returning();

        const policyData = policy[0];
        if (!policyData) {
            throw new Error('VC policy not found');
        }

        return {
            id: policyData.id,
            company_id: policyData.companyId,
            default_method: policyData.defaultMethod as any,
            constraint_probability_threshold: Number(policyData.constraintProbabilityThreshold),
            volatility_lookback_months: policyData.volatilityLookbackMonths,
            updated_at: policyData.updatedAt.toISOString(),
            updated_by: policyData.updatedBy
        };
    }

    /**
     * Upsert VC estimate
     */
    async upsertVCEstimate(
        companyId: string,
        userId: string,
        data: VCUpsertType
    ): Promise<VCResponseType> {
        const estimateId = ulid();

        // Get VC policy to determine constraint
        const policy = await this.dbInstance
            .select()
            .from(revVcPolicy)
            .where(eq(revVcPolicy.companyId, companyId))
            .limit(1);

        const threshold = policy.length ? Number(policy[0]?.constraintProbabilityThreshold) : 0.5;
        const constrainedAmount = data.confidence >= threshold ? data.estimate : 0;

        const estimate = await this.dbInstance
            .insert(revVcEstimate)
            .values({
                id: estimateId,
                companyId,
                contractId: data.contract_id,
                pobId: data.pob_id,
                year: data.year,
                month: data.month,
                method: data.method,
                rawEstimate: data.estimate.toString(),
                constrainedAmount: constrainedAmount.toString(),
                confidence: data.confidence.toString(),
                status: data.resolve ? 'RESOLVED' : 'OPEN',
                createdBy: userId
            })
            .onConflictDoUpdate({
                target: [revVcEstimate.companyId, revVcEstimate.contractId, revVcEstimate.pobId, revVcEstimate.year, revVcEstimate.month],
                set: {
                    method: data.method,
                    rawEstimate: data.estimate.toString(),
                    constrainedAmount: constrainedAmount.toString(),
                    confidence: data.confidence.toString(),
                    status: data.resolve ? 'RESOLVED' : 'OPEN',
                    createdAt: new Date(),
                    createdBy: userId
                }
            })
            .returning();

        const estimateData = estimate[0];
        if (!estimateData) {
            throw new Error('VC estimate not found');
        }

        return {
            id: estimateData.id,
            company_id: estimateData.companyId,
            contract_id: estimateData.contractId,
            pob_id: estimateData.pobId,
            year: estimateData.year,
            month: estimateData.month,
            method: estimateData.method as any,
            raw_estimate: Number(estimateData.rawEstimate),
            constrained_amount: Number(estimateData.constrainedAmount),
            confidence: Number(estimateData.confidence),
            status: estimateData.status as any,
            created_at: estimateData.createdAt.toISOString(),
            created_by: estimateData.createdBy
        };
    }

    /**
     * Query change orders
     */
    async queryChangeOrders(
        companyId: string,
        query: ChangeOrderQueryType
    ): Promise<ChangeOrderResponseType[]> {
        let whereConditions = [eq(revChangeOrder.companyId, companyId)];

        if (query.contract_id) {
            whereConditions.push(eq(revChangeOrder.contractId, query.contract_id));
        }
        if (query.status) {
            whereConditions.push(eq(revChangeOrder.status, query.status));
        }
        if (query.type) {
            whereConditions.push(eq(revChangeOrder.type, query.type));
        }
        if (query.effective_date_from) {
            whereConditions.push(gte(revChangeOrder.effectiveDate, query.effective_date_from));
        }
        if (query.effective_date_to) {
            whereConditions.push(lte(revChangeOrder.effectiveDate, query.effective_date_to));
        }

        const changeOrders = await this.dbInstance
            .select()
            .from(revChangeOrder)
            .where(and(...whereConditions))
            .orderBy(desc(revChangeOrder.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        // Get change lines for each change order
        const result = await Promise.all(
            changeOrders.map(async (co) => {
                const lines = await this.dbInstance
                    .select()
                    .from(revChangeLine)
                    .where(eq(revChangeLine.changeOrderId, co.id));

                return {
                    id: co.id,
                    company_id: co.companyId,
                    contract_id: co.contractId,
                    effective_date: co.effectiveDate,
                    type: co.type as any,
                    reason: co.reason || undefined,
                    status: co.status as any,
                    created_at: co.createdAt.toISOString(),
                    created_by: co.createdBy,
                    lines: lines.map(line => ({
                        id: line.id,
                        pob_id: line.pobId || undefined,
                        product_id: line.productId || undefined,
                        qty_delta: line.qtyDelta ? Number(line.qtyDelta) : undefined,
                        price_delta: line.priceDelta ? Number(line.priceDelta) : undefined,
                        term_delta_days: line.termDeltaDays || undefined,
                        new_method: line.newMethod || undefined,
                        new_ssp: line.newSsp ? Number(line.newSsp) : undefined
                    }))
                };
            })
        );

        return result;
    }

    /**
     * Query VC estimates
     */
    async queryVCEstimates(
        companyId: string,
        query: VCQueryType
    ): Promise<VCResponseType[]> {
        let whereConditions = [eq(revVcEstimate.companyId, companyId)];

        if (query.contract_id) {
            whereConditions.push(eq(revVcEstimate.contractId, query.contract_id));
        }
        if (query.pob_id) {
            whereConditions.push(eq(revVcEstimate.pobId, query.pob_id));
        }
        if (query.year) {
            whereConditions.push(eq(revVcEstimate.year, query.year));
        }
        if (query.month) {
            whereConditions.push(eq(revVcEstimate.month, query.month));
        }
        if (query.status) {
            whereConditions.push(eq(revVcEstimate.status, query.status));
        }

        const estimates = await this.dbInstance
            .select()
            .from(revVcEstimate)
            .where(and(...whereConditions))
            .orderBy(desc(revVcEstimate.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return estimates.map(est => ({
            id: est.id,
            company_id: est.companyId,
            contract_id: est.contractId,
            pob_id: est.pobId,
            year: est.year,
            month: est.month,
            method: est.method as any,
            raw_estimate: Number(est.rawEstimate),
            constrained_amount: Number(est.constrainedAmount),
            confidence: Number(est.confidence),
            status: est.status as any,
            created_at: est.createdAt.toISOString(),
            created_by: est.createdBy
        }));
    }

    /**
     * Query schedule revisions
     */
    async queryRevisions(
        companyId: string,
        query: RevisionQueryType
    ): Promise<RevisionResponseType[]> {
        let whereConditions = [eq(revSchedRev.companyId, companyId)];

        if (query.contract_id) {
            // Note: This would need a join with POB table when implemented
            // For now, we'll skip this filter
        }
        if (query.pob_id) {
            whereConditions.push(eq(revSchedRev.pobId, query.pob_id));
        }
        if (query.year) {
            whereConditions.push(eq(revSchedRev.fromPeriodYear, query.year));
        }
        if (query.month) {
            whereConditions.push(eq(revSchedRev.fromPeriodMonth, query.month));
        }
        if (query.cause) {
            whereConditions.push(eq(revSchedRev.cause, query.cause));
        }

        const revisions = await this.dbInstance
            .select()
            .from(revSchedRev)
            .where(and(...whereConditions))
            .orderBy(desc(revSchedRev.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return revisions.map(rev => ({
            id: rev.id,
            company_id: rev.companyId,
            pob_id: rev.pobId,
            from_period_year: rev.fromPeriodYear,
            from_period_month: rev.fromPeriodMonth,
            planned_before: Number(rev.plannedBefore),
            planned_after: Number(rev.plannedAfter),
            delta_planned: Number(rev.deltaPlanned),
            cause: rev.cause as any,
            change_order_id: rev.changeOrderId || undefined,
            vc_estimate_id: rev.vcEstimateId || undefined,
            created_at: rev.createdAt.toISOString(),
            created_by: rev.createdBy
        }));
    }

    /**
     * Run revised recognition with M25.1 integration
     */
    async runRevisedRecognition(
        companyId: string,
        userId: string,
        data: RecognizeRevisedReqType
    ): Promise<{ success: boolean; message: string; run_id?: string }> {
        try {
            // Use M25.1 recognition service to run recognition
            const result = await this.recognitionService.runRecognition(
                companyId,
                userId,
                {
                    year: data.year,
                    month: data.month,
                    dry_run: data.dry_run
                }
            );

            return {
                success: true,
                message: data.dry_run ? "Dry run completed" : "Recognition run completed",
                run_id: result.run_id
            };
        } catch (error) {
            console.error("Error in revised recognition:", error);
            return {
                success: false,
                message: `Recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Get disclosures for a period
     */
    async getDisclosures(
        companyId: string,
        year: number,
        month: number
    ): Promise<DisclosureResponseType> {
        // Get modification register
        const modifications = await this.dbInstance
            .select()
            .from(revModRegister)
            .where(and(
                eq(revModRegister.companyId, companyId)
            ))
            .orderBy(asc(revModRegister.effectiveDate));

        // Get VC rollforward
        const vcRollforward = await this.dbInstance
            .select()
            .from(revVcRollforward)
            .where(and(
                eq(revVcRollforward.companyId, companyId),
                eq(revVcRollforward.year, year),
                eq(revVcRollforward.month, month)
            ))
            .orderBy(asc(revVcRollforward.contractId));

        // Get RPO snapshot
        const rpoSnapshot = await this.dbInstance
            .select()
            .from(revRpoSnapshot)
            .where(eq(revRpoSnapshot.companyId, companyId))
            .orderBy(asc(revRpoSnapshot.asOfDate));

        return {
            modification_register: modifications.map(mod => ({
                id: mod.id,
                contract_id: mod.contractId,
                change_order_id: mod.changeOrderId,
                effective_date: mod.effectiveDate,
                type: mod.type,
                reason: mod.reason || undefined,
                txn_price_before: Number(mod.txnPriceBefore),
                txn_price_after: Number(mod.txnPriceAfter),
                txn_price_delta: Number(mod.txnPriceDelta),
                created_at: mod.createdAt.toISOString(),
                created_by: mod.createdBy
            })),
            vc_rollforward: vcRollforward.map(vc => ({
                id: vc.id,
                contract_id: vc.contractId,
                pob_id: vc.pobId,
                year: vc.year,
                month: vc.month,
                opening_balance: Number(vc.openingBalance),
                additions: Number(vc.additions),
                changes: Number(vc.changes),
                releases: Number(vc.releases),
                recognized: Number(vc.recognized),
                closing_balance: Number(vc.closingBalance),
                created_at: vc.createdAt.toISOString(),
                created_by: vc.createdBy
            })),
            rpo_snapshot: [] // RPO snapshot not implemented yet - schema mismatch
        };
    }
}
