import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { EvidenceVaultService } from '@/services/evidence/vault';
import { EbinderGenerate, EbinderQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// GET /api/evidence/ebinder - Query eBinders
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:evidence');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);

  const query = EbinderQuery.parse({
    run_id: searchParams.get('run_id') || undefined,
    binder_type: (searchParams.get('binder_type') as any) || undefined,
    period_from: searchParams.get('period_from') || undefined,
    period_to: searchParams.get('period_to') || undefined,
    status: (searchParams.get('status') as any) || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new EvidenceVaultService();
  // Note: This would need a queryEbinders method in the service
  const binders = await service.queryEvidenceManifests(
    authCtx.company_id,
    query as any
  );

  return ok({ binders });
});

// POST /api/evidence/ebinder - Generate eBinder
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:manage');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const data = EbinderGenerate.parse(body);

  const service = new EvidenceVaultService();
  const binder = await service.generateEbinder(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ binder });
});
