import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { EnhancedEvidenceService } from '@/services/evidence/enhanced';
import { RedactionRuleUpsert } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/evidence/redaction - Manage redaction rules
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'evidence:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = RedactionRuleUpsert.parse(body);

  const service = new EnhancedEvidenceService();
  const result = await service.upsertRedactionRule(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ result });
});
