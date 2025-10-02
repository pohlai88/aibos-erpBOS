// M16.3: Enhanced Bulk Posting with UI Draft Support
// Handles bulk posting with dry-run and draft caching

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { BulkPostRequest } from "@contracts/assets_import";
import { UiDraftCommitRequest, UiDraftCommitResponse } from "@contracts/ui_drafts";
import { bulkPostAssets } from "../../../services/assets/bulkPost";
import { putDraft, getDraft } from "../../../services/assets/uiDraft";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, "capex:manage");
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = BulkPostRequest.parse(await req.json());

    const result = await bulkPostAssets(
      auth.company_id,
      input.kind,
      input.year,
      input.month,
      input.dry_run,
      input.memo,
      input.plan_ids
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Bulk posting failed: ${error.message}`);
    }
    return badRequest("Bulk posting failed");
  }
}
