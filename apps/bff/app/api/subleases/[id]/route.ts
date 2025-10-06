import { NextRequest, NextResponse } from 'next/server';
import { SubleaseBuilder } from '@/services/lease/sublease-builder';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const subleaseBuilder = new SubleaseBuilder();

// GET /api/subleases/:id - Get sublease detail
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:read');
      if (cap instanceof Response) return cap;

      const result = await subleaseBuilder.getSubleaseDetail(
        auth.company_id,
        params.id
      );

      if (!result) {
        return badRequest('Sublease not found');
      }

      return ok(result);
    } catch (error) {
      console.error('Error getting sublease detail:', error);
      return serverError('Failed to get sublease detail');
    }
  }
);
