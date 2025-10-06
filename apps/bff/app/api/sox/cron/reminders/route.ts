import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { pool } from '@/lib/db';
import { logLine } from '@/lib/log';
import { ok } from '@/api/_kit';

// POST /api/sox/cron/reminders - Send assertion reminders
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'sox:admin');

  const authCtx = auth as AuthCtx;
  const client = await pool.connect();

  try {
    // Get current quarter
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    const currentPeriod = `${currentYear}Q${currentQuarter}`;

    // Find missing 302 assertions for current quarter
    const missing302Result = await client.query(
      `
            SELECT DISTINCT m.user_id, m.role
            FROM membership m
            WHERE m.company_id = $1 
            AND m.role IN ('CFO', 'CONTROLLER', 'CEO')
            AND m.user_id NOT IN (
                SELECT signed_by FROM sox_assertion 
                WHERE company_id = $1 AND type = '302' AND period = $2
            )
        `,
      [authCtx.company_id, currentPeriod]
    );

    // Find missing 404 assertions for current year
    const currentYearStr = currentYear.toString();
    const missing404Result = await client.query(
      `
            SELECT DISTINCT m.user_id, m.role
            FROM membership m
            WHERE m.company_id = $1 
            AND m.role IN ('CFO', 'CONTROLLER', 'CEO')
            AND m.user_id NOT IN (
                SELECT signed_by FROM sox_assertion 
                WHERE company_id = $1 AND type = '404' AND period = $2
            )
        `,
      [authCtx.company_id, currentYearStr]
    );

    // Find test plans that need approval (created more than 7 days ago)
    const pendingApprovalResult = await client.query(
      `
            SELECT tp.id, tp.period, kc.name as control_name, tp.prepared_at
            FROM sox_test_plan tp
            JOIN sox_key_control kc ON kc.id = tp.control_id
            WHERE tp.company_id = $1 
            AND tp.status = 'DRAFT'
            AND tp.prepared_at < CURRENT_DATE - INTERVAL '7 days'
            ORDER BY tp.prepared_at ASC
        `,
      [authCtx.company_id]
    );

    const result = {
      current_period: currentPeriod,
      current_year: currentYearStr,
      missing_302_signers: missing302Result.rows.length,
      missing_404_signers: missing404Result.rows.length,
      pending_test_approvals: pendingApprovalResult.rows.length,
      missing_302_details: missing302Result.rows,
      missing_404_details: missing404Result.rows,
      pending_approval_details: pendingApprovalResult.rows,
    };

    logLine({
      level: 'info',
      msg: `SOX reminders check completed for company ${authCtx.company_id}: ${result.missing_302_signers} missing 302s, ${result.missing_404_signers} missing 404s, ${result.pending_test_approvals} pending approvals`,
    });

    return ok({ result });
  } catch (error) {
    logLine({ level: 'error', msg: `SOX reminders check failed: ${error}` });
    throw error;
  } finally {
    client.release();
  }
});
