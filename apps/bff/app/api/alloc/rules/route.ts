import { NextRequest } from 'next/server';
import {
  requireAuth,
  requireCapability,
  enforceCompanyMatch,
} from '@/lib/auth';
import { ok, forbidden, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  upsertAllocRule,
  getActiveAllocRules,
  deleteAllocRule,
  getAllocRuleTargets,
} from '@/services/alloc/rules';
import {
  upsertAllocDriverValues,
  getAllocDriverValues,
} from '@/services/alloc/rules';
import { runAllocation } from '@/services/alloc/engine';
import {
  importAllocRulesCsv,
  importAllocDriversCsv,
} from '@/services/alloc/import';
import {
  AllocRuleUpsert,
  AllocDriverUpsert,
  AllocRunRequest,
  AllocCsvImport,
} from '@aibos/contracts';

// GET /api/alloc/rules - List allocation rules
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'alloc:read');
  if (forbiddenCheck) return forbiddenCheck;

  const url = new URL(req.url);
  const active = url.searchParams.get('active');
  const method = url.searchParams.get('method');

  const rules = await getActiveAllocRules(auth.company_id, 2025, 11); // TODO: Get from params

  let filteredRules = rules;
  if (active !== null) {
    const isActive = active === 'true';
    filteredRules = filteredRules.filter(rule => rule.active === isActive);
  }
  if (method) {
    filteredRules = filteredRules.filter(rule => rule.method === method);
  }

  return ok(filteredRules);
});

// POST /api/alloc/rules - Create or update allocation rule
export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'alloc:manage');
  if (forbiddenCheck) return forbiddenCheck;

  const json = await req.json();
  const input = AllocRuleUpsert.parse(json);

  const result = await upsertAllocRule(auth.company_id, auth.user_id, input);
  return ok(result);
});

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
