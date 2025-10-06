import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { KpiService } from '@/services/close/kpi';
import { KpiQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'close:report');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = KpiQuery.parse({
    run_id: searchParams.get('run_id') || undefined,
    metric: (searchParams.get('metric') as any) || undefined,
    computed_at_from: searchParams.get('computed_at_from') || undefined,
    computed_at_to: searchParams.get('computed_at_to') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new KpiService();
  const kpis = await service.queryKpis(authCtx.company_id, query);

  return ok({ kpis });
});
