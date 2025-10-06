import { NextRequest } from 'next/server';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, forbidden, notFound } from '@/lib/http';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import { deleteAllocRule } from '@/services/alloc/rules';

// DELETE /api/alloc/rules/[id] - Delete allocation rule
export const DELETE = withRouteErrors(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const forbiddenCheck = requireCapability(auth, 'alloc:manage');
    if (forbiddenCheck) return forbiddenCheck;

    const { id: ruleId } = await params;
    if (!ruleId) {
      return notFound('Rule ID is required');
    }

    await deleteAllocRule(ruleId);
    return ok({ deleted: true });
  }
);

// OPTIONS - CORS support
export const OPTIONS = withRouteErrors(async (_req: NextRequest) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
});
