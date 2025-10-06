import { NextRequest, NextResponse } from 'next/server';
import { OpsRuleEngine } from '@/services';
import { logLine } from '@/lib/log';
import { withRouteErrors } from '@/lib/route-utils';
import { ok } from '@/api/_kit';

// POST /api/ops/cron/evaluate - Evaluate rules (called by cron)
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    // Get company ID from header or query param
    const companyId =
      request.headers.get('x-company-id') ||
      new URL(request.url).searchParams.get('company_id') ||
      'default';

    const service = new OpsRuleEngine();
    const result = await service.evaluateRules(companyId);

    logLine({
      msg: 'OpsCC rule evaluation cron completed',
      companyId,
      fired: result.fired,
      suppressed: result.suppressed,
    });

    return ok({
      message: 'Rule evaluation completed',
      company_id: companyId,
      fired: result.fired,
      suppressed: result.suppressed,
    });
  } catch (error) {
    logLine({
      msg: 'OpsCC rule evaluation cron error',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});
