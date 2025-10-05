import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray, isNull, isNotNull, lt, gte } from "drizzle-orm";
import {
    itBreakglass,
    itUser,
    itSystem,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    BreakglassOpenType,
    BreakglassCloseType,
    BreakglassResponseType
} from "@aibos/contracts";

export class ITGCBreakglassService {
    constructor(private dbInstance = db) { }

    /**
     * Open break-glass emergency access
     */
    async openBreakglass(
        companyId: string,
        userId: string,
        data: BreakglassOpenType
    ): Promise<BreakglassResponseType> {
        const breakglassId = ulid();

        const breakglassData = {
            id: breakglassId,
            companyId,
            systemId: data.system_id,
            userId: data.user_id,
            openedAt: new Date(),
            expiresAt: new Date(data.expires_at),
            ticket: data.ticket,
            reason: data.reason,
            closedAt: null,
            closedBy: null
        };

        await this.dbInstance.insert(itBreakglass).values(breakglassData);

        // Emit break-glass opened event
        await this.emitBreakglassEvent(companyId, userId, breakglassId, 'opened', {
            system_id: data.system_id,
            user_id: data.user_id,
            expires_at: data.expires_at,
            ticket: data.ticket
        });

        return {
            id: breakglassId,
            company_id: companyId,
            system_id: data.system_id,
            user_id: data.user_id,
            opened_at: breakglassData.openedAt.toISOString(),
            expires_at: data.expires_at,
            ticket: data.ticket,
            reason: data.reason,
            closed_at: undefined,
            closed_by: undefined
        };
    }

    /**
     * Close break-glass emergency access
     */
    async closeBreakglass(
        companyId: string,
        userId: string,
        data: BreakglassCloseType
    ): Promise<void> {
        const breakglass = await this.getBreakglass(companyId, data.breakglass_id);
        if (!breakglass) {
            throw new Error('Break-glass record not found');
        }

        if (breakglass.closed_at) {
            throw new Error('Break-glass access is already closed');
        }

        await this.dbInstance
            .update(itBreakglass)
            .set({
                closedAt: new Date(),
                closedBy: userId
            })
            .where(
                and(
                    eq(itBreakglass.id, data.breakglass_id),
                    eq(itBreakglass.companyId, companyId)
                )
            );

        // Emit break-glass closed event
        await this.emitBreakglassEvent(companyId, userId, data.breakglass_id, 'closed', {
            reason: data.reason
        });
    }

    /**
     * Get active break-glass records for a company
     */
    async getActiveBreakglass(companyId: string): Promise<BreakglassResponseType[]> {
        const results = await this.dbInstance
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
                closedBy: itBreakglass.closedBy,
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
            .from(itBreakglass)
            .leftJoin(itUser, eq(itBreakglass.userId, itUser.id))
            .leftJoin(itSystem, eq(itBreakglass.systemId, itSystem.id))
            .where(
                and(
                    eq(itBreakglass.companyId, companyId),
                    isNull(itBreakglass.closedAt)
                )
            )
            .orderBy(desc(itBreakglass.openedAt));

        return results.map(row => ({
            id: row.id,
            company_id: row.companyId,
            system_id: row.systemId,
            user_id: row.userId,
            opened_at: row.openedAt.toISOString(),
            expires_at: row.expiresAt.toISOString(),
            ticket: row.ticket,
            reason: row.reason,
            closed_at: row.closedAt?.toISOString(),
            closed_by: row.closedBy ?? undefined,
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
     * Get expired break-glass records that need cleanup
     */
    async getExpiredBreakglass(): Promise<BreakglassResponseType[]> {
        const results = await this.dbInstance
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
                closedBy: itBreakglass.closedBy,
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
            .from(itBreakglass)
            .leftJoin(itUser, eq(itBreakglass.userId, itUser.id))
            .leftJoin(itSystem, eq(itBreakglass.systemId, itSystem.id))
            .where(
                and(
                    isNull(itBreakglass.closedAt),
                    lt(itBreakglass.expiresAt, new Date())
                )
            )
            .orderBy(asc(itBreakglass.expiresAt));

        return results.map(row => ({
            id: row.id,
            company_id: row.companyId,
            system_id: row.systemId,
            user_id: row.userId,
            opened_at: row.openedAt.toISOString(),
            expires_at: row.expiresAt.toISOString(),
            ticket: row.ticket,
            reason: row.reason,
            closed_at: row.closedAt?.toISOString(),
            closed_by: row.closedBy ?? undefined,
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
     * Auto-close expired break-glass records
     */
    async autoCloseExpired(): Promise<{ closed_count: number }> {
        const expiredRecords = await this.getExpiredBreakglass();
        let closedCount = 0;

        for (const record of expiredRecords) {
            try {
                await this.dbInstance
                    .update(itBreakglass)
                    .set({
                        closedAt: new Date(),
                        closedBy: 'SYSTEM'
                    })
                    .where(eq(itBreakglass.id, record.id));

                // Emit expired event
                await this.emitBreakglassEvent(
                    record.company_id,
                    'SYSTEM',
                    record.id,
                    'expired',
                    {
                        system_id: record.system_id,
                        user_id: record.user_id,
                        ticket: record.ticket
                    }
                );

                closedCount++;
            } catch (error) {
                console.error(`Failed to auto-close break-glass ${record.id}:`, error);
            }
        }

        return { closed_count: closedCount };
    }

    /**
     * Get break-glass history for a company
     */
    async getBreakglassHistory(
        companyId: string,
        limit = 50,
        offset = 0
    ): Promise<BreakglassResponseType[]> {
        const results = await this.dbInstance
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
                closedBy: itBreakglass.closedBy,
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
            .from(itBreakglass)
            .leftJoin(itUser, eq(itBreakglass.userId, itUser.id))
            .leftJoin(itSystem, eq(itBreakglass.systemId, itSystem.id))
            .where(eq(itBreakglass.companyId, companyId))
            .orderBy(desc(itBreakglass.openedAt))
            .limit(limit)
            .offset(offset);

        return results.map(row => ({
            id: row.id,
            company_id: row.companyId,
            system_id: row.systemId,
            user_id: row.userId,
            opened_at: row.openedAt.toISOString(),
            expires_at: row.expiresAt.toISOString(),
            ticket: row.ticket,
            reason: row.reason,
            closed_at: row.closedAt?.toISOString(),
            closed_by: row.closedBy ?? undefined,
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
     * Get a specific break-glass record
     */
    private async getBreakglass(companyId: string, breakglassId: string): Promise<any> {
        const results = await this.dbInstance
            .select()
            .from(itBreakglass)
            .where(
                and(
                    eq(itBreakglass.id, breakglassId),
                    eq(itBreakglass.companyId, companyId)
                )
            )
            .limit(1);

        return results[0];
    }

    /**
     * Emit break-glass event
     */
    private async emitBreakglassEvent(
        companyId: string,
        userId: string,
        breakglassId: string,
        action: string,
        data: any = {}
    ): Promise<void> {
        await this.dbInstance.insert(outbox).values({
            id: ulid(),
            topic: 'itgc.breakglass',
            payload: JSON.stringify({
                event_type: `breakglass_${action}`,
                company_id: companyId,
                user_id: userId,
                breakglass_id: breakglassId,
                ...data
            }),
            createdAt: new Date()
        });
    }
}
