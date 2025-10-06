import { NextRequest, NextResponse } from 'next/server';
import { ImpairmentIndicatorService } from '@/services/lease/impairment-indicator-service';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import {
  ImpairmentIndicatorUpsert,
  ImpairmentIndicatorQuery,
} from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const indicatorService = new ImpairmentIndicatorService();

// POST /api/leases/impair/indicators - Create impairment indicator
// GET /api/leases/impair/indicators - Query impairment indicators
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:impair:test');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = ImpairmentIndicatorUpsert.parse(body);

    const indicatorId = await indicatorService.upsertIndicator(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok({ indicator_id: indicatorId });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid indicator data');
    }
    console.error('Error creating indicator:', error);
    return serverError('Failed to create indicator');
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
      as_of_date: url.searchParams.get('as_of') || undefined,
      cgu_id: url.searchParams.get('cgu') || undefined,
      lease_component_id: url.searchParams.get('component') || undefined,
      kind: url.searchParams.get('kind') || undefined,
      severity: url.searchParams.get('severity') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const validatedQuery = ImpairmentIndicatorQuery.parse(queryParams);
    const indicators = await indicatorService.queryIndicators(
      auth.company_id,
      validatedQuery
    );

    return ok({ indicators });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error querying indicators:', error);
    return serverError('Failed to query indicators');
  }
});
