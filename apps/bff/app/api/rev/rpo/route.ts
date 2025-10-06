import { NextRequest, NextResponse } from 'next/server';
import { RevRpoService } from '@/services/revenue/policy';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { RPOSnapshotCreate, RPOSnapshotQuery } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const rpoService = new RevRpoService();

// POST /api/rev/rpo - Create RPO snapshot
// GET /api/rev/rpo - Query RPO snapshots
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:recognize');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = RPOSnapshotCreate.parse(body);

    const result = await rpoService.createSnapshot(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid RPO snapshot data');
    }
    console.error('Error creating RPO snapshot:', error);
    return serverError('Failed to create RPO snapshot');
  }
});
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rev:recognize');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const query = {
      as_of_date_from: url.searchParams.get('as_of_date_from') || undefined,
      as_of_date_to: url.searchParams.get('as_of_date_to') || undefined,
      currency: url.searchParams.get('currency') || undefined,
      limit: url.searchParams.get('limit')
        ? parseInt(url.searchParams.get('limit')!)
        : 50,
      offset: url.searchParams.get('offset')
        ? parseInt(url.searchParams.get('offset')!)
        : 0,
    };

    const validatedQuery = RPOSnapshotQuery.parse(query);
    const result = await rpoService.querySnapshots(
      auth.company_id,
      validatedQuery
    );
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid query parameters');
    }
    console.error('Error querying RPO snapshots:', error);
    return serverError('Failed to query RPO snapshots');
  }
});
