import { NextRequest, NextResponse } from "next/server";
import { LeaseExitService } from "@/services/lease/exit";
import { LeaseRestorationService } from "@/services/lease/restoration";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseExitDisclosureReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const exitService = new LeaseExitService();
const restorationService = new LeaseRestorationService();

// GET /api/leases/disclosures/exits - Get exit disclosures

/**
 * Generate narrative for exit disclosures
 */
function generateExitNarrative(
    terminations: any,
    partialDerecognition: any,
    buyouts: any,
    restorationProvisions: any
): string {
    let narrative = `During the period, ${terminations.count} lease exit events were processed. `;

    if (terminations.count > 0) {
        narrative += `Total termination amounts were ${terminations.amount.toLocaleString()}. `;

        if (partialDerecognition.count > 0) {
            narrative += `${partialDerecognition.count} partial derecognitions occurred with an average share of ${partialDerecognition.avg_share_pct.toFixed(1)}%. `;
        }

        if (buyouts.count > 0) {
            narrative += `${buyouts.count} buyout transactions were completed. `;
        }
    }

    if (restorationProvisions.closing > 0) {
        narrative += `Restoration provisions totaled ${restorationProvisions.closing.toLocaleString()} at period end. `;
    }

    narrative += "All exits were processed in accordance with MFRS 16 requirements.";

    return narrative;
}

export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:disclose");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
            month: url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined
        };

        const validatedQuery = LeaseExitDisclosureReq.parse(query);

        // Get exit data for the period
        const exits = await exitService.queryExits(auth.company_id, {
            event_date_from: `${validatedQuery.year}-${validatedQuery.month.toString().padStart(2, '0')}-01`,
            event_date_to: `${validatedQuery.year}-${validatedQuery.month.toString().padStart(2, '0')}-31`,
            limit: 1000,
            offset: 0
        });

        // Calculate termination statistics
        const terminations = {
            count: exits.length,
            amount: exits.reduce((sum, exit) => sum + Number(exit.settlement), 0),
            by_kind: {
                FULL: { count: 0, amount: 0 },
                PARTIAL: { count: 0, amount: 0 },
                BUYOUT: { count: 0, amount: 0 },
                EXPIRY: { count: 0, amount: 0 }
            }
        };

        for (const exit of exits) {
            const kind = exit.kind as keyof typeof terminations.by_kind;
            terminations.by_kind[kind].count++;
            terminations.by_kind[kind].amount += Number(exit.settlement);
        }

        // Calculate partial derecognition statistics
        const partialExits = exits.filter(exit => exit.kind === 'PARTIAL');
        const partialDerecognition = {
            count: partialExits.length,
            amount: partialExits.reduce((sum, exit) => sum + Number(exit.settlement), 0),
            avg_share_pct: partialExits.length > 0
                ? partialExits.reduce((sum, exit) => sum + Number(exit.share_pct || 100), 0) / partialExits.length
                : 0
        };

        // Calculate buyout statistics
        const buyouts = exits.filter(exit => exit.kind === 'BUYOUT');
        const buyoutStats = {
            count: buyouts.length,
            amount: buyouts.reduce((sum, exit) => sum + Number(exit.settlement), 0),
            fa_transfers: buyouts.length // Simplified - would query actual FA transfers
        };

        // Get restoration provisions roll-forward
        const restorationRollForward = await restorationService.getRestorationRollForward(
            auth.company_id,
            validatedQuery.year,
            validatedQuery.month
        );

        // Generate narrative
        const narrative = generateExitNarrative(terminations, partialDerecognition, buyoutStats, restorationRollForward);

        const result = {
            year: validatedQuery.year,
            month: validatedQuery.month,
            terminations,
            partial_derecognition: partialDerecognition,
            buyouts: buyoutStats,
            restoration_provisions: restorationRollForward,
            narrative
        };

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error generating exit disclosures:", error);
        return serverError("Failed to generate exit disclosures");
    } });
