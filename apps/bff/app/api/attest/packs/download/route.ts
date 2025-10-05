import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { AttestPackService } from "@/services/attest";
import { PackDownloadReqSchema } from "@aibos/contracts";
import { ok } from "@/api/_kit";

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "attest:export");

    const authCtx = auth as AuthCtx;
    const { searchParams } = new URL(request.url);

    const taskId = searchParams.get("taskId");
    const format = searchParams.get("format") || "json";

    if (!taskId) {
        return ok({ error: "taskId is required" }, 400);
    }

    // Validate query parameters
    const validatedQuery = PackDownloadReqSchema.parse({ taskId, format });

    const packService = new AttestPackService();
    const result = await packService.downloadPack(
        validatedQuery.taskId,
        authCtx.company_id,
        validatedQuery.format
    );

    return new NextResponse(JSON.stringify(result.data), {
        headers: {
            "Content-Type": result.contentType,
            "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
    });
});
