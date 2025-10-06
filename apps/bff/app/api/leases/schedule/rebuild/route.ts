import { NextRequest, NextResponse } from 'next/server';
import { LeaseScheduleService } from '@/services/lease/cpi';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { LeaseScheduleRebuildReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const scheduleService = new LeaseScheduleService();

// POST /api/leases/schedule/rebuild - Rebuild lease schedule
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:manage');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const data = LeaseScheduleRebuildReq.parse(body);

    const result = await scheduleService.rebuild(auth.company_id, data);

    return ok(result);
  } catch (error) {
    console.error('Error rebuilding lease schedule:', error);
    return serverError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
