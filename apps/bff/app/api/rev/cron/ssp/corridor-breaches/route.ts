import { NextRequest, NextResponse } from "next/server";
import { RevAlertsService } from "@/services/revenue/alerts";
import { ok, serverError } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const alertsService = new RevAlertsService();

// POST /api/rev/cron/ssp/corridor-breaches - Daily corridor breach check (02:00 UTC)
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        // Get all companies (would be from actual company service)
        const companies = ["company-1", "company-2"]; // Placeholder

        const results = [];

        for (const companyId of companies) {
            try {
                const result = await alertsService.checkCorridorBreaches(companyId);
                results.push({
                    company_id: companyId,
                    breaches_found: result.breaches.length,
                    alert_sent: result.alert_sent,
                    breaches: result.breaches
                });
            } catch (error) {
                console.error(`Error checking corridor breaches for company ${companyId}:`, error);
                results.push({
                    company_id: companyId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        return ok({
            message: "Corridor breach check completed",
            companies_processed: companies.length,
            results
        });
    } catch (error) {
        console.error("Error in corridor breach cron job:", error);
        return serverError("Failed to run corridor breach check");
    } });
