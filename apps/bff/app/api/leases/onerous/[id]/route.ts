import { NextRequest, NextResponse } from 'next/server';
import { OnerousAssessor } from '@/services/lease/onerous-assessor';
import { LeaseOnerousRollService } from '@/services/lease/onerous-roll-service';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { OnerousRollReq, OnerousRollPostReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const onerousAssessor = new OnerousAssessor();
const onerousRollService = new LeaseOnerousRollService();

// GET /api/leases/onerous/[id] - Get assessment details
// PUT /api/leases/onerous/[id] - Update assessment
// POST /api/leases/onerous/[id]/recognize - Recognize provision
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:onerous');
      if (cap instanceof Response) return cap;

      const assessmentDetails = await onerousAssessor.getAssessmentDetails(
        params.id
      );

      return ok(assessmentDetails);
    } catch (error) {
      console.error('Error getting assessment details:', error);
      return serverError('Failed to get assessment details');
    }
  }
);
export const PUT = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:onerous');
      if (cap instanceof Response) return cap;

      const body = await request.json();

      await onerousAssessor.updateAssessment(params.id, auth.user_id, body);

      return ok({ message: 'Assessment updated successfully' });
    } catch (error) {
      console.error('Error updating assessment:', error);
      return serverError('Failed to update assessment');
    }
  }
);
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:onerous');
      if (cap instanceof Response) return cap;

      await onerousAssessor.recognizeProvision(params.id, auth.user_id);

      return ok({ message: 'Provision recognized successfully' });
    } catch (error) {
      console.error('Error recognizing provision:', error);
      return serverError('Failed to recognize provision');
    }
  }
);
