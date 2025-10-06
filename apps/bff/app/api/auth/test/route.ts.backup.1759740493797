import { requireAuth } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import { ok } from '@/api/_kit';

export const GET = withRouteErrors(async (req: Request) => {
  const authResult = await requireAuth(req);
  if (isResponse(authResult)) return authResult;

  return ok({ message: 'Auth successful', auth: authResult });
});
