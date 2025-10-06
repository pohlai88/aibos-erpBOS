import { NextRequest, NextResponse } from 'next/server';
import { LeaseRestorationService } from '@/services/lease/restoration';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import {
  LeaseRestorationUpsert,
  LeaseRestorationQuery,
} from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const restorationService = new LeaseRestorationService();

// POST /api/leases/restoration - Create or update restoration provision
// GET /api/leases/restoration - Query restoration provisions
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:restoration');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = LeaseRestorationUpsert.parse(body);

    const restorationId = await restorationService.upsertRestoration(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok({ restoration_id: restorationId });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid restoration data');
    }
    console.error('Error creating restoration:', error);
    return serverError('Failed to create restoration');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:restoration');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const query = {
      lease_code: url.searchParams.get('lease_code') || undefined,
      component_code: url.searchParams.get('component_code') || undefined,
      as_of_date_from: url.searchParams.get('as_of_date_from') || undefined,
      as_of_date_to: url.searchParams.get('as_of_date_to') || undefined,
      posted: url.searchParams.get('posted')
        ? url.searchParams.get('posted') === 'true'
        : undefined,
      limit: url.searchParams.get('limit')
        ? parseInt(url.searchParams.get('limit')!)
        : 50,
      offset: url.searchParams.get('offset')
        ? parseInt(url.searchParams.get('offset')!)
        : 0,
    };

    const validatedQuery = LeaseRestorationQuery.parse(query);
    const result = await restorationService.queryRestorations(
      auth.company_id,
      validatedQuery
    );
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error querying restorations:', error);
    return serverError('Failed to query restorations');
  }
});
