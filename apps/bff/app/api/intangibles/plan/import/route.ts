// M16.2: Intangibles CSV Import API Route
// Handles CSV import for Intangible plans with flexible column mapping

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { importIntangiblesCsv } from "../../../services/intangibles/importCsv";
import { CsvImportPayload } from "@contracts/assets_import";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, "capex:manage"); // Reusing capex:manage for intangibles
  if (capCheck instanceof Response) return capCheck;

  try {
    const form = await req.formData().catch(() => null);
    if (!form) return badRequest("multipart/form-data required");

    const file = form.get("file") as File | null;
    if (!file) return badRequest("file is required");

    const json = form.get("json") as string | null;
    let payload: CsvImportPayload | undefined;
    
    if (json) {
      try {
        payload = CsvImportPayload.parse(JSON.parse(json));
      } catch (error) {
        return badRequest(`Invalid JSON payload: ${error}`);
      }
    }

    const text = await file.text();
    if (!text.trim()) {
      return badRequest("CSV file is empty");
    }

    const result = await importIntangiblesCsv(auth.company_id, auth.user_id ?? "unknown", text, payload);
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`CSV import failed: ${error.message}`);
    }
    return badRequest("CSV import failed");
  }
}
