import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { AttestSlaService } from '@/services/attest';
import { AttestCampaignService } from '@/services/attest';
import { CloseBoardService } from '@/services/close/board';
import { db } from '@/lib/db';
import { sql, eq, and, lt, gte } from 'drizzle-orm';
import {
  attestTask,
  attestCampaign,
  closeItem,
  outbox,
} from '@aibos/db-adapter/schema';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'attest:campaign');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const { trigger } = body;

  const slaService = new AttestSlaService();
  const campaignService = new AttestCampaignService();
  const boardService = new CloseBoardService();

  try {
    let result: any = {};

    switch (trigger) {
      case 'sla_tick':
        result = await tickSlaForAllCampaigns(authCtx.company_id, slaService);
        break;
      case 'due_soon_notifications':
        result = await sendDueSoonNotifications(authCtx.company_id);
        break;
      case 'late_escalations':
        result = await escalateLateTasks(authCtx.company_id);
        break;
      case 'close_board_sync':
        result = await syncWithCloseBoard(authCtx.company_id, boardService);
        break;
      case 'campaign_cleanup':
        result = await cleanupOldCampaigns(authCtx.company_id);
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
    console.error(
      `Attestations cron job failed for trigger ${trigger}:`,
      error
    );
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

async function tickSlaForAllCampaigns(
  companyId: string,
  slaService: AttestSlaService
) {
  // Get all active campaigns
  const campaigns = await db.execute(sql`
        SELECT id, period, due_at
        FROM attest_campaign
        WHERE company_id = ${companyId}
        AND state IN ('ISSUED', 'CLOSED')
        AND due_at > NOW() - INTERVAL '30 days'
    `);

  let totalUpdated = 0;
  let totalDueSoon = 0;
  let totalLate = 0;
  let totalEscalated = 0;

  for (const campaign of campaigns.rows) {
    const slaResult = await slaService.tickSla(
      campaign.id as string,
      companyId
    );
    totalUpdated += slaResult.updated;
    totalDueSoon += slaResult.dueSoon;
    totalLate += slaResult.late;
    totalEscalated += slaResult.escalated;
  }

  return {
    campaigns_processed: campaigns.rows.length,
    total_updated: totalUpdated,
    total_due_soon: totalDueSoon,
    total_late: totalLate,
    total_escalated: totalEscalated,
  };
}

async function sendDueSoonNotifications(companyId: string) {
  // Find tasks that are due soon and haven't been notified
  const dueSoonTasks = await db.execute(sql`
        SELECT at.*, ac.period, ap.name as program_name
        FROM attest_task at
        JOIN attest_campaign ac ON at.campaign_id = ac.id
        JOIN attest_program ap ON ac.program_id = ap.id
        WHERE at.company_id = ${companyId}
        AND at.state IN ('OPEN', 'IN_PROGRESS')
        AND at.sla_state = 'DUE_SOON'
        AND at.due_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        AND NOT EXISTS (
            SELECT 1 FROM outbox o
            WHERE o.topic = 'ATTEST_DUE_SOON_NOTIFICATION'
            AND o.payload::jsonb->>'taskId' = at.id
            AND o.created_at > NOW() - INTERVAL '12 hours'
        )
    `);

  const notificationsSent = [];
  for (const task of dueSoonTasks.rows) {
    try {
      await db.insert(outbox).values({
        id: crypto.randomUUID(),
        topic: 'ATTEST_DUE_SOON_NOTIFICATION',
        payload: JSON.stringify({
          taskId: task.id,
          assigneeId: task.assignee_id,
          dueAt: task.due_at,
          programName: task.program_name,
          period: task.period,
        }),
      });
      notificationsSent.push(task.id);
    } catch (error) {
      console.error(
        `Failed to send due soon notification for task ${task.id}:`,
        error
      );
    }
  }

  return {
    notifications_sent: notificationsSent.length,
    tasks_processed: dueSoonTasks.rows.length,
    task_ids: notificationsSent,
  };
}

async function escalateLateTasks(companyId: string) {
  // Find tasks that are late and need escalation
  const lateTasks = await db.execute(sql`
        SELECT at.*, aa.approver_id, ap.name as program_name
        FROM attest_task at
        JOIN attest_campaign ac ON at.campaign_id = ac.id
        JOIN attest_program ap ON ac.program_id = ap.id
        LEFT JOIN attest_assignment aa ON (
            aa.program_id = ac.program_id 
            AND aa.scope_key = at.scope_key 
            AND aa.assignee_id = at.assignee_id
        )
        WHERE at.company_id = ${companyId}
        AND at.state IN ('OPEN', 'IN_PROGRESS')
        AND at.sla_state = 'LATE'
        AND at.due_at < NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (
            SELECT 1 FROM outbox o
            WHERE o.topic = 'ATTEST_LATE_ESCALATION'
            AND o.payload::jsonb->>'taskId' = at.id
            AND o.created_at > NOW() - INTERVAL '24 hours'
        )
    `);

  const escalationsSent = [];
  for (const task of lateTasks.rows) {
    try {
      // Escalate to approver if available
      const escalateTo = task.approver_id || task.assignee_id;

      await db.insert(outbox).values({
        id: crypto.randomUUID(),
        topic: 'ATTEST_LATE_ESCALATION',
        payload: JSON.stringify({
          taskId: task.id,
          assigneeId: task.assignee_id,
          escalateTo,
          dueAt: task.due_at,
          programName: task.program_name,
          hoursOverdue: Math.floor(
            (Date.now() - new Date(task.due_at as string).getTime()) /
              (1000 * 60 * 60)
          ),
        }),
      });
      escalationsSent.push(task.id);
    } catch (error) {
      console.error(`Failed to escalate late task ${task.id}:`, error);
    }
  }

  return {
    escalations_sent: escalationsSent.length,
    late_tasks_processed: lateTasks.rows.length,
    task_ids: escalationsSent,
  };
}

async function syncWithCloseBoard(
  companyId: string,
  boardService: CloseBoardService
) {
  // Find attestation tasks that need Close Board items
  const tasksNeedingBoardItems = await db.execute(sql`
        SELECT at.*, ac.period, ap.name as program_name
        FROM attest_task at
        JOIN attest_campaign ac ON at.campaign_id = ac.id
        JOIN attest_program ap ON ac.program_id = ap.id
        WHERE at.company_id = ${companyId}
        AND at.state IN ('OPEN', 'IN_PROGRESS', 'SUBMITTED')
        AND NOT EXISTS (
            SELECT 1 FROM close_item ci
            WHERE ci.company_id = at.company_id
            AND ci.period = ac.period
            AND ci.kind = 'CERT'
            AND ci.ref_id = at.id
        )
    `);

  const boardItemsCreated = [];
  for (const task of tasksNeedingBoardItems.rows) {
    try {
      const boardItem = await boardService.upsertItem(companyId, 'system', {
        period: task.period as string,
        kind: 'CERT',
        refId: task.id as string,
        title: `Attestation: ${task.program_name as string} - ${task.scope_key as string}`,
        process: (task.scope_key as string).startsWith('PROCESS:')
          ? ((task.scope_key as string).replace('PROCESS:', '') as
              | 'R2R'
              | 'P2P'
              | 'O2C'
              | 'Treasury'
              | 'Tax')
          : ('General' as 'R2R' | 'P2P' | 'O2C' | 'Treasury' | 'Tax'),
        ownerId: task.assignee_id as string,
        dueAt: task.due_at as string,
        status: (task.state as string) === 'SUBMITTED' ? 'DONE' : 'OPEN',
        severity:
          (task.sla_state as string) === 'ESCALATED'
            ? 'HIGH'
            : (task.sla_state as string) === 'LATE'
              ? 'NORMAL'
              : 'LOW',
      });
      boardItemsCreated.push(boardItem.id);
    } catch (error) {
      console.error(
        `Failed to create Close Board item for task ${task.id}:`,
        error
      );
    }
  }

  // Update existing Close Board items with current task status
  const existingBoardItems = await db.execute(sql`
        SELECT ci.*, at.state, at.sla_state, at.approved_at
        FROM close_item ci
        JOIN attest_task at ON ci.ref_id = at.id
        WHERE ci.company_id = ${companyId}
        AND ci.kind = 'CERT'
        AND at.state != ci.status
    `);

  const boardItemsUpdated = [];
  for (const item of existingBoardItems.rows) {
    try {
      const newStatus =
        item.state === 'APPROVED'
          ? 'DONE'
          : item.state === 'SUBMITTED'
            ? 'DONE'
            : 'OPEN';

      await boardService.upsertItem(companyId, 'system', {
        period: item.period as string,
        kind: 'CERT',
        refId: item.ref_id as string,
        title: item.title as string,
        process: item.process as 'R2R' | 'P2P' | 'O2C' | 'Treasury' | 'Tax',
        ownerId: item.owner_id as string,
        dueAt: item.due_at as string,
        status: newStatus,
        severity:
          (item.sla_state as string) === 'ESCALATED'
            ? 'HIGH'
            : (item.sla_state as string) === 'LATE'
              ? 'NORMAL'
              : 'LOW',
      });
      boardItemsUpdated.push(item.id);
    } catch (error) {
      console.error(`Failed to update Close Board item ${item.id}:`, error);
    }
  }

  return {
    board_items_created: boardItemsCreated.length,
    board_items_updated: boardItemsUpdated.length,
    tasks_processed: tasksNeedingBoardItems.rows.length,
    created_ids: boardItemsCreated,
    updated_ids: boardItemsUpdated,
  };
}

async function cleanupOldCampaigns(companyId: string) {
  // Archive campaigns older than 1 year
  const oldCampaigns = await db.execute(sql`
        SELECT id, period
        FROM attest_campaign
        WHERE company_id = ${companyId}
        AND state = 'CLOSED'
        AND updated_at < NOW() - INTERVAL '1 year'
    `);

  const archivedCampaigns = [];
  for (const campaign of oldCampaigns.rows) {
    try {
      await db.execute(sql`
                UPDATE attest_campaign
                SET state = 'ARCHIVED', updated_at = NOW()
                WHERE id = ${campaign.id}
            `);
      archivedCampaigns.push(campaign.id);
    } catch (error) {
      console.error(`Failed to archive campaign ${campaign.id}:`, error);
    }
  }

  return {
    campaigns_archived: archivedCampaigns.length,
    campaigns_processed: oldCampaigns.rows.length,
    archived_ids: archivedCampaigns,
  };
}
