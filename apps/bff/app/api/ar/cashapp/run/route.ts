import { NextRequest } from 'next/server';
import { CashAppRunReq } from '@aibos/contracts';
import { ArCashApplicationService } from '@/services/ar/cash-application';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, ok } from '@/api/_kit';

// --- AR Cash Application Run Route (M24) ------------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:cashapp:run');
    if (cap instanceof Response) return cap;

    const json = await req.json();
    const data = CashAppRunReq.parse(json);

    const service = new ArCashApplicationService();
    const result = await service.runCashApplication(auth.company_id, data);

    return ok(
      {
        result,
        message: data.dry_run
          ? 'Cash application completed (dry run)'
          : 'Cash application completed',
      },
      200
    );
  } catch (error) {
    console.error('Error running cash application:', error);
    return ok({ error: 'Failed to run cash application' }, 500);
  }
});
