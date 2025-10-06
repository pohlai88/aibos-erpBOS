import { NextRequest, NextResponse } from 'next/server';
import { LeaseScheduleService } from '@/services/lease/schedule';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { LeaseMaturityQuery } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const scheduleService = new LeaseScheduleService();

// GET /api/leases/maturity - Generate maturity analysis
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:read');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const assetClass =
      (url.searchParams.get('asset_class') as any) || undefined;

    if (!year || !month) {
      return badRequest('Year and month parameters are required');
    }

    const query = LeaseMaturityQuery.parse({
      year: parseInt(year),
      month: parseInt(month),
      asset_class: assetClass,
    });

    const result = await scheduleService.generateMaturityAnalysis(
      auth.company_id,
      query
    );
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error generating maturity analysis:', error);
    return serverError('Failed to generate maturity analysis');
  }
});
