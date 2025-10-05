import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { ExecutionMetricsQuery, BlastRadiusQuery } from "@aibos/contracts";
import { withRouteErrors, ok } from "@/api/_kit";

const playbookStudio = new PlaybookStudioService();
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return ok({ error: "Missing company context" }, 400);
        }

        const endpoint = searchParams.get("endpoint");

        switch (endpoint) {
            case "metrics":
                const metricsQuery = ExecutionMetricsQuery.parse({
                    playbook_id: searchParams.get("playbook_id") || undefined,
                    from_date: searchParams.get("from_date") || undefined,
                    to_date: searchParams.get("to_date") || undefined,
                    group_by: (searchParams.get("group_by") as any) || "day",
                    limit: parseInt(searchParams.get("limit") || "30")
                });

                const metrics = await playbookStudio.getExecutionMetrics(companyId, metricsQuery);
                return ok(metrics);

            case "blast-radius":
                const blastQuery = BlastRadiusQuery.parse({
                    fire_id: searchParams.get("fire_id") || undefined,
                    playbook_id: searchParams.get("playbook_id") || undefined,
                    entity_type: searchParams.get("entity_type") || undefined,
                    from_date: searchParams.get("from_date") || undefined,
                    to_date: searchParams.get("to_date") || undefined,
                    limit: parseInt(searchParams.get("limit") || "100")
                });

                const blastRadius = await playbookStudio.getBlastRadius(companyId, blastQuery);
                return ok(blastRadius);

            default:
                return ok({ error: "Invalid endpoint" }, 400);
        }
    } catch (error) {
        console.error("Error getting observability data:", error);
        return ok({ error: "Failed to get observability data" }, 500);
    } });
