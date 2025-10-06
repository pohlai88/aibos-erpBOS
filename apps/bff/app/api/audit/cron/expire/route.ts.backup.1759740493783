import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditHousekeepingService } from '@/services/audit/housekeeping';
import { AuditCronExpire } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/audit/cron/expire - Clean up expired auditor data
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'audit:admin');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const validatedData = AuditCronExpire.parse(body);

  const service = new AuditHousekeepingService();
  const result = await service.cleanupExpiredData();

  return ok({
    success: true,
    result,
    dry_run: validatedData.dry_run,
  });
});
