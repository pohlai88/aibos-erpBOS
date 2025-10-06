import { NextRequest, NextResponse } from 'next/server';
import { ArPortalService } from '@/services/ar/portal';
import { PortalInitReq } from '@aibos/contracts';
import { withRouteErrors, ok } from '@/api/_kit';

const portalService = new ArPortalService();

// POST /api/portal/init - Initialize portal session
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const req = PortalInitReq.parse(body);

    const result = await portalService.initSession(
      req.company_id,
      req,
      'portal-system'
    );

    return ok(result);
  } catch (error) {
    console.error('Portal init error:', error);
    return ok({ error: 'Failed to initialize portal session' }, 500);
  }
});
