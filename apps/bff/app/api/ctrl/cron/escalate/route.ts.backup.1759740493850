import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ControlsExceptionsService } from '@/services/controls/exceptions';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:remediate');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const exceptionsService = new ControlsExceptionsService();

  try {
    // Find exceptions that are overdue for escalation
    const overdueExceptions = await db.execute(sql`
            SELECT ce.*, ca.owner, ca.approver, cc.severity
            FROM ctrl_exception ce
            JOIN ctrl_run cr ON ce.ctrl_run_id = cr.id
            JOIN ctrl_assignment ca ON cr.assignment_id = ca.id
            JOIN ctrl_control cc ON cr.control_id = cc.id
            WHERE ce.remediation_state = 'OPEN'
            AND ce.due_at < NOW()
            AND ca.company_id = ${authCtx.company_id}
        `);

    const escalatedExceptions = [];
    for (const exception of overdueExceptions.rows) {
      try {
        // Escalate to approver if not already assigned
        if (!exception.assignee && exception.approver) {
          await exceptionsService.updateException(
            authCtx.company_id,
            authCtx.user_id,
            {
              id: exception.id,
              remediation_state: 'IN_PROGRESS',
              assignee: exception.approver,
              resolution_note: 'Auto-escalated due to SLA breach',
            }
          );
          escalatedExceptions.push(exception.id);
        }
      } catch (error) {
        console.error(`Failed to escalate exception ${exception.id}:`, error);
      }
    }

    return ok({
      success: true,
      trigger: 'daily_escalation',
      result: {
        escalated_exceptions: escalatedExceptions.length,
        overdue_exceptions: overdueExceptions.rows.length,
        escalated_ids: escalatedExceptions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily escalation failed:', error);
    return ok(
      {
        success: false,
        trigger: 'daily_escalation',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});
