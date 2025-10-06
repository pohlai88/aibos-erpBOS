import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { ITGCIngestService } from '@/services/itgc/ingest';
import { ITGCSoDService } from '@/services/itgc/sod';
import { ITGCBreakglassService } from '@/services/itgc/breakglass';
import { ITGCUARService } from '@/services/itgc/uar';
import { ITGCEvidenceService } from '@/services/itgc/evidence';
import { db } from '@/lib/db';
import { sql, eq, and, lt, gte } from 'drizzle-orm';
import { uarCampaign, uarItem } from '@aibos/db-adapter/schema';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'ctrl:run');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const { trigger } = body;

  try {
    let result: any = {};

    switch (trigger) {
      case 'connector_pull':
        result = await executeConnectorPull(
          authCtx.company_id,
          authCtx.user_id
        );
        break;
      case 'sod_scan':
        result = await executeSoDScan(authCtx.company_id, authCtx.user_id);
        break;
      case 'uar_reminders':
        result = await executeUARReminders(authCtx.company_id, authCtx.user_id);
        break;
      case 'breakglass_expiry':
        result = await executeBreakglassExpiry(
          authCtx.company_id,
          authCtx.user_id
        );
        break;
      case 'evidence_snapshots':
        result = await executeEvidenceSnapshots(
          authCtx.company_id,
          authCtx.user_id
        );
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
    console.error(`ITGC cron job failed for trigger ${trigger}:`, error);
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

async function executeConnectorPull(companyId: string, userId: string) {
  const ingestService = new ITGCIngestService();

  // Run ingestion for all enabled connectors
  const result = await ingestService.runIngestion(companyId, userId, {
    force: false,
  });

  return {
    success: result.success,
    processed: result.processed,
    errors: result.errors.length,
    error_details: result.errors,
  };
}

async function executeSoDScan(companyId: string, userId: string) {
  const sodService = new ITGCSoDService();

  // Evaluate all active SoD rules
  const result = await sodService.evaluateSoDRules(companyId);

  return {
    violations_found: result.violations_found,
    rules_evaluated: result.rules_evaluated,
  };
}

async function executeUARReminders(companyId: string, userId: string) {
  const uarService = new ITGCUARService();

  // Find campaigns that are overdue for escalation
  const overdueCampaigns = await db.execute(sql`
        SELECT uc.*, 
               COUNT(ui.id) as total_items,
               COUNT(CASE WHEN ui.state = 'PENDING' THEN 1 END) as pending_items
        FROM uar_campaign uc
        LEFT JOIN uar_item ui ON uc.id = ui.campaign_id
        WHERE uc.company_id = ${companyId}
        AND uc.status = 'OPEN'
        AND uc.due_at < NOW() - INTERVAL '1 day'
        GROUP BY uc.id
        HAVING COUNT(CASE WHEN ui.state = 'PENDING' THEN 1 END) > 0
    `);

  let escalatedCampaigns = 0;
  for (const campaign of overdueCampaigns.rows) {
    try {
      // Update campaign status to ESCALATED
      await db.execute(sql`
                UPDATE uar_campaign 
                SET status = 'ESCALATED'
                WHERE id = ${campaign.id}
            `);

      escalatedCampaigns++;
    } catch (error) {
      console.error(`Failed to escalate campaign ${campaign.id}:`, error);
    }
  }

  return {
    overdue_campaigns: overdueCampaigns.rows.length,
    escalated_campaigns: escalatedCampaigns,
  };
}

async function executeBreakglassExpiry(companyId: string, userId: string) {
  const breakglassService = new ITGCBreakglassService();

  // Auto-close expired break-glass records
  const result = await breakglassService.autoCloseExpired();

  return {
    closed_count: result.closed_count,
  };
}

async function executeEvidenceSnapshots(companyId: string, userId: string) {
  // Take monthly snapshots of all ITGC data
  const evidenceService = new ITGCEvidenceService();

  const snapshots = [];
  const scopes = ['USERS', 'ROLES', 'GRANTS', 'SOD', 'BREAKGLASS'];

  for (const scope of scopes) {
    try {
      const snapshot = await evidenceService.takeSnapshot(companyId, userId, {
        scope: scope as any,
      });
      snapshots.push(snapshot);
    } catch (error) {
      console.error(`Failed to take ${scope} snapshot:`, error);
    }
  }

  return {
    snapshots_taken: snapshots.length,
    scopes: scopes,
    snapshot_ids: snapshots.map(s => s.id),
  };
}
