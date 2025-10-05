import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, inArray, gte, lt, count } from "drizzle-orm";
import {
    closeItem,
    closeItemComment,
    closeItemAction,
    closeItemEvdLink,
    closeSlaPolicy,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    CloseItemQueryType,
    CloseItemUpsertType,
    CloseItemResponseType,
    BoardResponseType,
    CloseCommentCreateType,
    CloseCommentResponseType,
    CloseEvdLinkCreateType,
    CloseEvdLinkResponseType
} from "@aibos/contracts";

export class CloseBoardService {
    constructor(private dbInstance = db) { }

    /**
     * List close board items with filtering and pagination
     */
    async listBoard(
        companyId: string,
        query: CloseItemQueryType
    ): Promise<BoardResponseType> {
        const conditions = [eq(closeItem.companyId, companyId)];

        if (query.period) {
            conditions.push(eq(closeItem.period, query.period));
        }

        if (query.process && query.process.length > 0) {
            conditions.push(inArray(closeItem.process, query.process));
        }

        if (query.status && query.status.length > 0) {
            conditions.push(inArray(closeItem.status, query.status));
        }

        if (query.ownerId) {
            conditions.push(eq(closeItem.ownerId, query.ownerId));
        }

        if (query.slaState && query.slaState.length > 0) {
            conditions.push(inArray(closeItem.slaState, query.slaState));
        }

        if (query.kind && query.kind.length > 0) {
            conditions.push(inArray(closeItem.kind, query.kind));
        }

        // Get total count
        const [totalResult] = await this.dbInstance
            .select({ count: count() })
            .from(closeItem)
            .where(and(...conditions));

        const total = totalResult?.count || 0;

        // Get paginated results
        const items = await this.dbInstance
            .select({
                id: closeItem.id,
                period: closeItem.period,
                kind: closeItem.kind,
                title: closeItem.title,
                process: closeItem.process,
                ownerId: closeItem.ownerId,
                dueAt: closeItem.dueAt,
                status: closeItem.status,
                slaState: closeItem.slaState,
                agingDays: closeItem.agingDays,
                severity: closeItem.severity,
            })
            .from(closeItem)
            .where(and(...conditions))
            .orderBy(desc(closeItem.slaState), desc(closeItem.agingDays), asc(closeItem.dueAt))
            .limit(query.limit)
            .offset(query.offset);

        return {
            items: items.map(item => this.mapCloseItem(item)),
            total,
            hasMore: query.offset + query.limit < total,
        };
    }

    /**
     * Map database result to response type
     */
    private mapCloseItem(result: any) {
        return {
            id: result.id,
            companyId: result.companyId,
            period: result.period,
            kind: result.kind,
            refId: result.refId,
            title: result.title,
            process: result.process as "R2R" | "P2P" | "O2C" | "Treasury" | "Tax",
            ownerId: result.ownerId,
            dueAt: result.dueAt.toISOString(),
            status: result.status as "OPEN" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "DEFERRED",
            severity: result.severity as "LOW" | "NORMAL" | "HIGH" | "CRITICAL",
            agingDays: result.agingDays,
            slaState: result.slaState as "OK" | "DUE_SOON" | "LATE" | "ESCALATED",
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
        };
    }

    /**
     * Create or update a close item
     */
    async upsertItem(
        companyId: string,
        userId: string,
        data: CloseItemUpsertType
    ): Promise<CloseItemResponseType> {
        const itemId = ulid();

        const itemData = {
            id: itemId,
            companyId,
            period: data.period,
            kind: data.kind,
            refId: data.refId,
            title: data.title,
            process: data.process,
            ownerId: data.ownerId || null,
            dueAt: new Date(data.dueAt),
            status: data.status,
            severity: data.severity,
            agingDays: 0,
            slaState: "OK" as const,
            createdBy: userId,
            updatedBy: userId,
        };

        await this.dbInstance
            .insert(closeItem)
            .values(itemData)
            .onConflictDoUpdate({
                target: [closeItem.companyId, closeItem.period, closeItem.kind, closeItem.refId],
                set: {
                    title: itemData.title,
                    process: itemData.process,
                    ownerId: itemData.ownerId,
                    dueAt: itemData.dueAt,
                    status: itemData.status,
                    severity: itemData.severity,
                    updatedBy: userId,
                    updatedAt: new Date(),
                },
            });

        // Return the created/updated item
        const [result] = await this.dbInstance
            .select()
            .from(closeItem)
            .where(eq(closeItem.id, itemId));

        if (!result) {
            throw new Error("Failed to create close item");
        }

        return {
            id: result.id,
            companyId: result.companyId,
            period: result.period,
            kind: result.kind,
            refId: result.refId,
            title: result.title,
            process: result.process as "R2R" | "P2P" | "O2C" | "Treasury" | "Tax",
            ownerId: result.ownerId,
            dueAt: result.dueAt.toISOString(),
            status: result.status as "OPEN" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "DEFERRED",
            severity: result.severity as "LOW" | "NORMAL" | "HIGH" | "CRITICAL",
            agingDays: result.agingDays,
            slaState: result.slaState as "OK" | "DUE_SOON" | "LATE" | "ESCALATED",
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
        };
    }

