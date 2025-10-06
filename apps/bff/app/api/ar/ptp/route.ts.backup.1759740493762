import { NextRequest } from 'next/server';
import { PtpCreate } from '@aibos/contracts';
import { ArPtpDisputesService } from '@/services/ar/ptp-disputes';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, ok } from '@/api/_kit';

// --- AR Promise-to-Pay Routes (M24) ----------------------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:ptp');
    if (cap instanceof Response) return cap;

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as
      | 'open'
      | 'kept'
      | 'broken'
      | 'cancelled'
      | undefined;
    const customerId = url.searchParams.get('customer_id') || undefined;

    const service = new ArPtpDisputesService();
    const records = await service.getPtpRecords(
      auth.company_id,
      status,
      customerId
    );

    return ok({ records }, 200);
  } catch (error) {
    console.error('Error fetching PTP records:', error);
    return ok({ error: 'Failed to fetch PTP records' }, 500);
  }
});
export const POST = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:ptp');
    if (cap instanceof Response) return cap;

    const json = await req.json();
    const data = PtpCreate.parse(json);

    const service = new ArPtpDisputesService();
    const ptpId = await service.createPtp(auth.company_id, data, auth.user_id);

    return ok(
      {
        ptp_id: ptpId,
        message: 'Promise-to-Pay created successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error creating PTP:', error);
    return ok({ error: 'Failed to create PTP' }, 500);
  }
});
