import { NextRequest, NextResponse } from "next/server";
import { RevModificationService } from "@/services/rb/modifications";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { RevisionQuery, RevisionQueryType } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const modificationService = new RevModificationService();

// GET /api/rev/revisions - List schedule revisions
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:recognize");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query: RevisionQueryType = {
            contract_id: url.searchParams.get('contract_id') || undefined,
            pob_id: url.searchParams.get('pob_id') || undefined,
            year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
            month: url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : undefined,
            cause: url.searchParams.get('cause') as any || undefined,
            limit: parseInt(url.searchParams.get('limit') || '50'),
            offset: parseInt(url.searchParams.get('offset') || '0')
        };

        const result = await modificationService.queryRevisions(auth.company_id, query);
        return ok(result);
    } catch (error) {
        console.error("Error listing revisions:", error);
        return serverError("Failed to list revisions");
    } });
