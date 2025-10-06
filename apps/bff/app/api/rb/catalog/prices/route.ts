import { NextRequest, NextResponse } from 'next/server';
import { RbCatalogService } from '@/services/rb/catalog';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { PriceUpsert } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const catalogService = new RbCatalogService();

// GET /api/rb/catalog/prices - List prices for a product
// POST /api/rb/catalog/prices - Create/update price
export const GET = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:catalog');
    if (cap instanceof Response) return cap;

    const url = new URL(request.url);
    const productId = url.searchParams.get('product_id');

    if (!productId) {
      return badRequest('product_id parameter is required');
    }

    const result = await catalogService.getProductPrices(
      auth.company_id,
      productId
    );
    return ok(result);
  } catch (error) {
    console.error('Error listing prices:', error);
    return serverError('Failed to list prices');
  }
});
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'rb:catalog');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedData = PriceUpsert.parse(body);

    const result = await catalogService.upsertPrice(
      auth.company_id,
      validatedData
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid price data');
    }
    console.error('Error creating price:', error);
    return serverError('Failed to create price');
  }
});
