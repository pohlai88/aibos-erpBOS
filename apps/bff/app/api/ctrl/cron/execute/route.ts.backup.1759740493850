import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ControlsRunnerService } from '@/services/controls/runner';
import { ControlsExceptionsService } from '@/services/controls/exceptions';
import { db } from '@/lib/db';
import { sql, eq, and, lt, gte } from 'drizzle-orm';
import { ctrlAssignment, ctrlRun, closeRun } from '@aibos/db-adapter/schema';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:run');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const body = await request.json();
  const { trigger } = body;

  const runnerService = new ControlsRunnerService();
  const exceptionsService = new ControlsExceptionsService();

  try {
    let result: any = {};

    switch (trigger) {
      case 'scheduled':
        result = await executeScheduledControls(
          authCtx.company_id,
          authCtx.user_id,
          runnerService
        );
        break;
      case 'daily_escalation':
        result = await escalateExceptions(
          authCtx.company_id,
          authCtx.user_id,
          exceptionsService
        );
        break;
      case 'close_transition':
        result = await executeTransitionControls(
          authCtx.company_id,
          authCtx.user_id,
          runnerService
        );
        break;
      case 'weekly_summary':
        result = await generateSummaryReport(authCtx.company_id, 'week');
        break;
      case 'monthly_summary':
        result = await generateSummaryReport(authCtx.company_id, 'month');
        break;
      default:
        throw new Error(`Unknown trigger: ${trigger}`);
    }

    return ok({
      success: true,
      trigger,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Cron job failed for trigger ${trigger}:`, error);
    return ok(
      {
        success: false,
        trigger,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

async function executeScheduledControls(
  companyId: string,
  userId: string,
  runnerService: ControlsRunnerService
) {
  // Find all active assignments with due controls
  const dueAssignments = await db.execute(sql`
        SELECT ca.*, cc.code as control_code, cc.name as control_name
        FROM ctrl_assignment ca
        JOIN ctrl_control cc ON ca.control_id = cc.id
        WHERE ca.company_id = ${companyId}
        AND ca.active = true
        AND ca.sla_due_at <= NOW()
        AND NOT EXISTS (
            SELECT 1 FROM ctrl_run cr 
            WHERE cr.assignment_id = ca.id 
            AND cr.status IN ('PASS', 'FAIL', 'WAIVED')
            AND cr.created_at >= ca.sla_due_at - INTERVAL '1 hour'
        )
    `);

  const executedRuns = [];
  for (const assignment of dueAssignments.rows) {
    try {
      const run = await runnerService.executeControlRun(companyId, userId, {
        assignment_id: assignment.id,
        run_id: assignment.run_id,
      });
      executedRuns.push(run);
    } catch (error) {
      console.error(
        `Failed to execute control for assignment ${assignment.id}:`,
        error
      );
    }
  }

  return {
    executed_runs: executedRuns.length,
    assignments_processed: dueAssignments.rows.length,
    runs: executedRuns,
  };
}

async function escalateExceptions(
  companyId: string,
  userId: string,
  exceptionsService: ControlsExceptionsService
) {
  // Find exceptions that are overdue for escalation
  const overdueExceptions = await db.execute(sql`
        SELECT ce.*, ca.owner, ca.approver, cc.severity
        FROM ctrl_exception ce
        JOIN ctrl_run cr ON ce.ctrl_run_id = cr.id
        JOIN ctrl_assignment ca ON cr.assignment_id = ca.id
        JOIN ctrl_control cc ON cr.control_id = cc.id
        WHERE ce.remediation_state = 'OPEN'
        AND ce.due_at < NOW()
        AND ca.company_id = ${companyId}
    `);

  const escalatedExceptions = [];
  for (const exception of overdueExceptions.rows) {
    try {
      // Escalate to approver if not already assigned
      if (!exception.assignee && exception.approver) {
        await exceptionsService.updateException(companyId, userId, {
          id: exception.id,
          remediation_state: 'IN_PROGRESS',
          assignee: exception.approver,
          resolution_note: 'Auto-escalated due to SLA breach',
        });
        escalatedExceptions.push(exception.id);
      }
    } catch (error) {
      console.error(`Failed to escalate exception ${exception.id}:`, error);
    }
  }

  return {
    escalated_exceptions: escalatedExceptions.length,
    overdue_exceptions: overdueExceptions.rows.length,
    escalated_ids: escalatedExceptions,
  };
}

async function executeTransitionControls(
  companyId: string,
  userId: string,
  runnerService: ControlsRunnerService
) {
  // Find close runs that recently transitioned to REVIEW or APPROVED
  const transitionedRuns = await db.execute(sql`
        SELECT cr.*, ca.id as assignment_id
        FROM close_run cr
        JOIN ctrl_assignment ca ON cr.id = ca.run_id
        WHERE cr.company_id = ${companyId}
        AND cr.status IN ('REVIEW', 'APPROVED')
        AND cr.updated_at >= NOW() - INTERVAL '1 hour'
        AND ca.active = true
    `);

  const executedRuns = [];
  for (const run of transitionedRuns.rows) {
    try {
      const controlRun = await runnerService.executeControlRun(
        companyId,
        userId,
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

  return {
    executed_runs: executedRuns.length,
    transitioned_runs: transitionedRuns.rows.length,
    runs: executedRuns,
  };
}

async function generateSummaryReport(
  companyId: string,
  period: 'week' | 'month'
) {
  const periodCondition =
    period === 'week'
      ? "created_at >= NOW() - INTERVAL '7 days'"
      : "created_at >= NOW() - INTERVAL '30 days'";

  const summary = await db.execute(sql`
        SELECT 
            COUNT(*) as total_runs,
            COUNT(CASE WHEN status = 'PASS' THEN 1 END) as passed_runs,
            COUNT(CASE WHEN status = 'FAIL' THEN 1 END) as failed_runs,
            COUNT(CASE WHEN status = 'WAIVED' THEN 1 END) as waived_runs,
            AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_execution_time_seconds
        FROM ctrl_run cr
        JOIN ctrl_assignment ca ON cr.assignment_id = ca.id
        WHERE ca.company_id = ${companyId}
        AND cr.${sql.raw(periodCondition)}
    `);

  const exceptions = await db.execute(sql`
        SELECT 
            COUNT(*) as total_exceptions,
            COUNT(CASE WHEN remediation_state = 'OPEN' THEN 1 END) as open_exceptions,
            COUNT(CASE WHEN remediation_state = 'IN_PROGRESS' THEN 1 END) as in_progress_exceptions,
            COUNT(CASE WHEN remediation_state = 'RESOLVED' THEN 1 END) as resolved_exceptions,
            COUNT(CASE WHEN material = true THEN 1 END) as material_exceptions
        FROM ctrl_exception ce
        JOIN ctrl_run cr ON ce.ctrl_run_id = cr.id
        JOIN ctrl_assignment ca ON cr.assignment_id = ca.id
        WHERE ca.company_id = ${companyId}
        AND ce.${sql.raw(periodCondition)}
    `);

  return {
    period,
    summary: summary.rows[0],
    exceptions: exceptions.rows[0],
    generated_at: new Date().toISOString(),
  };
}
