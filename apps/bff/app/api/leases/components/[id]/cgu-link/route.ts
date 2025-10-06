import { NextRequest, NextResponse } from 'next/server';
import { CGUAllocator } from '@/services/lease/cgu-allocator';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { CGULinkUpsert } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const cguAllocator = new CGUAllocator();

// POST /api/leases/components/[id]/cgu-link - Create CGU allocation link
// GET /api/leases/components/[id]/cgu-link - Get CGU allocation for component
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:impair:test');
      if (cap instanceof Response) return cap;

      const body = await request.json();
      const validatedData = CGULinkUpsert.parse({
        ...body,
        lease_component_id: params.id,
      });

      const linkId = await cguAllocator.createCGULink(
        auth.user_id,
        validatedData
      );

      return ok({ link_id: linkId });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return badRequest('Invalid CGU link data');
      }
      console.error('Error creating CGU link:', error);
      return serverError('Failed to create CGU link');
    }
  }
);
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:impair:test');
      if (cap instanceof Response) return cap;

      const allocation = await cguAllocator.getCGUAllocation(params.id);

      return ok({ allocation });
    } catch (error) {
      console.error('Error getting CGU allocation:', error);
      return serverError('Failed to get CGU allocation');
    }
  }
);
