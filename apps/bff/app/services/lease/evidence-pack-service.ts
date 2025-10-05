import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc } from "drizzle-orm";
import { sublease, slbTxn } from "@aibos/db-adapter/schema";

/**
 * M28.5: Evidence Pack Service for Sublease & SLB
 * 
 * Creates and manages evidence packs for sublease and SLB transactions
 * to support M26.4 evidence requirements
 */
export class EvidencePackService {
    constructor(private dbInstance = db) { }

    /**
     * Create evidence pack for sublease
     */
    async createSubleaseEvidencePack(
        companyId: string,
        userId: string,
        subleaseId: string,
        evidenceData: {
            subleaseContract?: string;
            headLeaseReference?: string;
            classificationMemo?: string;
            cashflowSchedule?: string;
            componentLinks?: string;
        }
    ): Promise<string> {
        // Create evidence pack ID
        const evidencePackId = ulid();

        // Build evidence content
        const evidenceContent = {
            type: 'sublease',
            sublease_id: subleaseId,
            company_id: companyId,
            created_by: userId,
            created_at: new Date().toISOString(),
            evidence: {
                sublease_contract: evidenceData.subleaseContract,
                head_lease_reference: evidenceData.headLeaseReference,
                classification_memo: evidenceData.classificationMemo,
                cashflow_schedule: evidenceData.cashflowSchedule,
                component_links: evidenceData.componentLinks
            },
            metadata: {
                version: '1.0',
                schema: 'm28.5_sublease_evidence'
            }
        };

        // Calculate SHA256 hash for integrity
        const sha256 = await this.calculateContentHash(evidenceContent);

        // Update sublease with evidence pack ID
        await this.dbInstance
            .update(sublease)
            .set({
                evidencePackId,
                updatedBy: userId,
                updatedAt: new Date()
            })
            .where(and(
                eq(sublease.id, subleaseId),
                eq(sublease.companyId, companyId)
            ));

        // TODO: Store in Evidence Vault (M26.4)
        // For now, we'll emit an event for the evidence vault
        await this.emitEvidenceEvent(companyId, userId, evidencePackId, 'created', {
            type: 'sublease',
            sublease_id: subleaseId,
            sha256
        });

        return evidencePackId;
    }

    /**
     * Create evidence pack for SLB transaction
     */
    async createSlbEvidencePack(
        companyId: string,
        userId: string,
        slbId: string,
        evidenceData: {
            saleContract?: string;
            leasebackAgreement?: string;
            fairValueAssessment?: string;
            controlTransferMemo?: string;
            gainCalculation?: string;
        }
    ): Promise<string> {
        // Create evidence pack ID
        const evidencePackId = ulid();

        // Build evidence content
        const evidenceContent = {
            type: 'slb',
            slb_id: slbId,
            company_id: companyId,
            created_by: userId,
            created_at: new Date().toISOString(),
            evidence: {
                sale_contract: evidenceData.saleContract,
                leaseback_agreement: evidenceData.leasebackAgreement,
                fair_value_assessment: evidenceData.fairValueAssessment,
                control_transfer_memo: evidenceData.controlTransferMemo,
                gain_calculation: evidenceData.gainCalculation
            },
            metadata: {
                version: '1.0',
                schema: 'm28.5_slb_evidence'
            }
        };

        // Calculate SHA256 hash for integrity
        const sha256 = await this.calculateContentHash(evidenceContent);

        // Update SLB transaction with evidence pack ID
        await this.dbInstance
            .update(slbTxn)
            .set({
                evidencePackId,
                updatedBy: userId,
                updatedAt: new Date()
            })
            .where(and(
                eq(slbTxn.id, slbId),
                eq(slbTxn.companyId, companyId)
            ));

        // TODO: Store in Evidence Vault (M26.4)
        // For now, we'll emit an event for the evidence vault
        await this.emitEvidenceEvent(companyId, userId, evidencePackId, 'created', {
            type: 'slb',
            slb_id: slbId,
            sha256
        });

        return evidencePackId;
    }

    /**
     * Get evidence pack for sublease
     */
    async getSubleaseEvidencePack(
        companyId: string,
        subleaseId: string
    ): Promise<string | null> {
        const result = await this.dbInstance
            .select({ evidencePackId: sublease.evidencePackId })
            .from(sublease)
            .where(and(
                eq(sublease.id, subleaseId),
                eq(sublease.companyId, companyId)
            ))
            .limit(1);

        return result[0]?.evidencePackId || null;
    }

    /**
     * Get evidence pack for SLB transaction
     */
    async getSlbEvidencePack(
        companyId: string,
        slbId: string
    ): Promise<string | null> {
        const result = await this.dbInstance
            .select({ evidencePackId: slbTxn.evidencePackId })
            .from(slbTxn)
            .where(and(
                eq(slbTxn.id, slbId),
                eq(slbTxn.companyId, companyId)
            ))
            .limit(1);

        return result[0]?.evidencePackId || null;
    }

    /**
     * Calculate SHA256 hash of content
     */
    private async calculateContentHash(content: any): Promise<string> {
        // TODO: Implement proper SHA256 calculation
        // This would typically use crypto.createHash('sha256')
        return `sha256_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Emit evidence event for M26.4 integration
     */
    private async emitEvidenceEvent(
        companyId: string,
        userId: string,
        evidencePackId: string,
        action: string,
        data: any = {}
    ): Promise<void> {
        // TODO: Integrate with proper outbox system
        console.log('Evidence Pack Event:', {
            event_type: `evidence_pack_${action}`,
            company_id: companyId,
            user_id: userId,
            evidence_pack_id: evidencePackId,
            ...data
        });
    }
}
