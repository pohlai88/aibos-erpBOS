import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditAdminService } from '@/services/audit/admin';
import { GrantUpsert, GrantRevoke, GrantQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/audit/admin/grants - Issue grant
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'audit:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = GrantUpsert.parse(body);

  const service = new AuditAdminService();
  const grant = await service.issueGrant(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ grant });
});

// GET /api/audit/admin/grants - Query grants
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'audit:admin');

  const authCtx = auth as AuthCtx;
  const { searchParams } = new URL(request.url);
  const query = GrantQuery.parse({
    auditor_id: searchParams.get('auditor_id') || undefined,
    scope: (searchParams.get('scope') as any) || undefined,
    object_id: searchParams.get('object_id') || undefined,
    can_download:
      searchParams.get('can_download') === 'true'
        ? true
        : searchParams.get('can_download') === 'false'
          ? false
          : undefined,
    expires_after: searchParams.get('expires_after') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new AuditAdminService();
  const grants = await service.queryGrants(authCtx.company_id, query);

  return ok({ grants });
});
