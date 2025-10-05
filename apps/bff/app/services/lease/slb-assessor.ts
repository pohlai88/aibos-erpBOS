import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    slbTxn,
    slbAllocation,
    slbMeasure,
    lease
} from "@aibos/db-adapter/schema";
import { EvidencePackService } from "./evidence-pack-service";
import type {
    SlbCreateReqType,
    SlbCreateResponseType,
    SlbQueryType,
    SlbDetailResponseType
} from "@aibos/contracts";

export class SlbAssessor {
    private evidencePackService: EvidencePackService;

    constructor(private dbInstance = db) {
        this.evidencePackService = new EvidencePackService();
    }

    /**
     * Create a new sale-and-leaseback transaction
     */
    async createSlbTransaction(
        companyId: string,
        userId: string,
        data: SlbCreateReqType
    ): Promise<SlbCreateResponseType> {
        const slbId = ulid();

        // Validate leaseback lease if provided
        if (data.leasebackId) {
            const leasebackLease = await this.dbInstance
                .select()
                .from(lease)
                .where(and(
                    eq(lease.id, data.leasebackId),
                    eq(lease.companyId, companyId),
                    eq(lease.status, 'ACTIVE')
                ))
                .limit(1);

            if (leasebackLease.length === 0) {
                throw new Error("Leaseback lease not found or not active");
            }
        }

        // Assess transfer of control (MFRS 15)
        const controlAssessment = await this.assessTransferOfControl(data);

        // Create SLB transaction record
        await this.dbInstance
            .insert(slbTxn)
            .values({
                id: slbId,
                companyId,
                assetId: data.assetId || null,
                assetDesc: data.assetDesc,
                saleDate: data.saleDate,
                salePrice: String(data.salePrice),
                fmv: String(data.fmv),
                ccy: data.ccy,
                controlTransferred: controlAssessment.controlTransferred,
                leasebackId: data.leasebackId || null,
                status: 'DRAFT',
                createdBy: userId,
                updatedBy: userId
            });

        // Record fair value adjustments if any
        if (data.adjustments && data.adjustments.length > 0) {
            const adjustmentInserts = data.adjustments.map(adj => ({
                id: ulid(),
                slbId,
                adjKind: adj.kind,
                amount: String(adj.amount),
                memo: adj.memo || null,
                createdBy: userId
            }));

            await this.dbInstance
                .insert(slbMeasure)
                .values(adjustmentInserts);
        }

        // Create evidence pack for SLB transaction
        try {
            await this.evidencePackService.createSlbEvidencePack(
                companyId,
                userId,
                slbId,
                {
                    saleContract: `Sale contract for ${data.assetDesc}`,
                    leasebackAgreement: data.leasebackId ? `Leaseback agreement: ${data.leasebackId}` : 'No leaseback',
                    fairValueAssessment: `FMV: ${data.fmv}, Sale Price: ${data.salePrice}`,
                    controlTransferMemo: `Control transferred: ${controlAssessment.controlTransferred}`,
                    gainCalculation: `Gain calculation pending measurement`
                }
            );
        } catch (error) {
            console.warn('Failed to create evidence pack for SLB transaction:', error);
            // Don't fail the SLB creation if evidence pack fails
        }

        return {
            slbId,
            controlTransferred: controlAssessment.controlTransferred,
            status: 'DRAFT',
            assessment: controlAssessment
        };
    }

    /**
     * Query SLB transactions with filters
     */
    async querySlbTransactions(
        companyId: string,
        query: SlbQueryType
    ): Promise<SlbDetailResponseType[]> {
        const conditions = [eq(slbTxn.companyId, companyId)];

        if (query.assetId) {
            conditions.push(eq(slbTxn.assetId, query.assetId));
        }

        if (query.status) {
            conditions.push(eq(slbTxn.status, query.status));
        }

        if (query.saleDateFrom) {
            conditions.push(gte(slbTxn.saleDate, query.saleDateFrom));
        }

        if (query.saleDateTo) {
            conditions.push(lte(slbTxn.saleDate, query.saleDateTo));
        }

        if (query.controlTransferred !== undefined) {
            conditions.push(eq(slbTxn.controlTransferred, query.controlTransferred));
        }

        const results = await this.dbInstance
            .select({
                id: slbTxn.id,
                assetId: slbTxn.assetId,
                assetDesc: slbTxn.assetDesc,
                saleDate: slbTxn.saleDate,
                salePrice: slbTxn.salePrice,
                fmv: slbTxn.fmv,
                ccy: slbTxn.ccy,
                controlTransferred: slbTxn.controlTransferred,
                leasebackId: slbTxn.leasebackId,
                status: slbTxn.status,
                createdAt: slbTxn.createdAt,
                createdBy: slbTxn.createdBy,
                // Leaseback details
                leasebackCode: lease.leaseCode,
                leasebackLessor: lease.lessor
            })
            .from(slbTxn)
            .leftJoin(lease, eq(slbTxn.leasebackId, lease.id))
            .where(and(...conditions))
            .orderBy(desc(slbTxn.createdAt))
            .limit(query.limit || 50)
            .offset(query.offset || 0);

        return results.map(row => ({
            id: row.id,
            assetId: row.assetId,
            assetDesc: row.assetDesc,
            saleDate: row.saleDate,
            salePrice: Number(row.salePrice),
            fmv: Number(row.fmv),
            ccy: row.ccy,
            controlTransferred: row.controlTransferred,
            leasebackId: row.leasebackId,
            leasebackCode: row.leasebackCode,
            leasebackLessor: row.leasebackLessor,
            leasebackAssetClass: null, // TODO: Add this field to the query
            status: row.status,
            createdAt: row.createdAt.toISOString(),
            createdBy: row.createdBy,
            allocation: null, // TODO: Add allocation data
            adjustments: [] // TODO: Add adjustments data
        }));
    }

