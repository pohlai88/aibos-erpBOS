import { NextRequest, NextResponse } from 'next/server';
import { RuleService } from '@/services';
import { withRouteErrors, ok } from '@/api/_kit';

const ruleService = new RuleService();
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { code: string } }) => {
    try {
      const companyId = request.headers.get('x-company-id');
      const userId = request.headers.get('x-user-id');

      if (!companyId || !userId) {
        return ok({ error: 'Missing company or user context' }, 400);
      }

      const body = await request.json();
      const { enabled } = body;

      if (typeof enabled !== 'boolean') {
        return ok({ error: 'enabled must be a boolean' }, 400);
      }

      const result = await ruleService.toggleRule(
        companyId,
        params.code,
        enabled,
        userId
      );

      return ok(result);
    } catch (error) {
      console.error('Error toggling rule:', error);
      return ok({ error: 'Failed to toggle rule' }, 500);
    }
  }
);
