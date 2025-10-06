import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ControlsRunnerService } from '@/services/controls/runner';
import { EvidenceAdd, EvidenceQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:evidence');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = EvidenceQuery.parse({
    ctrl_run_id: searchParams.get('ctrl_run_id') || undefined,
    kind: (searchParams.get('kind') as any) || undefined,
    added_by: searchParams.get('added_by') || undefined,
    added_from: searchParams.get('added_from') || undefined,
    added_to: searchParams.get('added_to') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new ControlsRunnerService();
  // Note: EvidenceQuery functionality would need to be implemented in the service
  const evidence: any[] = []; // Placeholder - would implement evidence query in service

  return ok({ evidence });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:evidence');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const validatedData = EvidenceAdd.parse(body);

  const service = new ControlsRunnerService();
  const evidence = await service.addEvidence(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ evidence });
});
