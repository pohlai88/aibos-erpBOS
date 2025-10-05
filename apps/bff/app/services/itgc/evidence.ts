import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray, isNull, isNotNull, lt, gte } from "drizzle-orm";
import {
    itSnapshot,
    uarPack,
    uarCampaign,
    uarItem,
    itUser,
    itRole,
    itEntitlement,
    itGrant,
    itSodViolation,
    itBreakglass,
    itSystem,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    SnapshotReqType,
    PackBuildReqType,
    SnapshotResponseType,
    UarPackResponseType
} from "@aibos/contracts";

export class ITGCEvidenceService {
    constructor(private dbInstance = db) { }

    /**
     * Take a snapshot of ITGC data for audit evidence
     */
    async takeSnapshot(
        companyId: string,
        userId: string,
        data: SnapshotReqType
    ): Promise<SnapshotResponseType> {
        const snapshotId = ulid();
        const takenAt = new Date();

        // Build snapshot data based on scope
        const snapshotData = await this.buildSnapshotData(companyId, data);

        // Calculate SHA256 hash
        const sha256 = await this.calculateContentHash(snapshotData);

        // TODO: Store in Evidence Vault (M26.4)
        // For now, we'll create a placeholder record
        const evdRecordId = ulid(); // This would come from Evidence Vault

        // Create snapshot record
        await this.dbInstance.insert(itSnapshot).values({
            id: snapshotId,
            companyId,
            takenAt,
            scope: data.scope,
            sha256,
            evdRecordId
        });

        // Emit snapshot event
        await this.emitSnapshotEvent(companyId, userId, snapshotId, 'taken', {
            scope: data.scope,
            record_count: snapshotData.record_count
        });

        return {
            id: snapshotId,
            company_id: companyId,
            taken_at: takenAt.toISOString(),
            scope: data.scope,
            sha256,
            evd_record_id: evdRecordId,
            record_count: snapshotData.record_count
        };
    }

    /**
     * Build snapshot data based on scope
     */
    private async buildSnapshotData(companyId: string, data: SnapshotReqType): Promise<any> {
        const snapshotData: any = {
            company_id: companyId,
            scope: data.scope,
            taken_at: new Date().toISOString(),
            systems: data.systems || [],
            data: {}
        };

        let recordCount = 0;

        switch (data.scope) {
            case 'USERS':
                snapshotData.data.users = await this.getUsersSnapshot(companyId, data.systems);
                recordCount = snapshotData.data.users.length;
                break;

            case 'ROLES':
                snapshotData.data.roles = await this.getRolesSnapshot(companyId, data.systems);
                recordCount = snapshotData.data.roles.length;
                break;

            case 'GRANTS':
                snapshotData.data.grants = await this.getGrantsSnapshot(companyId, data.systems);
                recordCount = snapshotData.data.grants.length;
                break;

            case 'SOD':
                snapshotData.data.violations = await this.getSoDViolationsSnapshot(companyId);
                recordCount = snapshotData.data.violations.length;
                break;

            case 'BREAKGLASS':
                snapshotData.data.breakglass = await this.getBreakglassSnapshot(companyId);
                recordCount = snapshotData.data.breakglass.length;
                break;

            default:
                throw new Error(`Unsupported snapshot scope: ${data.scope}`);
        }

        snapshotData.record_count = recordCount;
        return snapshotData;
    }

    /**
     * Get users snapshot
     */
    private async getUsersSnapshot(companyId: string, systems?: string[]): Promise<any[]> {
        let whereConditions = [eq(itUser.companyId, companyId)];

        if (systems && systems.length > 0) {
            whereConditions.push(inArray(itUser.systemId, systems));
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
                lastSeen: itUser.lastSeen,
                system: {
                    id: itSystem.id,
                    code: itSystem.code,
                    name: itSystem.name,
                    kind: itSystem.kind
                }
            })
            .from(itUser)
            .leftJoin(itSystem, eq(itUser.systemId, itSystem.id))
            .where(and(...whereConditions))
            .orderBy(asc(itUser.systemId), asc(itUser.extId));

