import { NextRequest, NextResponse } from 'next/server';
import { LeaseOnerousRollService } from '@/services/lease/onerous-roll-service';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { OnerousRollPostReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const onerousRollService = new LeaseOnerousRollService();

// POST /api/leases/onerous/[id]/post/[year]/[month] - Post roll for period
export const POST = withRouteErrors(
  async (
    request: NextRequest,
    { params }: { params: { id: string; year: string; month: string } }
  ) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:onerous');
      if (cap instanceof Response) return cap;

      const body = await request.json();
      const validatedData = OnerousRollPostReq.parse({
        ...body,
        assessment_id: params.id,
        year: parseInt(params.year),
        month: parseInt(params.month),
      });

      const result = await onerousRollService.postRoll(
        auth.company_id,
        auth.user_id,
        validatedData
      );

      return ok(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return badRequest('Invalid post data');
      }
      console.error('Error posting roll:', error);
      return serverError('Failed to post roll');
    }
  }
);
