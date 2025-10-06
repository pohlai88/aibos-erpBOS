import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { SOXControlsService } from '@/services/sox/controls';
import { ControlScopeUpsert, SOXQueryParams } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// GET /api/sox/controls/scope - List control scopes
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'sox:admin');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  const params = SOXQueryParams.parse({
    period: searchParams.get('period') || undefined,
    limit: parseInt(searchParams.get('limit') || '100'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new SOXControlsService();
  const result = await service.listControlScopes(authCtx.company_id, params);

  return ok({ result });
});

// POST /api/sox/controls/scope - Create or update control scope
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'sox:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = ControlScopeUpsert.parse(body);

  const service = new SOXControlsService();
  const result = await service.upsertControlScope(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ result });
});
