import { NextRequest } from "next/server";
import { fileUploadResponse, serverError } from "@/api/_lib/http";
import { validateFileUpload } from "@/api/_lib/file-upload";
import { rateLimit } from "@/api/_kit/rate";
import { tooManyRequests } from "@/api/_kit";
import { logAuditAttempt } from "@/api/_kit/audit";
import { withRouteErrors } from "@/api/_kit";

// Explicitly run on Node for predictable File/stream behavior on large CSVs
export const runtime = "nodejs";

import { ok, badRequest, forbidden } from "../../../../lib/http";
import { requireAuth, requireCapability } from "../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../lib/route-utils";
import { importRatesCsv } from "../../../../services/fx/ratesCsv";

export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "fx:manage");
  // Rate limit file-upload attempts (company:user scope)
  {
    const rl = await rateLimit({
      key: `upload:${auth.company_id}:${auth.user_id}`,
      limit: 5,
      windowMs: 60000
    });
    if (!rl.ok) return tooManyRequests("Please retry later");
  }
  // Route-level attempt audit (service emits post-commit audit on success)
  try {
    // best-effort; do not block route on audit failure
    // `file` may not be resolved yet; we emit size later if available (secondary call below if desired)
    logAuditAttempt({
      action: "import_attempt",
      module: "file_upload",
      companyId: auth.company_id,
      actorId: auth.user_id,
      at: Date.now()
    });
  } catch {}
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
