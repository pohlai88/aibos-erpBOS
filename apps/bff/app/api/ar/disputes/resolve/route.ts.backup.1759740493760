import { NextRequest } from 'next/server';
import { DisputeResolve } from '@aibos/contracts';
import { ArPtpDisputesService } from '@/services/ar/ptp-disputes';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, ok } from '@/api/_kit';

// --- AR Disputes Resolve Route (M24) ---------------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:dispute');
    if (cap instanceof Response) return cap;

    const json = await req.json();
    const data = DisputeResolve.parse(json);

    const service = new ArPtpDisputesService();
    await service.resolveDispute(auth.company_id, data, auth.user_id);

    return ok(
      {
        message: 'Dispute resolved successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return ok({ error: 'Failed to resolve dispute' }, 500);
  }
});
