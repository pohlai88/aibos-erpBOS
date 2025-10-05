import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { CloseExportsService } from "@/services/close/exports";
import { CloseSummaryRequestSchema } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:board:export");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams = {
        period: searchParams.get("period"),
        includePdf: searchParams.get("includePdf") === "true",
    };

    // Validate query parameters
    const validatedQuery = CloseSummaryRequestSchema.parse(queryParams);

    const exportsService = new CloseExportsService();
    const result = await exportsService.buildSummaryPack(authCtx.company_id, validatedQuery);

    return ok(result);
});
