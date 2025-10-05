import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql } from "drizzle-orm";
import {
    closeItem,
    closeItemAction,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    CloseBulkActionType,
    CloseActionResponseType
} from "@aibos/contracts";

export class CloseActionsService {
    constructor(private dbInstance = db) { }

    /**
     * Apply a bulk action to close items
     */
    async applyAction(
        userId: string,
        data: CloseBulkActionType
    ): Promise<CloseActionResponseType[]> {
        const results: CloseActionResponseType[] = [];

        for (const itemId of data.itemIds) {
            try {
                const actionId = ulid();

                // Create action record
                const actionData = {
                    id: actionId,
                    itemId,
                    action: data.action,
                    payload: data.payload || null,
                    actorId: userId,
                };

                await this.dbInstance
                    .insert(closeItemAction)
                    .values(actionData);

                // Update item based on action
                await this.updateItemFromAction(itemId, data.action, data.payload, userId);

                // Emit outbox event
                await this.emitActionEvent(actionId, itemId, data.action, userId);

                results.push({
                    id: actionId,
                    itemId,
                    action: data.action,
                    payload: data.payload || null,
                    actorId: userId,
                    createdAt: new Date().toISOString(),
                });

            } catch (error) {
                console.error(`Failed to apply action ${data.action} to item ${itemId}:`, error);
                // Continue with other items even if one fails
            }
        }

        return results;
    }

    /**
     * Update close item based on action
     */
    private async updateItemFromAction(
        itemId: string,
        action: string,
        payload: any,
        userId: string
    ): Promise<void> {
        const updateData: any = {
            updatedBy: userId,
            updatedAt: new Date(),
        };

        switch (action) {
            case "ACK":
                // Acknowledge item - no status change, just mark as acknowledged
                break;

            case "REASSIGN":
                if (payload?.ownerId) {
                    updateData.ownerId = payload.ownerId;
                }
                break;

            case "DEFER":
                if (payload?.newDueDate) {
                    updateData.dueAt = new Date(payload.newDueDate);
                }
                if (payload?.reason) {
                    // Could store reason in a separate field or comment
                }
                break;

            case "COMPLETE":
                updateData.status = "DONE";
                break;

            case "REOPEN":
                updateData.status = "OPEN";
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        await this.dbInstance
            .update(closeItem)
            .set(updateData)
            .where(eq(closeItem.id, itemId));
    }

    /**
     * Emit outbox event for action
     */
    private async emitActionEvent(
        actionId: string,
        itemId: string,
        action: string,
        userId: string
    ): Promise<void> {
        const eventData = {
            actionId,
            itemId,
            action,
            actorId: userId,
            timestamp: new Date().toISOString(),
        };

        await this.dbInstance
            .insert(outbox)
            .values({
                id: ulid(),
                topic: "CLOSE_ITEM_ACTION",
                payload: JSON.stringify(eventData),
            });
    }

    /**
     * Get action history for an item
     */
    async getItemActions(itemId: string): Promise<CloseActionResponseType[]> {
        const actions = await this.dbInstance
            .select()
            .from(closeItemAction)
            .where(eq(closeItemAction.itemId, itemId))
            .orderBy(desc(closeItemAction.createdAt));

        return actions.map(action => ({
            id: action.id,
            itemId: action.itemId,
            action: action.action as any,
            payload: action.payload as Record<string, any> | null,
            actorId: action.actorId,
            createdAt: action.createdAt.toISOString(),
        }));
    }

    /**
     * Get action history for multiple items
     */
    async getBulkItemActions(itemIds: string[]): Promise<CloseActionResponseType[]> {
        if (itemIds.length === 0) return [];

        const actions = await this.dbInstance
            .select()
            .from(closeItemAction)
            .where(sql`${closeItemAction.itemId} = ANY(${itemIds})`)
            .orderBy(desc(closeItemAction.createdAt));

        return actions.map(action => ({
            id: action.id,
            itemId: action.itemId,
            action: action.action as any,
            payload: action.payload as Record<string, any> | null,
            actorId: action.actorId,
            createdAt: action.createdAt.toISOString(),
        }));
    }
}
