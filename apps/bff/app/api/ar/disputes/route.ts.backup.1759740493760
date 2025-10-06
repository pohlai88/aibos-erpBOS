import { NextRequest } from 'next/server';
import { DisputeCreate } from '@aibos/contracts';
import { ArPtpDisputesService } from '@/services/ar/ptp-disputes';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, ok } from '@/api/_kit';

// --- AR Disputes Routes (M24) ----------------------------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:dispute');
    if (cap instanceof Response) return cap;

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as
      | 'open'
      | 'resolved'
      | 'written_off'
      | undefined;
    const customerId = url.searchParams.get('customer_id') || undefined;

    const service = new ArPtpDisputesService();
    const records = await service.getDisputeRecords(
      auth.company_id,
      status,
      customerId
    );

    return ok({ records }, 200);
  } catch (error) {
    console.error('Error fetching dispute records:', error);
    return ok({ error: 'Failed to fetch dispute records' }, 500);
  }
});
export const POST = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:dispute');
    if (cap instanceof Response) return cap;

    const json = await req.json();
    const data = DisputeCreate.parse(json);

    const service = new ArPtpDisputesService();
    const disputeId = await service.createDispute(
      auth.company_id,
      data,
      auth.user_id
    );

    return ok(
      {
        dispute_id: disputeId,
        message: 'Dispute created successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error creating dispute:', error);
    return ok({ error: 'Failed to create dispute' }, 500);
  }
});
