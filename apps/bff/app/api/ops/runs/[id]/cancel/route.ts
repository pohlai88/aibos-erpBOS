import { NextRequest, NextResponse } from 'next/server';
import { ExecutionService } from '@/services';
import { CancelRunM27_2 } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const executionService = new ExecutionService();
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const companyId = request.headers.get('x-company-id');
      const userId = request.headers.get('x-user-id');

      if (!companyId || !userId) {
        return ok({ error: 'Missing company or user context' }, 400);
      }

      const body = await request.json();
      const data = CancelRunM27_2.parse({
        run_id: params.id,
        reason: body.reason,
      });

      const result = await executionService.cancelRun(companyId, userId, data);

      return ok(result);
    } catch (error) {
      console.error('Error cancelling run:', error);
      return ok({ error: 'Failed to cancel run' }, 500);
    }
  }
);
