import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { importAllocDriversCsv } from '@/services/alloc/import';
import { AllocCsvImport } from '@aibos/contracts';

// POST /api/alloc/drivers/import - Import driver values from CSV
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'alloc:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const mappingJson = formData.get('mapping') as string;
  const jsonData = formData.get('json') as string;

  if (!file) {
    return unprocessable('CSV file is required');
  }

  if (!mappingJson) {
    return unprocessable('Column mapping is required');
  }

  if (!jsonData) {
    return unprocessable(
      'Driver metadata (driver_code, year, month) is required'
    );
  }

  let mapping: Record<string, string>;
  let metadata: { driver_code: string; year: number; month: number };

  try {
    mapping = JSON.parse(mappingJson);
    metadata = JSON.parse(jsonData);
  } catch (error) {
    return unprocessable('Invalid JSON format');
  }

  const csvContent = await file.text();
  const result = await importAllocDriversCsv(
    auth.company_id,
    auth.user_id,
    csvContent,
    mapping,
    metadata.driver_code,
    metadata.year,
    metadata.month,
    file.name
  );

  return ok(result);
});

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