        return users.map(user => ({
            id: user.id,
            company_id: user.companyId,
            system_id: user.systemId,
            ext_id: user.extId,
            email: user.email,
            display_name: user.displayName,
            status: user.status,
            first_seen: user.firstSeen.toISOString(),
            last_seen: user.lastSeen.toISOString(),
            system: user.system ? {
                id: user.system.id,
                code: user.system.code,
                name: user.system.name,
                kind: user.system.kind
            } : null
        }));
    }

    /**
     * Get roles snapshot
     */
    private async getRolesSnapshot(companyId: string, systems?: string[]): Promise<any[]> {
        let whereConditions = [eq(itRole.companyId, companyId)];

        if (systems && systems.length > 0) {
            whereConditions.push(inArray(itRole.systemId, systems));
        }

        const roles = await this.dbInstance
            .select({
                id: itRole.id,
                companyId: itRole.companyId,
                systemId: itRole.systemId,
                code: itRole.code,
                name: itRole.name,
                critical: itRole.critical,
                system: {
                    id: itSystem.id,
                    code: itSystem.code,
                    name: itSystem.name,
                    kind: itSystem.kind
                }
            })
            .from(itRole)
            .leftJoin(itSystem, eq(itRole.systemId, itSystem.id))
            .where(and(...whereConditions))
            .orderBy(asc(itRole.systemId), asc(itRole.code));

        return roles.map(role => ({
            id: role.id,
            company_id: role.companyId,
            system_id: role.systemId,
            code: role.code,
            name: role.name,
            critical: role.critical,
            system: role.system ? {
                id: role.system.id,
                code: role.system.code,
                name: role.system.name,
                kind: role.system.kind
            } : null
        }));
    }

    /**
     * Get grants snapshot
     */
    private async getGrantsSnapshot(companyId: string, systems?: string[]): Promise<any[]> {
        let whereConditions = [eq(itGrant.companyId, companyId)];

        if (systems && systems.length > 0) {
            whereConditions.push(inArray(itGrant.systemId, systems));
        }

        const grants = await this.dbInstance
            .select({
                id: itGrant.id,
                companyId: itGrant.companyId,
                systemId: itGrant.systemId,
                userId: itGrant.userId,
                entitlementId: itGrant.entitlementId,
                grantedAt: itGrant.grantedAt,
                expiresAt: itGrant.expiresAt,
                source: itGrant.source,
                reason: itGrant.reason,
                createdAt: itGrant.createdAt,
                user: {
                    id: itUser.id,
                    extId: itUser.extId,
                    email: itUser.email,
                    displayName: itUser.displayName
                },
                entitlement: {
                    id: itEntitlement.id,
                    kind: itEntitlement.kind,
                    code: itEntitlement.code,
                    name: itEntitlement.name
                },
                system: {
                    id: itSystem.id,
                    code: itSystem.code,
                    name: itSystem.name,
                    kind: itSystem.kind
                }
            })
            .from(itGrant)
            .leftJoin(itUser, eq(itGrant.userId, itUser.id))
            .leftJoin(itEntitlement, eq(itGrant.entitlementId, itEntitlement.id))
            .leftJoin(itSystem, eq(itGrant.systemId, itSystem.id))
            .where(and(...whereConditions))
            .orderBy(desc(itGrant.grantedAt));

        return grants.map(grant => ({
            id: grant.id,
            company_id: grant.companyId,
            system_id: grant.systemId,
            user_id: grant.userId,
            entitlement_id: grant.entitlementId,
            granted_at: grant.grantedAt.toISOString(),
            expires_at: grant.expiresAt?.toISOString(),
            source: grant.source,
            reason: grant.reason,
            created_at: grant.createdAt.toISOString(),
            user: grant.user ? {
                id: grant.user.id,
                ext_id: grant.user.extId,
                email: grant.user.email,
                display_name: grant.user.displayName
            } : null,
            entitlement: grant.entitlement ? {
                id: grant.entitlement.id,
                kind: grant.entitlement.kind,
                code: grant.entitlement.code,
                name: grant.entitlement.name
            } : null,
            system: grant.system ? {
                id: grant.system.id,
                code: grant.system.code,
                name: grant.system.name,
                kind: grant.system.kind
            } : null
        }));
    }

    /**
     * Get SoD violations snapshot
     */
    private async getSoDViolationsSnapshot(companyId: string): Promise<any[]> {
        const violations = await this.dbInstance
            .select({
                id: itSodViolation.id,
                companyId: itSodViolation.companyId,
                ruleId: itSodViolation.ruleId,
                systemId: itSodViolation.systemId,
                userId: itSodViolation.userId,
                detectedAt: itSodViolation.detectedAt,
                status: itSodViolation.status,
                note: itSodViolation.note,
                explanation: itSodViolation.explanation
            })
            .from(itSodViolation)
            .where(eq(itSodViolation.companyId, companyId))
            .orderBy(desc(itSodViolation.detectedAt));

        return violations.map(violation => ({
            id: violation.id,
            company_id: violation.companyId,
            rule_id: violation.ruleId,
            system_id: violation.systemId,
            user_id: violation.userId,
            detected_at: violation.detectedAt.toISOString(),
            status: violation.status,
            note: violation.note,
            explanation: violation.explanation
        }));
    }

    /**
     * Get break-glass snapshot
     */
    private async getBreakglassSnapshot(companyId: string): Promise<any[]> {
        const breakglass = await this.dbInstance
            .select({
                id: itBreakglass.id,
                companyId: itBreakglass.companyId,
                systemId: itBreakglass.systemId,
                userId: itBreakglass.userId,
                openedAt: itBreakglass.openedAt,
                expiresAt: itBreakglass.expiresAt,
                ticket: itBreakglass.ticket,
                reason: itBreakglass.reason,
                closedAt: itBreakglass.closedAt,
                closedBy: itBreakglass.closedBy
            })
            .from(itBreakglass)
            .where(eq(itBreakglass.companyId, companyId))
            .orderBy(desc(itBreakglass.openedAt));

        return breakglass.map(bg => ({
            id: bg.id,
            company_id: bg.companyId,
            system_id: bg.systemId,
            user_id: bg.userId,
            opened_at: bg.openedAt.toISOString(),
            expires_at: bg.expiresAt.toISOString(),
            ticket: bg.ticket,
            reason: bg.reason,
            closed_at: bg.closedAt?.toISOString(),
            closed_by: bg.closedBy
        }));
    }

    /**
     * Build UAR evidence pack
     */
    async buildUARPack(
        companyId: string,
        userId: string,
        data: PackBuildReqType
    ): Promise<UarPackResponseType> {
        const packId = ulid();

        // Get campaign data
        const campaign = await this.getCampaign(companyId, data.campaign_id);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // Get all items
        const items = await this.getCampaignItems(companyId, data.campaign_id);

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
        const sha256 = await this.calculateContentHash(eBinderContent);

        // Create UAR pack record
        await this.dbInstance.insert(uarPack).values({
            id: packId,
            campaignId: data.campaign_id,
            sha256,
            evdRecordId,
            createdAt: new Date()
        });

        // Emit pack built event
        await this.emitPackEvent(companyId, userId, packId, 'built', {
            campaign_id: data.campaign_id,
            item_count: items.length
        });

        return {
            id: packId,
            campaign_id: data.campaign_id,
            sha256,
            evd_record_id: evdRecordId,
            created_at: new Date().toISOString(),
            campaign: campaign
        };
    }

    /**
     * Get snapshots for a company
     */
    async getSnapshots(companyId: string): Promise<SnapshotResponseType[]> {
        const results = await this.dbInstance
            .select()
            .from(itSnapshot)
            .where(eq(itSnapshot.companyId, companyId))
            .orderBy(desc(itSnapshot.takenAt));

        return results.map(row => ({
            id: row.id,
            company_id: row.companyId,
            taken_at: row.takenAt.toISOString(),
            scope: row.scope,
            sha256: row.sha256,
            evd_record_id: row.evdRecordId ?? undefined
        }));
    }

    /**
     * Get UAR packs for a company
     */
    async getUARPacks(companyId: string): Promise<UarPackResponseType[]> {
        const results = await this.dbInstance
            .select({
                id: uarPack.id,
                campaignId: uarPack.campaignId,
                sha256: uarPack.sha256,
                evdRecordId: uarPack.evdRecordId,
                createdAt: uarPack.createdAt,
                campaign: {
                    id: uarCampaign.id,
                    companyId: uarCampaign.companyId,
                    code: uarCampaign.code,
                    name: uarCampaign.name,
                    periodStart: uarCampaign.periodStart,
                    periodEnd: uarCampaign.periodEnd,
                    dueAt: uarCampaign.dueAt,
                    status: uarCampaign.status,
                    createdBy: uarCampaign.createdBy,
                    createdAt: uarCampaign.createdAt
                }
            })
            .from(uarPack)
            .leftJoin(uarCampaign, eq(uarPack.campaignId, uarCampaign.id))
            .where(eq(uarCampaign.companyId, companyId))
            .orderBy(desc(uarPack.createdAt));

        return results.map(row => ({
            id: row.id,
            campaign_id: row.campaignId,
            sha256: row.sha256,
            evd_record_id: row.evdRecordId ?? undefined,
            created_at: row.createdAt.toISOString(),
            campaign: row.campaign ? {
                id: row.campaign.id,
                company_id: row.campaign.companyId,
                code: row.campaign.code,
                name: row.campaign.name,
                period_start: row.campaign.periodStart?.split('T')[0] ?? '',
                period_end: row.campaign.periodEnd?.split('T')[0] ?? '',
                due_at: row.campaign.dueAt.toISOString(),
                status: row.campaign.status,
                created_by: row.campaign.createdBy,
                created_at: row.campaign.createdAt.toISOString()
            } : undefined
        }));
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
     * Get campaign items
     */
    private async getCampaignItems(companyId: string, campaignId: string): Promise<any[]> {
        const results = await this.dbInstance
            .select()
            .from(uarItem)
            .where(
                and(
                    eq(uarItem.campaignId, campaignId),
                    eq(uarItem.companyId, companyId)
                )
            )
            .orderBy(asc(uarItem.ownerUserId), asc(uarItem.createdAt));

        return results;
    }

    /**
     * Emit snapshot event
     */
    private async emitSnapshotEvent(
        companyId: string,
        userId: string,
        snapshotId: string,
        action: string,
        data: any = {}
    ): Promise<void> {
        await this.dbInstance.insert(outbox).values({
            id: ulid(),
            topic: 'itgc.evidence',
            payload: JSON.stringify({
                event_type: `snapshot_${action}`,
                company_id: companyId,
                user_id: userId,
                snapshot_id: snapshotId,
                ...data
            }),
            createdAt: new Date()
        });
    }

    /**
     * Emit pack event
     */
    private async emitPackEvent(
        companyId: string,
        userId: string,
        packId: string,
        action: string,
        data: any = {}
    ): Promise<void> {
        await this.dbInstance.insert(outbox).values({
            id: ulid(),
            topic: 'itgc.evidence',
            payload: JSON.stringify({
                event_type: `uar_pack_${action}`,
                company_id: companyId,
                user_id: userId,
                pack_id: packId,
                ...data
            }),
            createdAt: new Date()
        });
    }
}
