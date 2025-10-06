import { Inngest } from 'inngest';
import { db } from '@/lib/db';
import { eq, and, sql, lt } from 'drizzle-orm';
import { arSavedMethod, arPortalSession } from '@aibos/db-adapter/schema';

export const inngest = new Inngest({ id: 'aibos-erpBOS' });

// Daily job to auto-set default payment methods and cleanup
export const portalDailyJob = inngest.createFunction(
  { id: 'portal-daily' },
  { cron: '0 2 * * *' }, // Daily at 2 AM
  async ({ step }) => {
    return await step.run('portal-daily-maintenance', async () => {
      console.log('Running portal daily job');

      // Auto-set default payment methods
      await autoSetDefaultMethods();

      // Cleanup old sessions
      await cleanupOldSessions();
    });
  }
);

async function autoSetDefaultMethods() {
  // Find customers with multiple saved methods but no default
  const customersWithMultipleMethods = await db
    .select({
      customerId: arSavedMethod.customerId,
      companyId: arSavedMethod.companyId,
      count: sql<number>`count(${arSavedMethod.id})`.as('count'),
    })
    .from(arSavedMethod)
    .groupBy(arSavedMethod.companyId, arSavedMethod.customerId)
    .having(sql`count(${arSavedMethod.id}) > 1`);

  for (const customer of customersWithMultipleMethods) {
    const defaultMethod = await db
      .select()
      .from(arSavedMethod)
      .where(
        and(
          eq(arSavedMethod.companyId, customer.companyId),
          eq(arSavedMethod.customerId, customer.customerId),
          eq(arSavedMethod.isDefault, true)
        )
      );

    if (defaultMethod.length === 0) {
      // Set the most recently created method as default
      const latestMethod = await db
        .select()
        .from(arSavedMethod)
        .where(
          and(
            eq(arSavedMethod.companyId, customer.companyId),
            eq(arSavedMethod.customerId, customer.customerId)
          )
        )
        .orderBy(arSavedMethod.createdAt)
        .limit(1);

      if (latestMethod.length > 0) {
        await db
          .update(arSavedMethod)
          .set({ isDefault: true })
          .where(eq(arSavedMethod.id, latestMethod[0]!.id));
        console.log(`Set default method for customer ${customer.customerId}`);
      }
    }
  }
}

async function cleanupOldSessions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Delete old sessions
  await db
    .delete(arPortalSession)
    .where(and(lt(arPortalSession.createdAt, thirtyDaysAgo)));

  console.log(`Cleaned up old sessions older than 30 days`);
}
