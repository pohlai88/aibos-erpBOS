import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ControlsRunnerService } from '@/services/controls/runner';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:run');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const runnerService = new ControlsRunnerService();

  try {
    // Find close runs that recently transitioned to REVIEW or APPROVED
    const transitionedRuns = await db.execute(sql`
            SELECT cr.*, ca.id as assignment_id
            FROM close_run cr
            JOIN ctrl_assignment ca ON cr.id = ca.run_id
            WHERE cr.company_id = ${authCtx.company_id}
            AND cr.status IN ('REVIEW', 'APPROVED')
            AND cr.updated_at >= NOW() - INTERVAL '1 hour'
            AND ca.active = true
        `);

    const executedRuns = [];
    for (const run of transitionedRuns.rows) {
      try {
        const controlRun = await runnerService.executeControlRun(
          authCtx.company_id,
          authCtx.user_id,
          {
            assignment_id: run.assignment_id,
            run_id: run.id,
          }
        );
        executedRuns.push(controlRun);
      } catch (error) {
        console.error(
          `Failed to execute transition control for run ${run.id}:`,
          error
        );
      }
    }

    return ok({
      success: true,
      trigger: 'close_transition',
      result: {
        executed_runs: executedRuns.length,
        transitioned_runs: transitionedRuns.rows.length,
        runs: executedRuns,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Close transition controls failed:', error);
    return ok(
      {
        success: false,
        trigger: 'close_transition',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});
