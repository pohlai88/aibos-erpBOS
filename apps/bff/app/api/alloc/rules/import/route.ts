import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { importAllocRulesCsv } from '@/services/alloc/import';
import { AllocCsvImport } from '@aibos/contracts';

// POST /api/alloc/rules/import - Import allocation rules from CSV
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'alloc:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const mappingJson = formData.get('mapping') as string;

  if (!file) {
    return unprocessable('CSV file is required');
  }

  if (!mappingJson) {
    return unprocessable('Column mapping is required');
  }

  let mapping: Record<string, string>;
  try {
    mapping = JSON.parse(mappingJson);
  } catch (error) {
    return unprocessable('Invalid mapping JSON');
  }

  const csvContent = await file.text();
  const result = await importAllocRulesCsv(
    auth.company_id,
    auth.user_id,
    csvContent,
    mapping,
    file.name
  );

  return ok(result);
});

// OPTIONS - CORS support
export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
