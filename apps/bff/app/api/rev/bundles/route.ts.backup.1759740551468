import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { RevBundleService } from '@/services/revenue/bundles';
import { BundleUpsert, BundleQuery } from '@aibos/contracts';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'rev:bundles');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const query = BundleQuery.parse({
    bundle_sku: searchParams.get('bundle_sku') || undefined,
    status: (searchParams.get('status') as any) || undefined,
    effective_from: searchParams.get('effective_from') || undefined,
    effective_to: searchParams.get('effective_to') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const service = new RevBundleService();
  const bundles = await service.queryBundles(authCtx.company_id, query);

  return ok({ bundles });
});

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'rev:bundles');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const data = BundleUpsert.parse(body);

  // Validate bundle component weights
  const service = new RevBundleService();
  const isValid = await service.validateBundleWeights(data.components);
  if (!isValid) {
    throw new Error('Bundle component weights must sum to 1.0');
  }

  const bundle = await service.upsertBundle(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ bundle });
});