    /**
     * Get detailed SLB transaction information
     */
    async getSlbDetail(
        companyId: string,
        slbId: string
    ): Promise<SlbDetailResponseType | null> {
        const result = await this.dbInstance
            .select({
                id: slbTxn.id,
                assetId: slbTxn.assetId,
                assetDesc: slbTxn.assetDesc,
                saleDate: slbTxn.saleDate,
                salePrice: slbTxn.salePrice,
                fmv: slbTxn.fmv,
                ccy: slbTxn.ccy,
                controlTransferred: slbTxn.controlTransferred,
                leasebackId: slbTxn.leasebackId,
                status: slbTxn.status,
                createdAt: slbTxn.createdAt,
                createdBy: slbTxn.createdBy,
                // Leaseback details
                leasebackCode: lease.leaseCode,
                leasebackLessor: lease.lessor,
                leasebackAssetClass: lease.assetClass
            })
            .from(slbTxn)
            .leftJoin(lease, eq(slbTxn.leasebackId, lease.id))
            .where(and(
                eq(slbTxn.id, slbId),
                eq(slbTxn.companyId, companyId)
            ))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        const row = result[0]!;

        // Get allocation details
        const allocation = await this.dbInstance
            .select()
            .from(slbAllocation)
            .where(eq(slbAllocation.slbId, slbId))
            .limit(1);

        // Get adjustments
        const adjustments = await this.dbInstance
            .select()
            .from(slbMeasure)
            .where(eq(slbMeasure.slbId, slbId))
            .orderBy(asc(slbMeasure.createdAt));

        return {
            id: row.id,
            assetId: row.assetId,
            assetDesc: row.assetDesc,
            saleDate: row.saleDate,
            salePrice: Number(row.salePrice),
            fmv: Number(row.fmv),
            ccy: row.ccy,
            controlTransferred: row.controlTransferred,
            leasebackId: row.leasebackId,
            leasebackCode: row.leasebackCode,
            leasebackLessor: row.leasebackLessor,
            leasebackAssetClass: row.leasebackAssetClass,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
            createdBy: row.createdBy,
            allocation: allocation.length > 0 ? {
                proportionTransferred: Number(allocation[0]!.proportionTransferred),
                gainRecognized: Number(allocation[0]!.gainRecognized),
                gainDeferred: Number(allocation[0]!.gainDeferred),
                rouRetained: Number(allocation[0]!.rouRetained),
                notes: allocation[0]!.notes
            } : null,
            adjustments: adjustments.map(adj => ({
                id: adj.id,
                kind: adj.adjKind,
                amount: Number(adj.amount),
                memo: adj.memo,
                createdAt: adj.createdAt.toISOString()
            }))
        };
    }

    /**
     * Assess transfer of control based on MFRS 15 criteria
     */
    private async assessTransferOfControl(data: SlbCreateReqType): Promise<{
        controlTransferred: boolean;
        assessment: any;
    }> {
        // MFRS 15 transfer of control criteria:
        // 1. Customer has ability to direct use and obtain substantially all benefits
        // 2. Customer has ability to prevent others from directing use and obtaining benefits
        // 3. Customer has present right to payment
        // 4. Customer has transferred significant risks and rewards of ownership

        const assessment = {
            abilityToDirectUse: data.abilityToDirectUse || false,
            abilityToPreventOthers: data.abilityToPreventOthers || false,
            presentRightToPayment: data.presentRightToPayment || false,
            risksRewardsTransferred: data.risksRewardsTransferred || false,
            salePriceVsFmv: Number(data.salePrice) / Number(data.fmv),
            leasebackTerms: data.leasebackTerms || null
        };

        // Determine control transfer based on criteria
        const controlTransferred =
            assessment.abilityToDirectUse &&
            assessment.abilityToPreventOthers &&
            assessment.presentRightToPayment &&
            assessment.risksRewardsTransferred &&
            assessment.salePriceVsFmv >= 0.8; // At least 80% of FMV

        return {
            controlTransferred,
            assessment
        };
    }

    /**
     * Update SLB transaction status
     */
    async updateSlbStatus(
        companyId: string,
        userId: string,
        slbId: string,
        status: 'DRAFT' | 'MEASURED' | 'POSTED' | 'COMPLETED'
    ): Promise<void> {
        await this.dbInstance
            .update(slbTxn)
            .set({
                status,
                updatedBy: userId,
                updatedAt: new Date()
            })
            .where(and(
                eq(slbTxn.id, slbId),
                eq(slbTxn.companyId, companyId)
            ));
    }
}
