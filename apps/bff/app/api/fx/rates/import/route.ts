import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { importRatesCsv } from "../../../services/fx/ratesCsv";

export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "fx:manage");
    if (isResponse(capCheck)) return capCheck;

    try {
        const form = await req.formData().catch(() => null);
        if (!form) return badRequest("multipart/form-data required");

        const file = form.get("file") as File | null;
        if (!file) return badRequest("file required");

        const mapping = form.get("mapping") ? JSON.parse(String(form.get("mapping"))) : undefined;

        const res = await importRatesCsv(
            auth.company_id,
            auth.api_key_id ?? "system",
            await file.text(),
            mapping
        );

        return ok(res);
    } catch (error) {
        console.error("Error importing FX rates CSV:", error);
        return badRequest("Failed to import CSV");
    }
});
