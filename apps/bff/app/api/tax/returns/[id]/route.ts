import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, notFound } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { getTaxReturnDetails } from '@/services/tax_return/templates';

// GET /api/tax/returns/[id] - Get tax return details
export const GET = withRouteErrors(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, 'tax:read');
    if (forbiddenCheck) return forbiddenCheck;

    try {
      const { id } = await params;
      const details = await getTaxReturnDetails(id);
      return ok(details);
    } catch (error) {
      return notFound('Tax return not found');
    }
  }
);

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
