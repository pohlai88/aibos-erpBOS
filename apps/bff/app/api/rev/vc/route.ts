import { NextRequest, NextResponse } from 'next/server';
import { RevModificationService } from '@/services/rb/modifications';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { VCUpsert, VCQuery, VCQueryType } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const modificationService = new RevModificationService();

// POST /api/rev/vc - Upsert VC estimate
// GET /api/rev/vc - List VC estimates
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:vc');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = VCUpsert.parse(body);

    const result = await modificationService.upsertVCEstimate(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    console.error('Error upserting VC estimate:', error);
    return serverError('Failed to upsert VC estimate');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:vc');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const query: VCQueryType = {
      contract_id: url.searchParams.get('contract_id') || undefined,
      pob_id: url.searchParams.get('pob_id') || undefined,
      year: url.searchParams.get('year')
        ? parseInt(url.searchParams.get('year')!)
        : undefined,
      month: url.searchParams.get('month')
        ? parseInt(url.searchParams.get('month')!)
        : undefined,
      status: (url.searchParams.get('status') as any) || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const result = await modificationService.queryVCEstimates(
      auth.company_id,
      query
    );
    return ok(result);
  } catch (error) {
    console.error('Error listing VC estimates:', error);
    return serverError('Failed to list VC estimates');
  }
});
