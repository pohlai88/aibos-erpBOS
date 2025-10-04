import { Inngest } from "inngest";
import { db } from "@/lib/db";
import { closeTask, closeRun, closePolicy, outbox } from "@aibos/db-adapter/schema";
import { eq, and, sql } from "drizzle-orm";
import { logLine } from "@/lib/log";
import { ulid } from "ulid";

export const inngest = new Inngest({ id: "aibos-erpBOS" });

function localNow(tz: string) {
    const d = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        year: "numeric",
        month: "2-digit"
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
    return {
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        year: Number(parts.year),
        month: Number(parts.month)
    };
}

export const closeReminders = inngest.createFunction(
    { id: "close.reminders" },
    { cron: "*/10 * * * *" }, // Every 10 minutes
    async ({ step }) => {
        return await step.run("check-reminders", async () => {
            // Get all companies with close policies
            const companies = await db
                .select({ companyId: closePolicy.companyId, tz: closePolicy.tz, reminderCadenceMins: closePolicy.reminderCadenceMins })
                .from(closePolicy);

            let totalReminders = 0;

            for (const company of companies) {
                const now = localNow(company.tz);

                // Check if it's time to send reminders for this company
                const lastReminder = await db
                    .select()
                    .from(closeTask)
                    .where(and(
                        eq(closeTask.runId, ""), // Placeholder for last reminder check
                        sql`${closeTask.updatedAt} > NOW() - INTERVAL '${company.reminderCadenceMins} minutes'`
                    ))
                    .limit(1);

                if (lastReminder.length > 0) {
                    continue; // Skip if reminder was sent recently
                }

                // Find tasks approaching SLA deadline
                const approachingSla = await db
                    .select()
                    .from(closeTask)
                    .where(and(
                        sql`${closeTask.slaDueAt} IS NOT NULL`,
                        sql`${closeTask.slaDueAt} BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`,
                        sql`${closeTask.status} NOT IN ('DONE', 'REJECTED')`
                    ));

                // Find overdue tasks
                const overdueTasks = await db
                    .select()
                    .from(closeTask)
                    .where(and(
                        sql`${closeTask.slaDueAt} IS NOT NULL`,
                        sql`${closeTask.slaDueAt} < NOW()`,
                        sql`${closeTask.status} NOT IN ('DONE', 'REJECTED')`
                    ));

                // Send reminders for approaching SLA tasks
                for (const task of approachingSla) {
                    await step.run(`reminder-${task.id}`, async () => {
                        // Emit reminder event to outbox
                        await db.insert(outbox).values({
                            id: ulid(),
                            topic: "CLOSE_REMINDER",
                            payload: JSON.stringify({
                                type: "SLA_APPROACHING",
                                companyId: company.companyId,
                                taskId: task.id,
                                taskCode: task.code,
                                taskTitle: task.title,
                                owner: task.owner,
                                slaDueAt: task.slaDueAt?.toISOString(),
                                severity: "WARNING"
                            })
                        });
                        totalReminders++;
                    });
                }

                // Send urgent reminders for overdue tasks
                for (const task of overdueTasks) {
                    await step.run(`urgent-${task.id}`, async () => {
                        // Emit urgent reminder event to outbox
                        await db.insert(outbox).values({
                            id: ulid(),
                            topic: "CLOSE_REMINDER",
                            payload: JSON.stringify({
                                type: "SLA_BREACH",
                                companyId: company.companyId,
                                taskId: task.id,
                                taskCode: task.code,
                                taskTitle: task.title,
                                owner: task.owner,
                                slaDueAt: task.slaDueAt?.toISOString(),
                                severity: "CRITICAL"
                            })
                        });
                        totalReminders++;
                    });
                }
            }

            logLine({
                msg: `Sent ${totalReminders} close reminders`,
                reminders_sent: totalReminders
            });
            return { reminders_sent: totalReminders };
        });
    }
);

export const kpiComputation = inngest.createFunction(
    { id: "close.kpi.computation" },
    { cron: "15 1 * * *" }, // Daily at 01:15 UTC
    async ({ step }) => {
        return await step.run("compute-kpis", async () => {
            // Get all companies
            const companies = await db
                .select({ companyId: closePolicy.companyId })
                .from(closePolicy);

            let totalKpis = 0;

            for (const company of companies) {
                await step.run(`kpi-${company.companyId}`, async () => {
                    // Import KpiService dynamically to avoid circular imports
                    const { KpiService } = await import("@/services/close/kpi");
                    const kpiService = new KpiService();

                    await kpiService.computeKpis(company.companyId);
                    totalKpis++;
                });
            }

            logLine({
                msg: `Computed KPIs for ${totalKpis} companies`,
                companies_processed: totalKpis
            });
            return { companies_processed: totalKpis };
        });
    }
);

export const automatedFluxRuns = inngest.createFunction(
    { id: "close.flux.automated" },
    { cron: "0 2 1 * *" }, // Monthly on the 1st at 02:00 UTC
    async ({ step }) => {
        return await step.run("run-flux-analysis", async () => {
            // Get all companies
            const companies = await db
                .select({ companyId: closePolicy.companyId })
                .from(closePolicy);

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            let totalRuns = 0;

            for (const company of companies) {
                await step.run(`flux-${company.companyId}`, async () => {
                    // Import FluxEngineService dynamically to avoid circular imports
                    const { FluxEngineService } = await import("@/services/flux/engine");
                    const fluxService = new FluxEngineService();

                    // Run flux analysis comparing previous month to current month
                    await fluxService.runFluxAnalysis(company.companyId, "system", {
                        base: { y: previousYear, m: previousMonth },
                        cmp: { y: currentYear, m: currentMonth },
                        present: "USD",
                        scope: "PL",
                        dim: "ACCOUNT"
                    });

                    totalRuns++;
                });
            }

            logLine({
                msg: `Ran automated flux analysis for ${totalRuns} companies`,
                flux_runs: totalRuns
            });
            return { flux_runs: totalRuns };
        });
    }
);
