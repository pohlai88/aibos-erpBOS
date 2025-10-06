// M15.2: Cash Alert Schedule Admin API
// GET current schedule, PUT upsert schedule

import { NextRequest } from 'next/server';
import { ok, badRequest, forbidden } from '@/lib/http';
import { requireAuth, requireCapability } from '@/lib/auth';
import { withRouteErrors, isResponse } from '@/lib/route-utils';
import {
  getSchedule,
  upsertSchedule,
  ensureScenarioExists,
} from '@/services/cash/schedule';
import { CashAlertScheduleUpsert } from '@aibos/contracts';

export const GET = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;
    await requireCapability(auth, 'cash:manage');

    const row = await getSchedule(auth.company_id);
    return ok(row ?? { enabled: false, reason: 'no_schedule_configured' });
  } catch (error) {
    console.error('Error getting cash alert schedule:', error);
    return badRequest('Failed to get cash alert schedule');
  }
});

export const PUT = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;
    await requireCapability(auth, 'cash:manage');

    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON body');

    // Parse and validate input
    const parsed = CashAlertScheduleUpsert.parse(body);

    // Validate scenario exists for this company (helpful guard)
    const exists = await ensureScenarioExists(
      auth.company_id,
      parsed.scenario_code
    );
    if (!exists) {
      return badRequest(
        `Unknown cash version code: ${parsed.scenario_code}. Check /api/cash/versions for available scenarios`
      );
    }

    // Quick TZ sanity: let Intl throw if invalid
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: parsed.timezone }).format(
        new Date()
      );
    } catch {
      return badRequest(
        `Invalid timezone: ${parsed.timezone}. Use IANA timezone identifiers like 'Asia/Ho_Chi_Minh' or 'America/New_York'`
      );
    }

    // Upsert the schedule
    const result = await upsertSchedule(
      auth.company_id,
      auth.user_id || 'unknown',
      parsed
    );

    return ok({
      scenario: `cash:${parsed.scenario_code}`,
      company_id: auth.company_id,
      ...result,
    });
  } catch (error) {
    console.error('Error upserting cash alert schedule:', error);
    return badRequest(
      'Failed to update cash alert schedule: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  }
});

// Optional: DELETE endpoint for removing schedule
export const DELETE = withRouteErrors(async (req: NextRequest) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;
    await requireCapability(auth, 'cash:manage');

    const { deleteSchedule } = await import(
      '../../../../services/cash/schedule'
    );
    const result = await deleteSchedule(
      auth.company_id,
      auth.user_id || 'unknown'
    );

    return ok({
      company_id: auth.company_id,
      ...result,
    });
  } catch (error) {
    console.error('Error deleting cash alert schedule:', error);
    return badRequest('Failed to delete cash alert schedule');
  }
});
