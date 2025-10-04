import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray, isNull, isNotNull, lt, gte } from "drizzle-orm";
import {
    uarCampaign,
    uarItem,
    uarPack,
    itUser,
    itSystem,
    itGrant,
    itEntitlement,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    CampaignUpsertType,
    CampaignOpenType,
    CampaignDecideItemType,
    CampaignCloseType,
    PackBuildReqType,
    UarCampaignResponseType,
    UarItemResponseType,
    UarPackResponseType
} from "@aibos/contracts";

export class ITGCUARService {
    constructor(private dbInstance = db) { }

    /**
     * Create a UAR campaign
     */
    async createCampaign(
        companyId: string,
        userId: string,
        data: CampaignUpsertType
    ): Promise<UarCampaignResponseType> {
        const campaignId = ulid();

        const campaignData = {
            id: campaignId,
            companyId,
            code: data.code,
            name: data.name,
            periodStart: data.period_start,
            periodEnd: data.period_end,
            dueAt: new Date(data.due_at),
            status: 'DRAFT' as const,
            createdBy: userId,
            createdAt: new Date()
        };

        await this.dbInstance.insert(uarCampaign).values(campaignData);

        return {
            id: campaignId,
            company_id: companyId,
            code: data.code,
            name: data.name,
            period_start: data.period_start,
            period_end: data.period_end,
            due_at: data.due_at,
            status: 'DRAFT' as const,
            created_by: userId,
            created_at: campaignData.createdAt.toISOString()
        };
    }

    /**
     * Open a UAR campaign (build scope and create items)
     */
    async openCampaign(
        companyId: string,
        userId: string,
        data: CampaignOpenType
    ): Promise<{ items_created: number; campaign_id: string }> {
        const campaign = await this.getCampaign(companyId, data.campaign_id);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status !== 'DRAFT') {
            throw new Error('Campaign is not in DRAFT status');
        }

        // Build scope of users to review
        const scopeUsers = await this.buildCampaignScope(companyId, data);

        // Create UAR items
        let itemsCreated = 0;
        for (const user of scopeUsers) {
            await this.createUARItem(campaign.id, companyId, user);
            itemsCreated++;
        }

        // Update campaign status
        await this.dbInstance
            .update(uarCampaign)
            .set({ status: 'OPEN' })
            .where(eq(uarCampaign.id, campaign.id));

        // Emit campaign opened event
        await this.emitCampaignEvent(companyId, userId, campaign.id, 'opened', {
            items_created: itemsCreated
        });

