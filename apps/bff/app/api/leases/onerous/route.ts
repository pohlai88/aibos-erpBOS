import { NextRequest, NextResponse } from 'next/server';
import { OnerousAssessor } from '@/services/lease/onerous-assessor';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import {
  OnerousAssessmentUpsert,
  OnerousAssessmentQuery,
} from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const onerousAssessor = new OnerousAssessor();

// POST /api/leases/onerous - Create onerous assessment
// GET /api/leases/onerous - Query onerous assessments
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:onerous');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = OnerousAssessmentUpsert.parse(body);

    const assessmentId = await onerousAssessor.upsertAssessment(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok({ assessment_id: assessmentId });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid assessment data');
    }
    console.error('Error creating assessment:', error);
    return serverError('Failed to create assessment');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:onerous');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const queryParams = {
      as_of_date: url.searchParams.get('as_of') || undefined,
      lease_component_id: url.searchParams.get('component') || undefined,
      service_item: url.searchParams.get('service_item') || undefined,
      status: url.searchParams.get('status') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const validatedQuery = OnerousAssessmentQuery.parse(queryParams);
    const assessments = await onerousAssessor.queryAssessments(
      auth.company_id,
      validatedQuery
    );

    return ok({ assessments });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error querying assessments:', error);
    return serverError('Failed to query assessments');
  }
});
