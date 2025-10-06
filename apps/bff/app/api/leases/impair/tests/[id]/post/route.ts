import { NextRequest, NextResponse } from 'next/server';
import { ImpairmentPoster } from '@/services/lease/impairment-poster';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { ImpairmentTestPostReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const impairmentPoster = new ImpairmentPoster();

// POST /api/leases/impair/tests/[id]/post - Post impairment test
// GET /api/leases/impair/tests/[id]/history - Get posting history
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:impair:post');
      if (cap instanceof Response) return cap;

      const body = await request.json();
      const validatedData = ImpairmentTestPostReq.parse({
        ...body,
        test_id: params.id,
      });

      const result = await impairmentPoster.postImpairmentTest(
        auth.company_id,
        auth.user_id,
        params.id,
        validatedData.year,
        validatedData.month,
        validatedData.dry_run
      );

      return ok(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return badRequest('Invalid post data');
      }
      console.error('Error posting impairment test:', error);
      return serverError('Failed to post impairment test');
    }
  }
);
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:impair:test');
      if (cap instanceof Response) return cap;

      const history = await impairmentPoster.getPostingHistory(params.id);

      return ok({ history });
    } catch (error) {
      console.error('Error getting posting history:', error);
      return serverError('Failed to get posting history');
    }
  }
);
