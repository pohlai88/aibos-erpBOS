// M16.2: CAPEX CSV Import API Route
// Handles CSV import for CAPEX plans with flexible column mapping

import { NextRequest } from 'next/server';
import { fileUploadResponse, serverError, badRequest } from '@/api/_lib/http';
import { validateFileUpload } from '@/api/_lib/file-upload';
import {
  withRouteErrors,
  rateLimit,
  logAuditAttempt,
  tooManyRequests,
} from '@/api/_kit';
import { requireAuth, requireCapability } from '@/lib/auth';
import { importCapexCsv } from '@/services/capex/importCsv';
import { CsvImportPayload } from '@aibos/contracts';

// Explicitly run on Node for predictable File/stream behavior on large CSVs
export const runtime = 'nodejs';

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'capex:manage');
  if (capCheck instanceof Response) return capCheck;

  // Rate limit file-upload attempts (company:user scope)
  const rl = await rateLimit({
    key: `upload:${auth.company_id}:${auth.user_id}`,
    limit: 5,
    windowMs: 60000,
  });
  if (!rl.ok) return tooManyRequests('Please retry later');

  // Route-level attempt audit (service emits post-commit audit on success)
  try {
    logAuditAttempt({
      action: 'import_attempt',
      module: 'file_upload',
      companyId: auth.company_id,
      actorId: auth.user_id,
      at: Date.now(),
    });
  } catch {}

  try {
    const validation = await validateFileUpload(req, []);
    if (validation.error) return validation.error;

    const { file, data } = validation;

    const json = data.json;
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
      return badRequest('CSV file is empty');
    }

    const result = await importCapexCsv(
      auth.company_id,
      auth.user_id ?? 'unknown',
      text,
      payload
    );
    return fileUploadResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(`CSV import failed: ${error.message}`);
    }
    return badRequest('CSV import failed');
  }
});
