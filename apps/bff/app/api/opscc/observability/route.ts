import { NextRequest, NextResponse } from "next/server";
import { PlaybookStudioService } from "../../../services";
import { ExecutionMetricsQuery, BlastRadiusQuery } from "@aibos/contracts";

const playbookStudio = new PlaybookStudioService();

/**
 * M27.2: Observability API Routes
 * 
 * Success/failure rates, p50/p95 durations, suppressed/executed counts
 */

export async function GET(request: NextRequest) {
    try {
        const companyId = request.headers.get("x-company-id");
        const { searchParams } = new URL(request.url);

        if (!companyId) {
            return NextResponse.json({ error: "Missing company context" }, { status: 400 });
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
                return NextResponse.json(metrics);

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
                return NextResponse.json(blastRadius);

            default:
                return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error getting observability data:", error);
        return NextResponse.json(
            { error: "Failed to get observability data" },
            { status: 500 }
        );
    }
}
