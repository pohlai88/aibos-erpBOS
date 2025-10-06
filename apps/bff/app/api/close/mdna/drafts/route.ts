import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { MdnaService } from '@/services/mdna/templates';
import { MdnaDraftUpsert, MdnaDraftQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'mdna:edit');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = MdnaDraftQuery.parse({
    template_id: searchParams.get('template_id') || undefined,
    run_id: searchParams.get('run_id') || undefined,
    status: (searchParams.get('status') as any) || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new MdnaService();
  const drafts = await service.queryDrafts(authCtx.company_id, query);

  return ok({ drafts });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'mdna:edit');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = MdnaDraftUpsert.parse(body);

  const service = new MdnaService();
  const draft = await service.createDraft(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ draft });
});
