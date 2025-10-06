import { NextRequest, NextResponse } from 'next/server';
import { GuardrailService } from '@/services';
import { GuardPolicyUpsert } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const guardrailService = new GuardrailService();
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const { searchParams } = new URL(request.url);

    if (!companyId) {
      return ok({ error: 'Missing company context' }, 400);
    }

    const playbookCode = searchParams.get('playbook_code');
    const specGuards = searchParams.get('spec_guards')
      ? JSON.parse(searchParams.get('spec_guards')!)
      : undefined;

    const result = await guardrailService.getEffectiveGuards(
      companyId,
      playbookCode || undefined,
      specGuards
    );

    return ok(result);
  } catch (error) {
    console.error('Error getting guard policies:', error);
    return ok({ error: 'Failed to get guard policies' }, 500);
  }
});
export const PUT = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');
    const userId = request.headers.get('x-user-id');

    if (!companyId || !userId) {
      return ok({ error: 'Missing company or user context' }, 400);
    }

    const body = await request.json();
    const data = GuardPolicyUpsert.parse(body);

    const result = await guardrailService.upsertGuardPolicy(
      companyId,
      userId,
      data
    );

    return ok(result);
  } catch (error) {
    console.error('Error upserting guard policy:', error);
    return ok({ error: 'Failed to upsert guard policy' }, 500);
  }
});
