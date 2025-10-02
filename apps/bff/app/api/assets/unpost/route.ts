// M16.3: Unpost/Repost API Route
// Handles unposting and reposting of asset depreciation/amortization

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { UnpostRequest, UnpostResponse } from "@contracts/impairments";
import { unpostAssets, validateUnpostSafety } from "../../../services/assets/unpost";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, "capex:manage");
  if (capCheck instanceof Response) return capCheck;

  try {
    const input = UnpostRequest.parse(await req.json());

    // Validate unposting safety
    const safetyCheck = await validateUnpostSafety(
      auth.company_id,
      input.kind,
      input.year,
      input.month,
      input.plan_ids
    );

    if (!safetyCheck.safe && !input.dry_run) {
      return badRequest(`Unposting safety check failed: ${safetyCheck.warnings.join(", ")}`);
    }

    const result = await unpostAssets(
      auth.company_id,
      input.kind,
      input.year,
      input.month,
      input.plan_ids,
      input.dry_run
    );

    // Include safety warnings in response
    const response: UnpostResponse = {
      ...result,
      warnings: safetyCheck.warnings,
    };

    return ok(response);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`Failed to unpost assets: ${error.message}`);
    }
    return badRequest("Failed to unpost assets");
  }
}
