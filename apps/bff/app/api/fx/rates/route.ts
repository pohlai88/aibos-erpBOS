import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import { FxRateUpsert } from '@aibos/contracts';
import { upsertRate, listRates } from '../../../services/fx/rates';

export const GET = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'fx:read');
  if (isResponse(capCheck)) return capCheck;

  const url = new URL(req.url);
  const y = url.searchParams.get('year');
  const m = url.searchParams.get('month');

  const res = await listRates(
    auth.company_id,
    y && m ? { year: Number(y), month: Number(m) } : undefined
  );
  return ok(res);
});

export const POST = withRouteErrors(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'fx:manage');
  if (isResponse(capCheck)) return capCheck;

  try {
    const body = FxRateUpsert.parse(await req.json());
    const res = await upsertRate(
      auth.company_id,
      auth.api_key_id ?? 'system',
      body
    );
    return ok(res);
  } catch (error) {
    console.error('Error upserting FX rate:', error);
    return badRequest('Invalid rate data');
  }
});
