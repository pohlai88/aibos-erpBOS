import { NextRequest, NextResponse } from 'next/server';
import { RecoverableAmountEngine } from '@/services/lease/recoverable-amount-engine';
import { ImpairmentPoster } from '@/services/lease/impairment-poster';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { ImpairmentTestPostReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const recoverableEngine = new RecoverableAmountEngine();
const impairmentPoster = new ImpairmentPoster();

// GET /api/leases/impair/tests/[id] - Get impairment test details
// PUT /api/leases/impair/tests/[id] - Update impairment test
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:impair:test');
      if (cap instanceof Response) return cap;

      const testDetails = await recoverableEngine.getImpairmentTestDetails(
        params.id
      );

      return ok(testDetails);
    } catch (error) {
      console.error('Error getting test details:', error);
      return serverError('Failed to get test details');
    }
  }
);
export const PUT = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:impair:test');
      if (cap instanceof Response) return cap;

      const body = await request.json();

      await recoverableEngine.updateImpairmentTest(
        params.id,
        auth.user_id,
        body
      );

      return ok({ message: 'Test updated successfully' });
    } catch (error) {
      console.error('Error updating test:', error);
      return serverError('Failed to update test');
    }
  }
);
