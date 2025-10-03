import { Inngest } from "inngest";
import { ArCashApplicationService } from "@/app/services/ar/cash-application";
import { pool } from "@/lib/db";
import { eq } from "drizzle-orm";
import { company } from "@aibos/adapters-db/schema";

export const inngest = new Inngest({ id: "aibos-erpBOS" });

export const arCashAppHourly = inngest.createFunction(
    { id: "ar.cashapp.hourly" },
    { cron: "0 * * * *" }, // Hourly
    async ({ step }) => {
        return await step.run("run-cash-app-for-all-companies", async () => {
            try {
                // Get all companies
                const companies = await pool
                    .select({ id: company.id })
                    .from(company);

                const results = [];
                const service = new ArCashApplicationService();

                for (const comp of companies) {
                    try {
                        // Run cash application for each company
                        const result = await service.runCashApplication(
                            comp.id,
                            { dry_run: false, min_confidence: 0.7 },
                            'system'
                        );
                        results.push({
                            company_id: comp.id,
                            success: true,
                            result
                        });
                    } catch (error) {
                        console.error(`Error running cash application for company ${comp.id}:`, error);
                        results.push({
                            company_id: comp.id,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }

                return {
                    ok: true,
                    message: `Cash application completed for ${companies.length} companies`,
                    results
                };
            } catch (error) {
                console.error('Error in AR cash application hourly job:', error);
                return {
                    ok: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
    }
);
