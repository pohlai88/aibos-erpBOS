import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { EnhancedEvidenceService } from '@/services/evidence/enhanced';
import { AttestReq } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/ebinder/attest - Attest eBinder
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'binder:sign');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = AttestReq.parse(body);

  const service = new EnhancedEvidenceService();
  const result = await service.attestBinder(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ result });
});
