import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { SOXAssertionsService } from '@/services/sox/assertions';
import { AssertionCreate, SOXQueryParams } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// GET /api/sox/assertions - List assertions
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'sox:assert');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  const params = SOXQueryParams.parse({
    period: searchParams.get('period') || undefined,
    type: (searchParams.get('type') as any) || undefined,
    limit: parseInt(searchParams.get('limit') || '100'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new SOXAssertionsService();
  const result = await service.listAssertions(authCtx.company_id, params);

  return ok({ result });
});

// POST /api/sox/assertions - Create and sign assertion
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'sox:assert');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = AssertionCreate.parse(body);

  const service = new SOXAssertionsService();
  const result = await service.createAssertion(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ result });
});
