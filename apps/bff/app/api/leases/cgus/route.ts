import { NextRequest, NextResponse } from 'next/server';
import { CGUAllocator } from '@/services/lease/cgu-allocator';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { CGUUpsert, CGUQuery, CGULinkUpsert } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const cguAllocator = new CGUAllocator();

// POST /api/leases/cgus - Create CGU
// GET /api/leases/cgus - Query CGUs
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:impair:test');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = CGUUpsert.parse(body);

    const cguId = await cguAllocator.upsertCGU(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok({ cgu_id: cguId });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid CGU data');
    }
    console.error('Error creating CGU:', error);
    return serverError('Failed to create CGU');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:impair:test');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const queryParams = {
      code: url.searchParams.get('code') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const validatedQuery = CGUQuery.parse(queryParams);
    const cgus = await cguAllocator.queryCGUs(auth.company_id, validatedQuery);

    return ok({ cgus });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error querying CGUs:', error);
    return serverError('Failed to query CGUs');
  }
});
