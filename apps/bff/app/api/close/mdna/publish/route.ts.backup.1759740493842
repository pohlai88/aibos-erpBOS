import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { MdnaService } from '@/services/mdna/templates';
import { MdnaPublishReq, MdnaPublishQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'mdna:publish');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = MdnaPublishQuery.parse({
    run_id: searchParams.get('run_id') || undefined,
    draft_id: searchParams.get('draft_id') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new MdnaService();
  const published = await service.queryPublished(authCtx.company_id, query);

  return ok({ published });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'mdna:publish');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = MdnaPublishReq.parse(body);

  const service = new MdnaService();
  const published = await service.publishMdna(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ published });
});
