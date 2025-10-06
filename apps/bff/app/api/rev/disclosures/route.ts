import { NextRequest, NextResponse } from 'next/server';
import { RevModificationService } from '@/services/rb/modifications';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const modificationService = new RevModificationService();

// GET /api/rev/disclosures - Get disclosures for period
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:recognize');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (!year || !month) {
      return badRequest('year and month parameters are required');
    }

    const result = await modificationService.getDisclosures(
      auth.company_id,
      parseInt(year),
      parseInt(month)
    );

    return ok(result);
  } catch (error) {
    console.error('Error getting disclosures:', error);
    return serverError('Failed to get disclosures');
  }
});
