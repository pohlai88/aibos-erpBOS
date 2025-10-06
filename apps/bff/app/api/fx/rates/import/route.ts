import { NextRequest } from 'next/server';
import { fileUploadResponse, badRequest } from '@/api/_lib/http';
import { validateFileUpload } from '@/api/_lib/file-upload';
import {
  withRouteErrors,
  rateLimit,
  logAuditAttempt,
  tooManyRequests,
} from '@/api/_kit';
import { requireAuth, requireCapability } from '@/lib/auth';
import { importRatesCsv } from '@/services/fx/ratesCsv';

// Explicitly run on Node for predictable File/stream behavior on large CSVs
export const runtime = 'nodejs';

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const capCheck = requireCapability(auth, 'fx:manage');
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

    const mapping = data.mapping ? JSON.parse(data.mapping) : undefined;

    const result = await importRatesCsv(
      auth.company_id,
      auth.api_key_id ?? 'system',
      await file.text(),
      mapping
    );

    return fileUploadResponse(result);
  } catch (error) {
    console.error('Error importing FX rates CSV:', error);
    return badRequest('Failed to import CSV');
  }
});
