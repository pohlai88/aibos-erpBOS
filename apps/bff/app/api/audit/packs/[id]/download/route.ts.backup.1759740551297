import { NextRequest, NextResponse } from 'next/server';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditWorkspaceService } from '@/services/audit/workspace';
import { DlRequest } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/audit/packs/[id]/download - Request download key
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // Extract auditor session info from headers
    const auditorId = request.headers.get('x-auditor-id') || 'unknown';
    const companyId = request.headers.get('x-company-id') || 'default';

    const body = await request.json();
    const validatedData = DlRequest.parse({
      grant_id: body.grant_id,
      object_id: params.id,
    });

    const service = new AuditWorkspaceService();
    const result = await service.requestDownloadKey(
      companyId,
      auditorId,
      validatedData.grant_id,
      validatedData.object_id
    );

    return ok(result);
  }
);
