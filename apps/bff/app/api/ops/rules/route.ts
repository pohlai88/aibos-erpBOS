import { NextRequest, NextResponse } from 'next/server';
import { RuleService } from '@/services';
import { RuleUpsertM27_2, ListRulesQueryM27_2 } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const ruleService = new RuleService();
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const { searchParams } = new URL(request.url);

    if (!companyId) {
      return ok({ error: 'Missing company context' }, 400);
    }

    const query: ListRulesQueryM27_2 = {
      enabled: searchParams.get('enabled')
        ? searchParams.get('enabled') === 'true'
        : undefined,
      kind: searchParams.get('kind') as any,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await ruleService.listRules(companyId, query);

    return ok(result);
  } catch (error) {
    console.error('Error listing rules:', error);
    return ok({ error: 'Failed to list rules' }, 500);
  }
});
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const userId = request.headers.get('x-user-id');

    if (!companyId || !userId) {
      return ok({ error: 'Missing company or user context' }, 400);
    }

    const body = await request.json();
    const data = RuleUpsertM27_2.parse(body);

    const result = await ruleService.upsertRule(companyId, userId, data);

    return ok(result);
  } catch (error) {
    console.error('Error upserting rule:', error);
    return ok({ error: 'Failed to upsert rule' }, 500);
  }
});
