import { NextRequest, NextResponse } from 'next/server';
import {
  ConcessionService,
  ScopeTermService,
} from '../../../services/lease/m28-4-services';
import { LeaseModCreateReq } from '@aibos/contracts';
import { z } from 'zod';
import { withRouteErrors, ok } from '@/api/_kit';

const concessionService = new ConcessionService();
const scopeTermService = new ScopeTermService();
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = LeaseModCreateReq.parse(body);

    // Extract company ID and user ID from headers/auth
    const companyId = request.headers.get('x-company-id') || 'default';
    const userId = request.headers.get('x-user-id') || 'system';

    let result;

    switch (validatedData.kind) {
      case 'CONCESSION':
        result = await concessionService.createConcession(
          companyId,
          userId,
          validatedData
        );
        break;
      case 'SCOPE':
        result = await scopeTermService.createScopeModification(
          companyId,
          userId,
          validatedData
        );
        break;
      case 'TERM':
        result = await scopeTermService.createTermModification(
          companyId,
          userId,
          validatedData
        );
        break;
      default:
        throw new Error(`Unsupported modification kind: ${validatedData.kind}`);
    }

    return ok({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating modification:', error);

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
