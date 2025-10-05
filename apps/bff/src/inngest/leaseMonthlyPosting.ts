import { Inngest } from "inngest";
import { LeasePostingService } from "@/services/lease/posting";
import { LeaseScheduleService } from "@/services/lease/schedule";
import { LeaseDisclosureService } from "@/services/lease/remeasure";
import { ulid } from "ulid";
import { eq, and, gte } from "drizzle-orm";
import { lease, leaseEvent, leaseDisclosure } from "@aibos/db-adapter/schema";
import { db } from "@/lib/db";

export const inngest = new Inngest({ id: "aibos-erpBOS" });

const postingService = new LeasePostingService();
const scheduleService = new LeaseScheduleService();
const disclosureService = new LeaseDisclosureService();

/**
 * M28: Monthly Lease Posting Cron Job
 * Runs on the 1st of each month at 2 AM to process previous month's lease entries
 */
export const leaseMonthlyPosting = inngest.createFunction(
    { id: "lease-monthly-posting" },
    { cron: "0 2 1 * *" }, // 2 AM on 1st of each month
    async ({ event, step }: { event: any; step: any }) => {
        const currentDate = new Date();
        const previousMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
        const previousYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

        console.log(`Starting monthly lease posting for ${previousYear}-${previousMonth.toString().padStart(2, '0')}`);

        // Step 1: Build schedules for any new leases
        await step.run("build-schedules", async () => {
            try {
                // Get all active leases that might need schedule building
                const leases = await db
                    .select({ id: lease.id })
                    .from(lease)
                    .where(and(
                        eq(lease.status, 'ACTIVE'),
                        eq(lease.companyId, 'system') // This would be dynamic in production
                    ));

                for (const leaseRecord of leases) {
                    try {
                        await scheduleService.buildSchedule(leaseRecord.id);
                    } catch (error) {
                        console.error(`Failed to build schedule for lease ${leaseRecord.id}:`, error);
                    }
                }

                return { schedules_built: leases.length };
            } catch (error) {
                console.error("Error building schedules:", error);
                throw error;
            }
        });

        // Step 2: Run monthly posting for all companies
        await step.run("run-monthly-posting", async () => {
            try {
                // In production, this would iterate through all companies
                const companies = ['system']; // Placeholder for company list

                const results = [];
                for (const companyId of companies) {
                    try {
                        const result = await postingService.runMonthlyPosting(
                            companyId,
                            'system', // System user for automated posting
                            {
                                year: previousYear,
                                month: previousMonth,
                                dry_run: false
                            }
                        );

                        results.push({
                            company_id: companyId,
                            run_id: result.run_id,
                            status: result.status,
                            stats: result.stats
                        });
                    } catch (error) {
                        console.error(`Failed to post for company ${companyId}:`, error);
                        results.push({
                            company_id: companyId,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }

                return { posting_results: results };
            } catch (error) {
                console.error("Error running monthly posting:", error);
                throw error;
            }
        });

        // Step 3: Generate disclosures for the period
        await step.run("generate-disclosures", async () => {
            try {
                const companies = ['system']; // Placeholder for company list

                const disclosureResults = [];
                for (const companyId of companies) {
                    try {
                        const disclosures = await disclosureService.generateDisclosures(companyId, 'system', {
                            year: previousYear,
                            month: previousMonth
                        });

                        // Store disclosures in database
                        await db.insert(leaseDisclosure).values({
                            id: ulid(),
                            companyId,
                            year: previousYear,
                            month: previousMonth,
                            maturityJsonb: JSON.stringify(disclosures.maturity_analysis),
                            rollforwardJsonb: JSON.stringify(disclosures.rollforward),
                            wadr: disclosures.wadr.toString(),
                            shortTermExpense: disclosures.expenses.short_term.toString(),
                            lowValueExpense: disclosures.expenses.low_value.toString(),
                            variableExpense: disclosures.expenses.variable.toString(),
                            totalCashOutflow: disclosures.total_cash_outflow.toString(),
                            createdAt: new Date()
                        });

                        disclosureResults.push({
                            company_id: companyId,
                            disclosures_generated: true
                        });
                    } catch (error) {
                        console.error(`Failed to generate disclosures for company ${companyId}:`, error);
                        disclosureResults.push({
                            company_id: companyId,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }

                return { disclosure_results: disclosureResults };
            } catch (error) {
                console.error("Error generating disclosures:", error);
                throw error;
            }
        });

        // Step 4: Send completion notification
        await step.run("send-notification", async () => {
            try {
                // In production, this would send notifications to relevant stakeholders
                console.log(`Monthly lease posting completed for ${previousYear}-${previousMonth.toString().padStart(2, '0')}`);

                return { notification_sent: true };
            } catch (error) {
                console.error("Error sending notification:", error);
                // Don't throw here as this is not critical
                return { notification_sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });

        return {
            success: true,
            period: `${previousYear}-${previousMonth.toString().padStart(2, '0')}`,
            timestamp: new Date().toISOString()
        };
    }
);

/**
 * M28: Lease Schedule Rebuild Cron Job
 * Runs daily to rebuild schedules for leases with recent events
 */
export const leaseScheduleRebuild = inngest.createFunction(
    { id: "lease-schedule-rebuild" },
    { cron: "0 3 * * *" }, // 3 AM daily
    async ({ event, step }: { event: any; step: any }) => {
        console.log("Starting daily lease schedule rebuild");

        // Step 1: Find leases with recent events that need schedule rebuild
        await step.run("find-leases-with-events", async () => {
            try {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                const leasesWithEvents = await db
                    .select({
                        lease_id: leaseEvent.leaseId,
                        lease_code: lease.leaseCode,
                        company_id: lease.companyId,
                        event_kind: leaseEvent.kind,
                        effective_on: leaseEvent.effectiveOn
                    })
                    .from(leaseEvent)
                    .innerJoin(lease, eq(leaseEvent.leaseId, lease.id))
                    .where(and(
                        gte(leaseEvent.createdAt, yesterday),
                        eq(leaseEvent.kind, 'INDEX') // Only rebuild for indexation events
                    ));

                return { leases_found: leasesWithEvents.length, leases: leasesWithEvents };
            } catch (error) {
                console.error("Error finding leases with events:", error);
                throw error;
            }
        });

        // Step 2: Rebuild schedules for affected leases
        await step.run("rebuild-schedules", async () => {
            // This would be implemented based on the leases found in step 1
            // For now, return a placeholder
            return { schedules_rebuilt: 0 };
        });

        return {
            success: true,
            timestamp: new Date().toISOString()
        };
    }
);
