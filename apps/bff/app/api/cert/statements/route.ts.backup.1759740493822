import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { CertificationsService } from '@/services/controls/certs';
import {
  CertTemplateUpsert,
  CertTemplateQuery,
  CertSignReq,
  CertSignQuery,
} from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'cert:report');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = CertTemplateQuery.parse({
    level: (searchParams.get('level') as any) || undefined,
    active:
      searchParams.get('active') === 'true'
        ? true
        : searchParams.get('active') === 'false'
          ? false
          : undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new CertificationsService();
  const templates = await service.queryCertTemplates(authCtx.company_id, query);

  return ok({ templates });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'cert:manage');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const validatedData = CertTemplateUpsert.parse(body);

  const service = new CertificationsService();
  const template = await service.upsertCertTemplate(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ template });
});
