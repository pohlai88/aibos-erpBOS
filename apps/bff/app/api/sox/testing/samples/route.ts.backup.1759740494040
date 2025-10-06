import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { SOXTestingService } from '@/services/sox/testing';
import { SampleUpsert } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/sox/testing/samples - Add test samples
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'sox:test.exec');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = SampleUpsert.array().parse(body);

  const service = new SOXTestingService();
  await service.addTestSamples(authCtx.company_id, validatedData);

  return ok({ result: { success: true } });
});
