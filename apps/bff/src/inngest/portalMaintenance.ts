import { Inngest } from "inngest";
import { db } from "@/lib/db";
import { eq, lt } from "drizzle-orm";
import { arPortalSession, arGatewayWebhookDlq } from "@aibos/db-adapter/schema";
import { ArWebhookService } from "@/services/ar/webhook";
import type { GatewayWebhookReqType } from "@aibos/contracts";

export const inngest = new Inngest({ id: "aibos-erpBOS" });

// Hourly job to expire portal sessions and retry failed webhooks
export const portalMaintenanceJob = inngest.createFunction(
    { id: "portal-maintenance" },
    { cron: "0 * * * *" }, // Every hour
    async ({ step }) => {
        return await step.run("expire-portal-sessions", async () => {
            console.log("Running portal maintenance job");

            // Expire old portal sessions
            await expirePortalSessions();

            // Retry failed webhooks
            await retryFailedWebhooks('default-company'); // TODO: Get companyId from context
        });
    }
);

async function expirePortalSessions() {
    const now = new Date();
    const expiredSessions = await db
        .update(arPortalSession)
        .set({ usedAt: now }) // Mark as used/expired
        .where(lt(arPortalSession.expiresAt, now))
        .returning();

    console.log(`Expired ${expiredSessions.length} portal sessions`);
}

async function retryFailedWebhooks(companyId: string) {
    const webhookService = new ArWebhookService();
    await webhookService.retryFailedWebhooks(companyId);
}