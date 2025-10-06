import { NextRequest, NextResponse } from 'next/server';
import { RbCatalogService } from '@/services/rb/catalog';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { PriceBookUpsert } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const catalogService = new RbCatalogService();

// GET /api/rb/catalog/price-books - List price books
// POST /api/rb/catalog/price-books - Create/update price book
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:catalog');
    if (cap instanceof Response) return cap;

    const result = await catalogService.getPriceBooks(auth.company_id);
    return ok(result);
  } catch (error) {
    console.error('Error listing price books:', error);
    return serverError('Failed to list price books');
  }
});
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:catalog');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = PriceBookUpsert.parse(body);

    const result = await catalogService.upsertPriceBook(
      auth.company_id,
      auth.user_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid price book data');
    }
    console.error('Error creating price book:', error);
    return serverError('Failed to create price book');
  }
});
