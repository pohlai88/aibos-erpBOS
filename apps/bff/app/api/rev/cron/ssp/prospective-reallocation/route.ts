import { NextRequest, NextResponse } from 'next/server';
import { RevAllocationEngineService } from '@/services/revenue/allocation-engine';
import { RevAlertsService } from '@/services/revenue/alerts';
import { ok, serverError } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const allocationEngineService = new RevAllocationEngineService();
const alertsService = new RevAlertsService();

// POST /api/rev/cron/ssp/prospective-reallocation - Trigger prospective reallocation on SSP approval
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { ssp_change_id, company_id, dry_run = true } = body;

    if (!ssp_change_id || !company_id) {
      return serverError('ssp_change_id and company_id are required');
    }

    // Perform prospective reallocation
    const result = await allocationEngineService.prospectiveReallocation(
      company_id,
      'system', // System user for automated processes
      {
        ssp_change_id,
        dry_run,
      }
    );

    // Generate compliance report
    const complianceReport =
      await alertsService.checkSspPolicyCompliance(company_id);

    return ok({
      message: 'Prospective reallocation completed',
      ssp_change_id,
      company_id,
      dry_run,
      result,
      compliance_report: complianceReport,
    });
  } catch (error) {
    console.error('Error in prospective reallocation cron job:', error);
    return serverError('Failed to run prospective reallocation');
  }
});
