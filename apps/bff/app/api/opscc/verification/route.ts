import { NextRequest, NextResponse } from 'next/server';
import { PlaybookStudioService } from '../../../services';
import { ActionVerificationRequest } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const playbookStudio = new PlaybookStudioService();
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const userId = request.headers.get('x-user-id');

    if (!companyId || !userId) {
      return ok({ error: 'Missing company or user context' }, 400);
    }

    const body = await request.json();
    const data = ActionVerificationRequest.parse(body);

    const result = await playbookStudio.verifyActionOutcome(
      companyId,
      userId,
      data
    );

    return ok(result);
  } catch (error) {
    console.error('Error verifying action outcome:', error);
    return ok({ error: 'Failed to verify action outcome' }, 500);
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const { searchParams } = new URL(request.url);

    if (!companyId) {
      return ok({ error: 'Missing company context' }, 400);
    }

    const fireId = searchParams.get('fire_id');
    const stepId = searchParams.get('step_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const queryParams: {
      fire_id?: string;
      step_id?: string;
      limit: number;
      offset: number;
    } = {
      limit,
      offset,
    };

    if (fireId) {
      queryParams.fire_id = fireId;
    }

    if (stepId) {
      queryParams.step_id = stepId;
    }

    const result = await playbookStudio.getActionVerifications(
      companyId,
      queryParams
    );

    return ok(result);
  } catch (error) {
    console.error('Error getting action verifications:', error);
    return ok({ error: 'Failed to get action verifications' }, 500);
  }
});
