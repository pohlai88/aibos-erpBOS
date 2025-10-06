import { NextRequest, NextResponse } from 'next/server';
import { LeaseRemeasureDisclosureReq } from '@aibos/contracts';
import { z } from 'zod';
import { withRouteErrors, ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2024');
    const month = parseInt(searchParams.get('month') || '1');

    const validatedData = LeaseRemeasureDisclosureReq.parse({ year, month });

    // Extract company ID from headers/auth
    const companyId = request.headers.get('x-company-id') || 'default';

    // TODO: Implement actual disclosure calculation
    // This would typically involve:
    // 1. Getting remeasurement data for the period
    // 2. Calculating totals by type, class, and CGU
    // 3. Building rollforward tables
    // 4. Gathering qualitative notes

    const result = {
      year: validatedData.year,
      month: validatedData.month,
      remeasurements: {
        total_adjustments: 0,
        by_type: {
          indexation: 0,
          concessions: 0,
          scope_changes: 0,
          term_changes: 0,
        },
        by_class: {
          'Land/Building': 0,
          'IT/Equipment': 0,
          Vehicles: 0,
          Others: 0,
        },
        by_cgu: {},
      },
      rollforward: {
        opening_liability: 0,
        interest_expense: 0,
        payments: 0,
        remeasurements: 0,
        closing_liability: 0,
      },
      qualitative_notes: {
        indexation_bases: [],
        concession_types: [],
        modification_types: [],
      },
    };

    return ok({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting remeasurement disclosures:', error);

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
