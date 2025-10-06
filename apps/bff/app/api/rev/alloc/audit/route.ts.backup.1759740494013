import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { RevAllocationEngineService } from '@/services/revenue/allocation-engine';
import { AllocationAuditQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'rev:allocate');

  const { searchParams } = new URL(request.url);
  const query = AllocationAuditQuery.parse({
    invoice_id: searchParams.get('invoice_id') || undefined,
    run_id: searchParams.get('run_id') || undefined,
    method: (searchParams.get('method') as any) || undefined,
    corridor_flag:
      searchParams.get('corridor_flag') === 'true'
        ? true
        : searchParams.get('corridor_flag') === 'false'
          ? false
          : undefined,
    created_at_from: searchParams.get('created_at_from') || undefined,
    created_at_to: searchParams.get('created_at_to') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  // This would be implemented in the allocation engine service
  // For now, return empty array
  const audits: any[] = [];

  return ok({ audits });
});