        return {
            items_created: itemsCreated,
            campaign_id: campaign.id
        };
    }

    /**
     * Build scope of users for UAR campaign
     */
    private async buildCampaignScope(companyId: string, data: CampaignOpenType): Promise<any[]> {
        let whereConditions = [eq(itUser.companyId, companyId), eq(itUser.status, 'ACTIVE')];

        if (data.include_systems && data.include_systems.length > 0) {
            whereConditions.push(inArray(itUser.systemId, data.include_systems));
        }

        if (data.exclude_systems && data.exclude_systems.length > 0) {
            whereConditions.push(sql`${itUser.systemId} NOT IN (${data.exclude_systems.join(',')})`);
        }

        const users = await this.dbInstance
            .select({
                id: itUser.id,
                companyId: itUser.companyId,
                systemId: itUser.systemId,
                extId: itUser.extId,
                email: itUser.email,
                displayName: itUser.displayName,
                status: itUser.status,
                firstSeen: itUser.firstSeen,
                lastSeen: itUser.lastSeen
            })
            .from(itUser)
            .where(and(...whereConditions))
            .orderBy(asc(itUser.systemId), asc(itUser.extId));

        return users;
    }

    /**
     * Create a UAR item for a user
     */
    private async createUARItem(campaignId: string, companyId: string, user: any): Promise<void> {
        // Get user's grants snapshot
        const grants = await this.getUserGrantsSnapshot(companyId, user.id, user.systemId);

        // Determine owner (system owner for now, could be enhanced)
        const system = await this.getSystem(companyId, user.systemId);
        const ownerUserId = system?.ownerUserId || 'SYSTEM';

        const itemData = {
            id: ulid(),
            campaignId,
            companyId,
            systemId: user.systemId,
            userId: user.id,
            ownerUserId,
            snapshot: grants,
            state: 'PENDING' as const,
            createdAt: new Date()
        };

        await this.dbInstance.insert(uarItem).values(itemData);
    }

    /**
     * Get user's grants snapshot
     */
    private async getUserGrantsSnapshot(companyId: string, userId: string, systemId: string): Promise<any> {
        const grants = await this.dbInstance
            .select({
                id: itGrant.id,
                entitlementId: itGrant.entitlementId,
                grantedAt: itGrant.grantedAt,
                expiresAt: itGrant.expiresAt,
                source: itGrant.source,
                reason: itGrant.reason,
                entitlement: {
                    id: itEntitlement.id,
                    kind: itEntitlement.kind,
                    code: itEntitlement.code,
                    name: itEntitlement.name
                }
            })
            .from(itGrant)
            .leftJoin(itEntitlement, eq(itGrant.entitlementId, itEntitlement.id))
            .where(
                and(
                    eq(itGrant.companyId, companyId),
                    eq(itGrant.userId, userId),
                    eq(itGrant.systemId, systemId)
                )
            )
            .orderBy(desc(itGrant.grantedAt));

        return {
            grants: grants.map(grant => ({
                id: grant.id,
                entitlement_id: grant.entitlementId,
                granted_at: grant.grantedAt.toISOString(),
                expires_at: grant.expiresAt?.toISOString(),
                source: grant.source,
                reason: grant.reason,
                entitlement: grant.entitlement ? {
                    id: grant.entitlement.id,
                    kind: grant.entitlement.kind,
                    code: grant.entitlement.code,
                    name: grant.entitlement.name
                } : null
            })),
            snapshot_taken_at: new Date().toISOString()
        };
    }

    /**
     * Make certification decisions on UAR items
     */
    async decideItems(
        companyId: string,
        userId: string,
        data: CampaignDecideItemType
    ): Promise<{ items_processed: number }> {
        let itemsProcessed = 0;

        for (const item of data.items) {
            await this.dbInstance
                .update(uarItem)
                .set({
                    state: item.decision,
                    decidedBy: userId,
                    decidedAt: new Date(),
                    exceptionNote: item.exception_note
                })
                .where(
                    and(
                        eq(uarItem.campaignId, data.campaign_id),
                        eq(uarItem.userId, item.user_id),
                        eq(uarItem.systemId, item.system_id),
                        eq(uarItem.companyId, companyId)
                    )
                );

            itemsProcessed++;
        }

        // Emit item decided event
        await this.emitCampaignEvent(companyId, userId, data.campaign_id, 'items_decided', {
            items_processed: itemsProcessed
        });

        return { items_processed: itemsProcessed };
    }

    /**
     * Close a UAR campaign
     */
    async closeCampaign(
        companyId: string,
        userId: string,
        data: CampaignCloseType
    ): Promise<{ campaign_id: string; pack_id?: string }> {
        const campaign = await this.getCampaign(companyId, data.campaign_id);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status !== 'OPEN') {
            throw new Error('Campaign is not OPEN');
        }

        // Check if all items are decided
        const pendingItems = await this.dbInstance
            .select({ count: sql<number>`COUNT(*)` })
            .from(uarItem)
            .where(
                and(
                    eq(uarItem.campaignId, data.campaign_id),
                    eq(uarItem.state, 'PENDING')
                )
            );

        if (pendingItems[0]!.count > 0) {
            throw new Error(`Cannot close campaign: ${pendingItems[0]!.count} items still pending`);
        }

        // Update campaign status
        await this.dbInstance
            .update(uarCampaign)
            .set({ status: 'CLOSED' })
            .where(eq(uarCampaign.id, data.campaign_id));

        let packId: string | undefined;

        // Build evidence pack if requested
        if (data.build_evidence_pack) {
            packId = await this.buildEvidencePack(companyId, userId, data.campaign_id);
        }

        // Emit campaign closed event
        await this.emitCampaignEvent(companyId, userId, data.campaign_id, 'closed', {
            pack_id: packId
        });

        return {
            campaign_id: data.campaign_id,
            ...(packId && { pack_id: packId })
        };
    }

    /**
     * Build evidence pack for UAR campaign
     */
    private async buildEvidencePack(companyId: string, userId: string, campaignId: string): Promise<string> {
        const packId = ulid();

        // Get campaign data
        const campaign = await this.getCampaign(companyId, campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // Get all items
        const items = await this.getCampaignItems(companyId, campaignId);

        // Build eBinder content
        const eBinderContent = {
            campaign: {
                id: campaign.id,
                code: campaign.code,
                name: campaign.name,
                period_start: campaign.period_start,
                period_end: campaign.period_end,
                due_at: campaign.due_at,
                created_at: campaign.created_at
            },
            items: items.map(item => ({
                id: item.id,
                user_id: item.user_id,
                system_id: item.system_id,
                owner_user_id: item.owner_user_id,
                state: item.state,
                decided_by: item.decided_by,
                decided_at: item.decided_at,
                exception_note: item.exception_note,
                snapshot: item.snapshot
            })),
            summary: {
                total_items: items.length,
                certified: items.filter(i => i.state === 'CERTIFIED').length,
                revoked: items.filter(i => i.state === 'REVOKE').length,
                exceptions: items.filter(i => i.state === 'EXCEPTION').length
            },
            generated_at: new Date().toISOString(),
            generated_by: userId
        };

        // TODO: Store in Evidence Vault (M26.4)
        // For now, we'll create a placeholder record
        const evdRecordId = ulid(); // This would come from Evidence Vault

        // Calculate SHA256 of normalized content
        const contentHash = await this.calculateContentHash(eBinderContent);

        // Create UAR pack record
        await this.dbInstance.insert(uarPack).values({
            id: packId,
            campaignId,
            sha256: contentHash,
            evdRecordId,
            createdAt: new Date()
        });

        return packId;
    }

    /**
     * Calculate SHA256 hash of content
     */
    private async calculateContentHash(content: any): Promise<string> {
        // TODO: Implement proper SHA256 calculation
        // This would typically use crypto.createHash('sha256')
        return `sha256_${Date.now()}`;
    }

    /**
     * Get UAR campaigns for a company
     */
    async getCampaigns(companyId: string): Promise<UarCampaignResponseType[]> {
        const results = await this.dbInstance
            .select({
                id: uarCampaign.id,
                companyId: uarCampaign.companyId,
                code: uarCampaign.code,
                name: uarCampaign.name,
                periodStart: uarCampaign.periodStart,
                periodEnd: uarCampaign.periodEnd,
                dueAt: uarCampaign.dueAt,
                status: uarCampaign.status,
                createdBy: uarCampaign.createdBy,
                createdAt: uarCampaign.createdAt,
                itemCount: sql<number>`COUNT(${uarItem.id})`,
                completedCount: sql<number>`COUNT(CASE WHEN ${uarItem.state} != 'PENDING' THEN 1 END)`,
                overdueCount: sql<number>`COUNT(CASE WHEN ${uarItem.state} = 'PENDING' AND ${uarCampaign.dueAt} < NOW() THEN 1 END)`
            })
            .from(uarCampaign)
            .leftJoin(uarItem, eq(uarCampaign.id, uarItem.campaignId))
            .where(eq(uarCampaign.companyId, companyId))
            .groupBy(uarCampaign.id)
            .orderBy(desc(uarCampaign.createdAt));

        return results.map(row => ({
            id: row.id,
            company_id: row.companyId,
            code: row.code,
            name: row.name,
            period_start: row.periodStart?.split('T')[0] ?? '',
            period_end: row.periodEnd?.split('T')[0] ?? '',
            due_at: row.dueAt.toISOString(),
            status: row.status,
            created_by: row.createdBy,
            created_at: row.createdAt.toISOString(),
            item_count: Number(row.itemCount),
            completed_count: Number(row.completedCount),
            overdue_count: Number(row.overdueCount)
        }));
    }

    /**
     * Get UAR items for a campaign
     */
    async getCampaignItems(companyId: string, campaignId: string): Promise<UarItemResponseType[]> {
        const results = await this.dbInstance
            .select({
                id: uarItem.id,
                campaignId: uarItem.campaignId,
                companyId: uarItem.companyId,
                systemId: uarItem.systemId,
                userId: uarItem.userId,
                ownerUserId: uarItem.ownerUserId,
                snapshot: uarItem.snapshot,
                state: uarItem.state,
                decidedBy: uarItem.decidedBy,
                decidedAt: uarItem.decidedAt,
                exceptionNote: uarItem.exceptionNote,
                createdAt: uarItem.createdAt,
                user: {
                    id: itUser.id,
                    companyId: itUser.companyId,
                    systemId: itUser.systemId,
                    extId: itUser.extId,
                    email: itUser.email,
                    displayName: itUser.displayName,
                    status: itUser.status,
                    firstSeen: itUser.firstSeen,
                    lastSeen: itUser.lastSeen
                },
                system: {
                    id: itSystem.id,
                    companyId: itSystem.companyId,
                    code: itSystem.code,
                    name: itSystem.name,
                    kind: itSystem.kind,
                    ownerUserId: itSystem.ownerUserId,
                    isActive: itSystem.isActive,
                    createdAt: itSystem.createdAt
                }
            })
            .from(uarItem)
            .leftJoin(itUser, eq(uarItem.userId, itUser.id))
            .leftJoin(itSystem, eq(uarItem.systemId, itSystem.id))
            .where(
                and(
                    eq(uarItem.campaignId, campaignId),
                    eq(uarItem.companyId, companyId)
                )
            )
            .orderBy(asc(uarItem.ownerUserId), asc(uarItem.createdAt));

        return results.map(row => ({
            id: row.id,
            campaign_id: row.campaignId,
            company_id: row.companyId,
            system_id: row.systemId,
            user_id: row.userId,
            owner_user_id: row.ownerUserId,
            snapshot: row.snapshot as Record<string, any>,
            state: row.state,
            decided_by: row.decidedBy ?? undefined,
            decided_at: row.decidedAt?.toISOString(),
            exception_note: row.exceptionNote ?? undefined,
            created_at: row.createdAt.toISOString(),
            user: row.user ? {
                id: row.user.id,
                company_id: row.user.companyId,
                system_id: row.user.systemId,
                ext_id: row.user.extId,
                email: row.user.email ?? undefined,
                display_name: row.user.displayName ?? undefined,
                status: row.user.status,
                first_seen: row.user.firstSeen.toISOString(),
                last_seen: row.user.lastSeen.toISOString()
            } : undefined,
            system: row.system ? {
                id: row.system.id,
                company_id: row.system.companyId,
                code: row.system.code,
                name: row.system.name,
                kind: row.system.kind,
                owner_user_id: row.system.ownerUserId,
                is_active: row.system.isActive,
                created_at: row.system.createdAt.toISOString()
            } : undefined
        }));
    }

    /**
     * Get a specific campaign
     */
    private async getCampaign(companyId: string, campaignId: string): Promise<any> {
        const results = await this.dbInstance
            .select()
            .from(uarCampaign)
            .where(
                and(
                    eq(uarCampaign.id, campaignId),
                    eq(uarCampaign.companyId, companyId)
                )
            )
            .limit(1);

        return results[0];
    }

    /**
     * Get a specific system
     */
    private async getSystem(companyId: string, systemId: string): Promise<any> {
        const results = await this.dbInstance
            .select()
            .from(itSystem)
            .where(
                and(
                    eq(itSystem.id, systemId),
                    eq(itSystem.companyId, companyId)
                )
            )
            .limit(1);

        return results[0];
    }

    /**
     * Emit UAR campaign event
     */
    private async emitCampaignEvent(
        companyId: string,
        userId: string,
        campaignId: string,
        action: string,
        data: any = {}
    ): Promise<void> {
        await this.dbInstance.insert(outbox).values({
            id: ulid(),
            topic: 'itgc.uar',
            payload: JSON.stringify({
                event_type: `uar_${action}`,
                company_id: companyId,
                user_id: userId,
                campaign_id: campaignId,
                ...data
            }),
            createdAt: new Date()
        });
    }
}
