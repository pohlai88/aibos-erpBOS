import { NextRequest, NextResponse } from 'next/server';
import { ImpairMeasureService } from '@/services/lease/impairment';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const impairMeasureService = new ImpairMeasureService();

// GET /api/leases/impair/:id - Get impairment test detail
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:impair');
      if (cap instanceof Response) return cap;

      const testDetail = await impairMeasureService.getImpairmentTestDetail(
        auth.company_id,
        params.id
      );

      return ok(testDetail);
    } catch (error) {
      console.error('Error getting impairment test detail:', error);
      return serverError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);
