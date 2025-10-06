import { NextRequest, NextResponse } from 'next/server';
import { ArPortalService } from '@/services/ar/portal';
import { PtpPublicCreate } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const portalService = new ArPortalService();

// POST /api/portal/ptp - Create Promise to Pay
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const req = PtpPublicCreate.parse(body);

    // Resolve token to get customer context
    const session = await portalService.resolveToken(req.token);
    if (!session) {
      return ok({ error: 'Invalid or expired token' }, 401);
    }

    const result = await portalService.createPtp(
      session.companyId,
      session.customerId,
      req.invoice_id,
      req.promised_date,
      req.amount,
      req.note
    );

    return ok(result);
  } catch (error) {
    console.error('Portal PTP error:', error);
    return ok({ error: 'Failed to create PTP' }, 500);
  }
});
