import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { runAllocation } from '@/services/alloc/engine';
import { AllocRunRequest } from '@aibos/contracts';

// POST /api/alloc/run - Run allocation engine
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'alloc:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = AllocRunRequest.parse(json);

  const result = await runAllocation(
    auth.company_id,
    input.year,
    input.month,
    input.dry_run,
    auth.user_id,
    input.rules,
    input.memo
  );

  return ok({
    run_id: result.runId,
    company_id: auth.company_id,
    year: input.year,
    month: input.month,
    mode: input.dry_run ? 'dry_run' : 'commit',
    created_at: new Date().toISOString(),
    created_by: auth.user_id,
    lines: result.lines,
    summary: result.summary,
  });
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
