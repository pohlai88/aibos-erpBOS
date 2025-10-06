import { NextRequest, NextResponse } from 'next/server';
import { LeaseRemeasureService } from '@/services/lease/remeasure';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { LeaseEventUpsert } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const remeasureService = new LeaseRemeasureService();

// POST /api/leases/events - Record lease event (remeasurement/modification)
// GET /api/leases/events - Get lease events
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:manage');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = LeaseEventUpsert.parse(body);

    const eventId = await remeasureService.recordEvent(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok({ event_id: eventId });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid event data');
    }
    console.error('Error recording lease event:', error);
    return serverError('Failed to record lease event');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'lease:read');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const leaseCode = url.searchParams.get('lease_code');

    if (!leaseCode) {
      return badRequest('Lease code parameter is required');
    }

    const result = await remeasureService.getLeaseEvents(
      auth.company_id,
      leaseCode
    );
    return ok(result);
  } catch (error) {
    console.error('Error getting lease events:', error);
    return serverError('Failed to get lease events');
  }
});
