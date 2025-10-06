import { NextRequest, NextResponse } from 'next/server';
import { IndexationService } from '../../../../services/lease/m28-4-services';
import { LeaseIndexPlanReq } from '@aibos/contracts';
import { z } from 'zod';
import { withRouteErrors, ok } from '@/api/_kit';

const indexationService = new IndexationService();
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = LeaseIndexPlanReq.parse(body);

    // Extract company ID from headers/auth
    const companyId = request.headers.get('x-company-id') || 'default';

    const result = await indexationService.planResets(companyId, validatedData);

    return ok({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error planning index resets:', error);

    if (error instanceof z.ZodError) {
      return ok(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        400
      );
    }

    return ok(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
