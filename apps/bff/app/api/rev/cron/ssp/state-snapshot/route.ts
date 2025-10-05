import { NextRequest, NextResponse } from "next/server";
import { RevAlertsService } from "@/services/revenue/alerts";
import { ok, serverError } from "@/api/_lib/http";
import { withRouteErrors } from "@/api/_kit";

const alertsService = new RevAlertsService();

// POST /api/rev/cron/ssp/state-snapshot - Weekly SSP state snapshot for audit diffing
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        // Get all companies (would be from actual company service)
        const companies = ["company-1", "company-2"]; // Placeholder

        const results = [];

        for (const companyId of companies) {
            try {
                const snapshot = await alertsService.generateSspStateSnapshot(companyId);
                results.push({
                    company_id: companyId,
                    snapshot_id: snapshot.snapshot_id,
                    total_entries: snapshot.total_entries,
                    currencies: snapshot.currencies,
                    methods: snapshot.methods,
                    created_at: snapshot.created_at
                });
            } catch (error) {
                console.error(`Error generating SSP state snapshot for company ${companyId}:`, error);
                results.push({
                    company_id: companyId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        return ok({
            message: "SSP state snapshot completed",
            companies_processed: companies.length,
            results
        });
    } catch (error) {
        console.error("Error in SSP state snapshot cron job:", error);
        return serverError("Failed to run SSP state snapshot");
    } });
