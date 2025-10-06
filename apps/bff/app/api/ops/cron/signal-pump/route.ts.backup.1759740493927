import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  opsRule,
  opsPlaybook,
  opsPlaybookVersion,
  opsRun,
  opsSignal,
} from '@aibos/db-adapter/schema';
import { withRouteErrors, ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const companyId = request.headers.get('x-company-id');

    if (!companyId) {
      return ok({ error: 'Missing company context' }, 400);
    }

    // Get enabled rules
    const rules = await db
      .select()
      .from(opsRule)
      .where(and(eq(opsRule.company_id, companyId), eq(opsRule.enabled, true)));

    const processedRuns: any[] = [];

    for (const rule of rules) {
      // Get recent signals that match rule criteria
      const signals = await db
        .select()
        .from(opsSignal)
        .where(
          and(
            eq(opsSignal.company_id, companyId),
            // Add rule-specific filtering based on where_jsonb
            sql`ts >= NOW() - INTERVAL '3600 seconds'`
          )
        )
        .orderBy(desc(opsSignal.ts))
        .limit(100);

      if (signals.length === 0) {
        continue;
      }

      // For now, skip rules without playbook association
      // In M27.2, rules and playbooks are separate entities
      // This would need to be implemented based on business logic
      continue;
    }

    return ok({
      processed_runs: processedRuns.length,
      runs: processedRuns.map(run => ({
        id: run.id,
        rule_id: run.rule_id,
        trigger: run.trigger,
        status: run.status,
      })),
    });
  } catch (error) {
    console.error('Error in signal pump:', error);
    return ok({ error: 'Failed to process signals' }, 500);
  }
});
