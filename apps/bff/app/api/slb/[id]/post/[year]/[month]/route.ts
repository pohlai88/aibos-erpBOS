import { NextRequest, NextResponse } from 'next/server';
import { SlbPostingService } from '@/services/lease/slb-posting';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { SlbPostingReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const slbPostingService = new SlbPostingService();

// POST /api/slb/:id/post/:year/:month - Post monthly SLB entries
export const POST = withRouteErrors(
  async (
    request: NextRequest,
    { params }: { params: { id: string; year: string; month: string } }
  ) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:post');
      if (cap instanceof Response) return cap;

      const url = new URL(request.url);
      const dryRun = url.searchParams.get('dry_run') === '1';

      const validatedData = SlbPostingReq.parse({
        slbId: params.id,
        year: parseInt(params.year),
        month: parseInt(params.month),
        dryRun,
      });

      const result = await slbPostingService.postMonthlyEntries(
        auth.company_id,
        auth.user_id,
        validatedData
      );

      return ok(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return badRequest('Invalid posting data');
      }

      console.error('Error posting monthly SLB entries:', error);
      return serverError('Failed to post monthly SLB entries');
    }
  }
);
