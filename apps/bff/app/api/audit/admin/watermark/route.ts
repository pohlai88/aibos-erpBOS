import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditAdminService } from '@/services/audit/admin';
import { WatermarkPolicyUpsert } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/audit/admin/watermark - Create or update watermark policy
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'audit:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = WatermarkPolicyUpsert.parse(body);

  const service = new AuditAdminService();
  const policy = await service.upsertWatermarkPolicy(
    authCtx.company_id,
    authCtx.user_id,
    validatedData
  );

  return ok({ policy });
});

// GET /api/audit/admin/watermark - Get watermark policy
export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'audit:view');

  const authCtx = auth as AuthCtx;
  const service = new AuditAdminService();
  const policy = await service.getWatermarkPolicy(authCtx.company_id);

  return ok({ policy });
});
