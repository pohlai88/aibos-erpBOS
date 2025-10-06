import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditHousekeepingService } from '@/services/audit/housekeeping';
import { AuditCronRemind } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/audit/cron/remind - Send reminder notifications
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'audit:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = AuditCronRemind.parse(body);

  const service = new AuditHousekeepingService();
  const result = await service.sendReminders();

  return ok({
    success: true,
    result,
  });
});
