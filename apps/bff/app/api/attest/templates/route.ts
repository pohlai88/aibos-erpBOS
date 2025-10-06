import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AttestProgramsService } from '@/services/attest';
import { TemplateUpsertSchema } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'attest:program');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const programsService = new AttestProgramsService();
  const result = await programsService.listTemplates(
    authCtx.company_id,
    limit,
    offset
  );

  return ok(result);
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'attest:program');

  const authCtx = auth as AuthCtx;
  const body = await request.json();

  // Validate request body
  const validatedData = TemplateUpsertSchema.parse(body);

  const programsService = new AttestProgramsService();
  const result = await programsService.upsertTemplate(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok(result);
});
