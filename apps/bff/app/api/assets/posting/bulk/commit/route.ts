// M16.3: Bulk Posting Commit Route
// Handles committing stored drafts for bulk posting

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { UiDraftCommitRequest, UiDraftCommitResponse } from "@contracts/ui_drafts";
import { bulkPostAssets } from "../../../services/assets/bulkPost";
import { getDraft } from "../../../services/assets/uiDraft";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, "capex:manage");
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = UiDraftCommitRequest.parse(await req.json());

    // Get stored draft
    const draft = await getDraft(auth.company_id, input.kind, input.year, input.month);
    if (!draft) {
      return badRequest("No draft found for the specified period");
    }

    // Execute actual posting using draft data
    const result = await bulkPostAssets(
      auth.company_id,
      input.kind,
      input.year,
      input.month,
      input.dry_run,
      draft.payload.memo,
      draft.payload.plan_ids
    );

    const response: UiDraftCommitResponse = {
      committed: true,
      draft_id: draft.id,
      posted_journals: result.posted_journals,
      warnings: [],
    };

    return ok(response);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Failed to commit draft: ${error.message}`);
    }
    return badRequest("Failed to commit draft");
  }
}
