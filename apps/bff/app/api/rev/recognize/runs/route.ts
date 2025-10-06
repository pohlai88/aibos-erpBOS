import { NextRequest, NextResponse } from 'next/server';
import { RevRecognitionService } from '@/services/revenue/recognize';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const recognitionService = new RevRecognitionService();

// GET /api/rev/recognize/runs - Query recognition runs
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:recognize');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const query = {
      year: url.searchParams.get('year')
        ? parseInt(url.searchParams.get('year')!)
        : undefined,
      month: url.searchParams.get('month')
        ? parseInt(url.searchParams.get('month')!)
        : undefined,
      status: (url.searchParams.get('status') as any) || undefined,
      limit: url.searchParams.get('limit')
        ? parseInt(url.searchParams.get('limit')!)
        : 50,
      offset: url.searchParams.get('offset')
        ? parseInt(url.searchParams.get('offset')!)
        : 0,
    };

    const result = await recognitionService.queryRecognitionRuns(
      auth.company_id,
      query
    );
    return ok(result);
  } catch (error) {
    console.error('Error querying recognition runs:', error);
    return serverError('Failed to query recognition runs');
  }
});
