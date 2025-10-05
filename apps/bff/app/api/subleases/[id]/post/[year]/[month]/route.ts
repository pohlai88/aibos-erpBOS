import { NextRequest, NextResponse } from "next/server";
import { SubleasePostingService } from "@/services/lease/sublease-posting";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { SubleasePostingReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const subleasePostingService = new SubleasePostingService();

// POST /api/subleases/:id/post/:year/:month - Post monthly sublease entries
// POST /api/subleases/:id/post/init - Post initial sublease recognition
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string; year: string; month: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:lessor_post");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const dryRun = url.searchParams.get('dry_run') === '1';

        const validatedData = SubleasePostingReq.parse({
            subleaseId: params.id,
            year: parseInt(params.year),
            month: parseInt(params.month),
            dryRun
        });

        const result = await subleasePostingService.postMonthlyEntries(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid posting data");
        }

        console.error("Error posting sublease entries:", error);
        return serverError("Failed to post sublease entries");
    } });
export const PUT = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:lessor_post");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const dryRun = url.searchParams.get('dry_run') === '1';

        const result = await subleasePostingService.postInitialRecognition(
            auth.company_id,
            auth.user_id,
            params.id,
            dryRun
        );

        return ok(result);
    } catch (error) {
        console.error("Error posting initial sublease recognition:", error);
        return serverError("Failed to post initial sublease recognition");
    } });
