import { NextRequest, NextResponse } from 'next/server';
import { ImpairmentIndicatorService } from '@/services/lease/impairment-indicator-service';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const indicatorService = new ImpairmentIndicatorService();

// POST /api/leases/impair/indicators/collect - Collect indicators from various sources
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:impair:test');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const { as_of_date, sources = ['BUDGET_SYSTEM', 'MARKET_DATA', 'MANUAL'] } =
      body;

    if (!as_of_date) {
      return badRequest('as_of_date is required');
    }

    const result = await indicatorService.collectIndicators(
      auth.company_id,
      auth.user_id,
      as_of_date,
      sources
    );

    return ok(result);
  } catch (error) {
    console.error('Error collecting indicators:', error);
    return serverError('Failed to collect indicators');
  }
});
