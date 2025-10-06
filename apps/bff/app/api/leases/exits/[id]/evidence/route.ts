import { NextRequest, NextResponse } from 'next/server';
import { LeaseExitService } from '@/services/lease/exit';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { LeaseExitEvidenceReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const exitService = new LeaseExitService();

// POST /api/leases/exits/:id/evidence - Link evidence to exit
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'evidence:write');
      if (cap instanceof Response) return cap;

      const body = await request.json();
      const validatedData = LeaseExitEvidenceReq.parse({
        ...body,
        exit_id: params.id,
      });

      const evidenceId = await exitService.linkEvidence(
        auth.company_id,
        auth.user_id,
        validatedData
      );

      return ok({ evidence_id: evidenceId });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return badRequest('Invalid evidence data');
      }
      console.error('Error linking evidence:', error);
      return serverError('Failed to link evidence');
    }
  }
);
