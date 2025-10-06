import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, unprocessable } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { DiscountPolicyUpsert } from '@aibos/contracts';
import {
  getDiscountPolicy,
  upsertDiscountPolicy,
} from '@/services/payments/discount';

// GET /api/payments/discount/policy - Get discount policy
export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'pay:discount:policy');
  if (forbiddenCheck) return forbiddenCheck;

  const policy = await getDiscountPolicy(auth.company_id);

  if (!policy) {
    return ok({ policy: null });
  }

  return ok({ policy });
});

// PUT /api/payments/discount/policy - Upsert discount policy
export const PUT = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const forbiddenCheck = requireCapability(auth, 'pay:discount:policy');
  if (forbiddenCheck) return forbiddenCheck;

  const body = await req.json();
  const validated = DiscountPolicyUpsert.safeParse(body);

  if (!validated.success) {
    return unprocessable(validated.error.message);
  }

  const policy = await upsertDiscountPolicy(
    auth.company_id,
    validated.data,
    auth.user_id
  );

  return ok({ policy });
});