    /**
     * Bulk create items from various sources
     */
    async bulkCreateFromSources(
        companyId: string,
        userId: string,
        period: string,
        sources: string[] = ["controls", "sox", "deficiencies", "flux", "certs", "tasks"]
    ): Promise<{ ingested: number; skipped: number; errors: string[] }> {
        const errors: string[] = [];
        let ingested = 0;
        let skipped = 0;

        try {
            // Ingest from M26.1 controls runs
            if (sources.includes("controls")) {
                const controlsResult = await this.ingestFromControls(companyId, userId, period);
                ingested += controlsResult.ingested;
                skipped += controlsResult.skipped;
                errors.push(...controlsResult.errors);
            }

            // Ingest from M26.5 SOX tests
            if (sources.includes("sox")) {
                const soxResult = await this.ingestFromSox(companyId, userId, period);
                ingested += soxResult.ingested;
                skipped += soxResult.skipped;
                errors.push(...soxResult.errors);
            }

            // Ingest from M26.5 deficiencies
            if (sources.includes("deficiencies")) {
                const deficiencyResult = await this.ingestFromDeficiencies(companyId, userId, period);
                ingested += deficiencyResult.ingested;
                skipped += deficiencyResult.skipped;
                errors.push(...deficiencyResult.errors);
            }

            // Ingest from flux comments
            if (sources.includes("flux")) {
                const fluxResult = await this.ingestFromFlux(companyId, userId, period);
                ingested += fluxResult.ingested;
                skipped += fluxResult.skipped;
                errors.push(...fluxResult.errors);
            }

            // Ingest from certifications
            if (sources.includes("certs")) {
                const certResult = await this.ingestFromCerts(companyId, userId, period);
                ingested += certResult.ingested;
                skipped += certResult.skipped;
                errors.push(...certResult.errors);
            }

            // Ingest manual tasks
            if (sources.includes("tasks")) {
                const taskResult = await this.ingestFromTasks(companyId, userId, period);
                ingested += taskResult.ingested;
                skipped += taskResult.skipped;
                errors.push(...taskResult.errors);
            }

        } catch (error) {
            errors.push(`Bulk ingest failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return { ingested, skipped, errors };
    }

    /**
     * Add a comment to a close item
     */
    async addComment(
        userId: string,
        data: CloseCommentCreateType
    ): Promise<CloseCommentResponseType> {
        const commentId = ulid();

        const commentData = {
            id: commentId,
            itemId: data.itemId,
            authorId: userId,
            body: data.body,
            mentions: data.mentions,
        };

        await this.dbInstance
            .insert(closeItemComment)
            .values(commentData);

        const [result] = await this.dbInstance
            .select()
            .from(closeItemComment)
            .where(eq(closeItemComment.id, commentId));

        if (!result) {
            throw new Error("Failed to create comment");
        }

        return {
            id: result.id,
            itemId: result.itemId,
            authorId: result.authorId,
            body: result.body,
            mentions: result.mentions ?? [],
            createdAt: result.createdAt.toISOString(),
        };
    }

    /**
     * Link evidence to a close item
     */
    async linkEvidence(
        data: CloseEvdLinkCreateType
    ): Promise<CloseEvdLinkResponseType> {
        const linkId = ulid();

        const linkData = {
            id: linkId,
            itemId: data.itemId,
            evdRecordId: data.evdRecordId,
        };

        await this.dbInstance
            .insert(closeItemEvdLink)
            .values(linkData);

        const [result] = await this.dbInstance
            .select()
            .from(closeItemEvdLink)
            .where(eq(closeItemEvdLink.id, linkId));

        if (!result) {
            throw new Error("Failed to create evidence link");
        }

        return {
            id: result.id,
            itemId: result.itemId,
            evdRecordId: result.evdRecordId,
        };
    }

    /**
     * Private helper methods for ingesting from various sources
     */
    private async ingestFromControls(
        companyId: string,
        userId: string,
        period: string
    ): Promise<{ ingested: number; skipped: number; errors: string[] }> {
        // Implementation would query ctrl_run table and create AUTO_CTRL items
        // This is a placeholder - actual implementation would depend on the controls schema
        return { ingested: 0, skipped: 0, errors: [] };
    }

    private async ingestFromSox(
        companyId: string,
        userId: string,
        period: string
    ): Promise<{ ingested: number; skipped: number; errors: string[] }> {
        // Implementation would query sox_test table and create SOX_TEST items
        // This is a placeholder - actual implementation would depend on the SOX schema
        return { ingested: 0, skipped: 0, errors: [] };
    }

    private async ingestFromDeficiencies(
        companyId: string,
        userId: string,
        period: string
    ): Promise<{ ingested: number; skipped: number; errors: string[] }> {
        // Implementation would query sox_deficiency table and create DEFICIENCY items
        // This is a placeholder - actual implementation would depend on the SOX schema
        return { ingested: 0, skipped: 0, errors: [] };
    }

    private async ingestFromFlux(
        companyId: string,
        userId: string,
        period: string
    ): Promise<{ ingested: number; skipped: number; errors: string[] }> {
        // Implementation would query flux_comment table and create FLUX items
        // This is a placeholder - actual implementation would depend on the flux schema
        return { ingested: 0, skipped: 0, errors: [] };
    }

    private async ingestFromCerts(
        companyId: string,
        userId: string,
        period: string
    ): Promise<{ ingested: number; skipped: number; errors: string[] }> {
        // Implementation would query cert_statement table and create CERT items
        // This is a placeholder - actual implementation would depend on the cert schema
        return { ingested: 0, skipped: 0, errors: [] };
    }

    private async ingestFromTasks(
        companyId: string,
        userId: string,
        period: string
    ): Promise<{ ingested: number; skipped: number; errors: string[] }> {
        // Implementation would create manual TASK items
        // This is a placeholder for manual task creation
        return { ingested: 0, skipped: 0, errors: [] };
    }
}
