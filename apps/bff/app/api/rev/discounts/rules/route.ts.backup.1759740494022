import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { RevDiscountService } from '@/services/revenue/discounts';
import { DiscountRuleUpsert, DiscountRuleQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'rev:discounts');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = DiscountRuleQuery.parse({
    kind: (searchParams.get('kind') as any) || undefined,
    code: searchParams.get('code') || undefined,
    active:
      searchParams.get('active') === 'true'
        ? true
        : searchParams.get('active') === 'false'
          ? false
          : undefined,
    effective_from: searchParams.get('effective_from') || undefined,
    effective_to: searchParams.get('effective_to') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new RevDiscountService();
  const rules = await service.queryDiscountRules(authCtx.company_id, query);

  return ok({ rules });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'rev:discounts');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = DiscountRuleUpsert.parse(body);

  // Validate discount rule parameters
  const service = new RevDiscountService();
  const isValid = service.validateDiscountRuleParams(data.kind, data.params);
  if (!isValid) {
    throw new Error(`Invalid parameters for discount rule kind: ${data.kind}`);
  }

  const rule = await service.upsertDiscountRule(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ rule });
});
