import { NextRequest, NextResponse } from 'next/server';
import { LeaseDisclosureService } from '@/services/lease/remeasure';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const disclosureService = new LeaseDisclosureService();

// GET /api/leases/disclosures/sublease-slb - Get sublease and SLB disclosures
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:disclose');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (!year || !month) {
      return badRequest('Year and month parameters are required');
    }

    const result = await disclosureService.generateSubleaseSlbDisclosure(
      auth.company_id,
      auth.user_id,
      { year: parseInt(year), month: parseInt(month) }
    );

    return ok(result);
  } catch (error) {
    console.error('Error generating sublease/SLB disclosure:', error);
    return serverError('Failed to generate sublease/SLB disclosure');
  }
});
