import { Inngest } from "inngest";
import { ArCashApplicationService } from "@/services/ar/cash-application";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { company } from "@aibos/db-adapter/schema";

export const inngest = new Inngest({ id: "aibos-erpBOS" });

export const arCashAppHourly = inngest.createFunction(
    { id: "ar.cashapp.hourly" },
    { cron: "0 * * * *" }, // Hourly
    async ({ step }) => {
        return await step.run("run-cash-app-for-all-companies", async () => {
            try {
                // Get all companies
                const companies = await db
                    .select({ id: company.id })
                    .from(company);

                const results: Array<{
                    company_id: string;
                    success: boolean;
                    result?: any;
                    error?: string;
                }> = [];
                const service = new ArCashApplicationService();

                for (const comp of companies) {
                    try {
                        // Run cash application for each company
                        const result = await service.runCashApplication(
                            comp.id,
                            { dry_run: false, min_confidence: 0.7 }
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
) as any;
