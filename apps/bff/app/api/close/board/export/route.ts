import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { CloseExportsService } from "@/services/close/exports";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "close:board:view");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams = {
        period: searchParams.get("period") || undefined,
        process: searchParams.get("process")?.split(",").filter(Boolean),
        status: searchParams.get("status")?.split(",").filter(Boolean),
        ownerId: searchParams.get("ownerId") || undefined,
        slaState: searchParams.get("slaState")?.split(",").filter(Boolean),
        kind: searchParams.get("kind")?.split(",").filter(Boolean),
    };

    const exportsService = new CloseExportsService();
    const csvContent = await exportsService.exportCsv(authCtx.company_id, queryParams);

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="close-board-${queryParams.period || 'all'}.csv"`,
        },
    });
});
