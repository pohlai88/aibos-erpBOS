import { NextRequest, NextResponse } from 'next/server';
import { LeaseExitService } from '@/services/lease/exit';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { LeaseExitPostReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const exitService = new LeaseExitService();

// POST /api/leases/exits/:id/post - Post exit journal entries
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:exit:post');
      if (cap instanceof Response) return cap;

      const body = await request.json();
      const validatedData = LeaseExitPostReq.parse({
        ...body,
        exit_id: params.id,
      });

      const result = await exitService.postExit(
        auth.company_id,
        auth.user_id,
        validatedData
      );

      return ok(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return badRequest('Invalid post data');
      }
      console.error('Error posting exit:', error);
      return serverError('Failed to post exit');
    }
  }
);
