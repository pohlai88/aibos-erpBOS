import { NextRequest, NextResponse } from 'next/server';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditWorkspaceService } from '@/services/audit/workspace';
import { PackQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// GET /api/audit/packs - List packs available to auditor
export const GET = withRouteErrors(async (request: NextRequest) => {
  // Extract auditor session info from headers
  const auditorId = request.headers.get('x-auditor-id') || 'unknown';
  const companyId = request.headers.get('x-company-id') || 'default';

  const { searchParams } = new URL(request.url);
  const query = PackQuery.parse({
    search: searchParams.get('search') || undefined,
    period: searchParams.get('period') || undefined,
    campaign_id: searchParams.get('campaign_id') || undefined,
    paging: {
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    },
  });

  const service = new AuditWorkspaceService();
  const packs = await service.listPacks(companyId, auditorId, query);

  return ok({ packs });
});
