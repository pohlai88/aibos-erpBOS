import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray, count } from "drizzle-orm";
import {
    attestProgram,
    attestTemplate,
    attestCampaign,
    attestTask,
    attestAssignment,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    CampaignIssueReqType,
    CampaignResponseType
} from "@aibos/contracts";

export class AttestCampaignService {
    constructor(private dbInstance = db) { }

    /**
     * Issue a new attestation campaign
     */
    async issueCampaign(
        companyId: string,
        userId: string,
        data: CampaignIssueReqType
    ): Promise<CampaignResponseType> {
        // Get program and template IDs
        const [program] = await this.dbInstance
            .select({ id: attestProgram.id })
            .from(attestProgram)
            .where(and(
                eq(attestProgram.companyId, companyId),
                eq(attestProgram.code, data.programCode)
            ));

        if (!program) {
            throw new Error(`Program with code ${data.programCode} not found`);
        }

        const [template] = await this.dbInstance
            .select({ id: attestTemplate.id })
            .from(attestTemplate)
            .where(and(
                eq(attestTemplate.companyId, companyId),
                eq(attestTemplate.code, data.templateCode)
            ))
            .orderBy(desc(attestTemplate.version))
            .limit(1);

        if (!template) {
            throw new Error(`Template with code ${data.templateCode} not found`);
        }

        const campaignId = ulid();

        const campaignData = {
            id: campaignId,
            companyId,
            programId: program.id,
            templateId: template.id,
            period: data.period,
            dueAt: new Date(data.dueAt),
            state: "ISSUED" as const,
            meta: data.meta || {},
            createdBy: userId,
            updatedBy: userId,
        };

        await this.dbInstance
            .insert(attestCampaign)
            .values(campaignData)
            .onConflictDoUpdate({
                target: [attestCampaign.companyId, attestCampaign.programId, attestCampaign.period],
                set: {
                    templateId: campaignData.templateId,
                    dueAt: campaignData.dueAt,
                    state: campaignData.state,
                    meta: campaignData.meta,
                    updatedBy: userId,
                    updatedAt: new Date(),
                },
            });

        // Create tasks for all assignees
        await this.createTasksForCampaign(campaignId, companyId, userId, campaignData.dueAt);

        // Emit outbox event
        await this.emitCampaignIssuedEvent(campaignId, companyId);

        // Return the created campaign
        const [result] = await this.dbInstance
            .select()
            .from(attestCampaign)
            .where(eq(attestCampaign.id, campaignId));

        if (!result) {
            throw new Error("Failed to create attestation campaign");
        }

        return {
            id: result.id,
            companyId: result.companyId,
            programId: result.programId,
            templateId: result.templateId,
            period: result.period,
            dueAt: result.dueAt.toISOString(),
            state: result.state as any,
            meta: result.meta as any,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
        };
    }

    /**
     * Close an attestation campaign
     */
    async closeCampaign(
        campaignId: string,
        companyId: string,
        userId: string
    ): Promise<void> {
        await this.dbInstance
            .update(attestCampaign)
            .set({
                state: "CLOSED",
                updatedBy: userId,
                updatedAt: new Date(),
            })
            .where(and(
                eq(attestCampaign.id, campaignId),
                eq(attestCampaign.companyId, companyId)
            ));

        // Emit outbox event
        await this.emitCampaignClosedEvent(campaignId, companyId);
    }

    /**
     * List attestation campaigns
     */
    async listCampaigns(
        companyId: string,
        limit: number = 100,
        offset: number = 0
    ): Promise<{ campaigns: CampaignResponseType[]; total: number; hasMore: boolean }> {
        // Get total count
        const [totalResult] = await this.dbInstance
            .select({ count: count() })
            .from(attestCampaign)
            .where(eq(attestCampaign.companyId, companyId));

        const total = totalResult?.count || 0;

        // Get paginated results
        const campaigns = await this.dbInstance
            .select()
            .from(attestCampaign)
            .where(eq(attestCampaign.companyId, companyId))
            .orderBy(desc(attestCampaign.createdAt))
            .limit(limit)
            .offset(offset);

        const campaignResponses: CampaignResponseType[] = campaigns.map(campaign => ({
            id: campaign.id,
            companyId: campaign.companyId,
            programId: campaign.programId,
            templateId: campaign.templateId,
            period: campaign.period,
            dueAt: campaign.dueAt.toISOString(),
            state: campaign.state as any,
            meta: campaign.meta as any,
            createdAt: campaign.createdAt.toISOString(),
            updatedAt: campaign.updatedAt.toISOString(),
        }));

        return {
            campaigns: campaignResponses,
            total,
            hasMore: offset + limit < total,
        };
    }

    /**
     * Private helper to create tasks for all assignees in a campaign
     */
    private async createTasksForCampaign(
        campaignId: string,
        companyId: string,
        userId: string,
        dueAt: Date
    ): Promise<void> {
        // Get all assignments for the program
        const assignments = await this.dbInstance
            .select({
                assigneeId: attestAssignment.assigneeId,
                scopeKey: attestAssignment.scopeKey,
                approverId: attestAssignment.approverId,
            })
            .from(attestAssignment)
            .innerJoin(attestCampaign, eq(attestAssignment.programId, attestCampaign.programId))
            .where(and(
                eq(attestAssignment.companyId, companyId),
                eq(attestCampaign.id, campaignId)
            ));

        // Create tasks for each assignment
        const taskData = assignments.map(assignment => ({
            id: ulid(),
            companyId,
            campaignId,
            assigneeId: assignment.assigneeId,
            scopeKey: assignment.scopeKey,
            state: "OPEN" as const,
            dueAt,
            slaState: "OK" as const,
            createdBy: userId,
            updatedBy: userId,
        }));

        if (taskData.length > 0) {
            await this.dbInstance
                .insert(attestTask)
                .values(taskData)
                .onConflictDoNothing(); // Don't create duplicates
        }

        // Create Close Board items for each task (M26.6 integration)
        await this.createCloseBoardItems(campaignId, companyId, userId, taskData);
    }

    /**
     * Private helper to create Close Board items (M26.6 integration)
     */
    private async createCloseBoardItems(
        campaignId: string,
        companyId: string,
        userId: string,
        taskData: any[]
    ): Promise<void> {
        // This would integrate with M26.6 Close Board service
        // For now, we'll emit an outbox event that can be picked up by the Close Board service
        for (const task of taskData) {
            await this.dbInstance
                .insert(outbox)
                .values({
                    id: ulid(),
                    topic: "ATTEST_TASK_CREATED",
                    payload: JSON.stringify({
                        taskId: task.id,
                        campaignId,
                        companyId,
                        assigneeId: task.assigneeId,
                        scopeKey: task.scopeKey,
                        dueAt: task.dueAt.toISOString(),
                    }),
                });
        }
    }

    /**
     * Private helper to emit campaign issued event
     */
    private async emitCampaignIssuedEvent(campaignId: string, companyId: string): Promise<void> {
        await this.dbInstance
            .insert(outbox)
            .values({
                id: ulid(),
                topic: "ATTEST_CAMPAIGN_ISSUED",
                payload: JSON.stringify({
                    campaignId,
                    companyId,
                }),
            });
    }

    /**
     * Private helper to emit campaign closed event
     */
    private async emitCampaignClosedEvent(campaignId: string, companyId: string): Promise<void> {
        await this.dbInstance
            .insert(outbox)
            .values({
                id: ulid(),
                topic: "ATTEST_CAMPAIGN_CLOSED",
                payload: JSON.stringify({
                    campaignId,
                    companyId,
                }),
            });
    }
}
