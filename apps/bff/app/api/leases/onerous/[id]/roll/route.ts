import { NextRequest, NextResponse } from 'next/server';
import { LeaseOnerousRollService } from '@/services/lease/onerous-roll-service';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { OnerousRollReq, OnerousRollPostReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const onerousRollService = new LeaseOnerousRollService();

// POST /api/leases/onerous/[id]/roll - Build roll for period
// GET /api/leases/onerous/[id]/roll - Get roll summary
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:onerous');
      if (cap instanceof Response) return cap;

      const body = await request.json();
      const validatedData = OnerousRollReq.parse({
        ...body,
        assessment_id: params.id,
      });

      const roll = await onerousRollService.buildRoll(
        auth.company_id,
        auth.user_id,
        validatedData
      );

      return ok(roll);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return badRequest('Invalid roll data');
      }
      console.error('Error building roll:', error);
      return serverError('Failed to build roll');
    }
  }
);
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:onerous');
      if (cap instanceof Response) return cap;

      const summary = await onerousRollService.getRollSummary(params.id);

      return ok({ summary });
    } catch (error) {
      console.error('Error getting roll summary:', error);
      return serverError('Failed to get roll summary');
    }
  }
);
