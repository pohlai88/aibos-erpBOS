import { NextRequest, NextResponse } from 'next/server';
import { ArSurchargeService } from '@/services/ar/surcharge';
import { ArPortalService } from '@/services/ar/portal';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, ok } from '@/api/_kit';

const surchargeService = new ArSurchargeService();
const portalService = new ArPortalService();

// GET /api/ar/portal/sessions - List portal sessions
// POST /api/ar/portal/sessions - Create portal session
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:portal:ops');
    if (cap instanceof Response) return cap;

    // TODO: Implement listSessions method in ArPortalService
    const sessions: any[] = [];

    return ok(sessions);
  } catch (error) {
    console.error('Portal sessions error:', error);
    return ok({ error: 'Failed to list portal sessions' }, 500);
  }
});
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:portal:ops');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const result = await portalService.initSession(
      auth.company_id,
      body,
      auth.user_id
    );

    return ok(result);
  } catch (error) {
    console.error('Portal session creation error:', error);
    return ok({ error: 'Failed to create portal session' }, 500);
  }
});
