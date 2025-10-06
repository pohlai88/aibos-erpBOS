import { NextRequest, NextResponse } from 'next/server';
import {
  ComponentDesignService,
  ComponentScheduleService,
} from '@/services/lease/component';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import {
  LeaseComponentDesignReq,
  LeaseComponentScheduleReq,
} from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const componentDesignService = new ComponentDesignService();
const componentScheduleService = new ComponentScheduleService();

// POST /api/leases/:leaseId/components/design - Design components from allocation
// GET /api/leases/:leaseId/components - Get components for a lease
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { leaseId: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:component');
      if (cap instanceof Response) return cap;

      const body = await request.json();
      const data = LeaseComponentDesignReq.parse(body);

      const result = await componentDesignService.designFromAllocation(
        auth.company_id,
        auth.user_id,
        params.leaseId,
        data.splits
      );

      return ok(result);
    } catch (error) {
      console.error('Error designing components:', error);
      return serverError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { leaseId: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'lease:component');
      if (cap instanceof Response) return cap;

      const components = await componentDesignService.getLeaseComponents(
        auth.company_id,
        params.leaseId
      );

      return ok({ components });
    } catch (error) {
      console.error('Error getting components:', error);
      return serverError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);
