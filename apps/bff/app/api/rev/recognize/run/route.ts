import { NextRequest, NextResponse } from 'next/server';
import { RevRecognitionService } from '@/services/revenue/recognize';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { RecognizeRunReq, RecognitionRunQuery } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const recognitionService = new RevRecognitionService();

// POST /api/rev/recognize/run - Run recognition
// GET /api/rev/recognize/run - Query recognition runs
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:recognize');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = RecognizeRunReq.parse(body);

    const result = await recognitionService.runRecognition(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid recognition data');
    }
    console.error('Error running recognition:', error);
    return serverError('Failed to run recognition');
  }
});
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

    const validatedQuery = RecognitionRunQuery.parse(query);
    const result = await recognitionService.queryRecognitionRuns(
      auth.company_id,
      validatedQuery
    );
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error querying recognition runs:', error);
    return serverError('Failed to query recognition runs');
  }
});
