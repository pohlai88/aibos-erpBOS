import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, and, lt, sql } from 'drizzle-orm';
import { opsFireStep, opsFire } from '@aibos/db-adapter/schema';
import { logLine } from '@/lib/log';
import { withRouteErrors } from '@/lib/route-utils';
import { ok } from '@/api/_kit';

// POST /api/ops/cron/backoff - Retry failed steps with backoff (called by cron)
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    // Get company ID from header or query param
    const companyId =
      request.headers.get('x-company-id') ||
      new URL(request.url).searchParams.get('company_id') ||
      'default';

    // Find failed steps that can be retried
    const failedSteps = await db
      .select()
      .from(opsFireStep)
      .innerJoin(opsFire, eq(opsFireStep.fire_id, opsFire.id))
      .where(
        and(
          eq(opsFire.company_id, companyId),
          eq(opsFireStep.status, 'FAILED'),
          sql`${opsFireStep.attempt} < 3`, // Max 3 attempts
          sql`${opsFireStep.created_at} < NOW() - INTERVAL '5 minutes'` // 5 min backoff
        )
      )
      .limit(10); // Process max 10 steps per cron run

    let retried = 0;
    let skipped = 0;

    for (const { ops_fire_step: step, ops_fire: fire } of failedSteps) {
      try {
        // Update step to retry status
        await db
          .update(opsFireStep)
          .set({
            status: 'RETRIED',
            attempt: sql`${opsFireStep.attempt} + 1`,
            updated_at: new Date(),
          })
          .where(eq(opsFireStep.id, step.id));

        // TODO: Implement actual retry logic here
        // For now, just mark as retried
        retried++;

        logLine({
          msg: 'OpsCC step retry',
          companyId,
          fireId: fire.id,
          stepId: step.id,
          stepNo: step.step_no,
          actionCode: step.action_code,
          attempt: step.attempt + 1,
        });
      } catch (error) {
        skipped++;
        logLine({
          msg: 'OpsCC step retry error',
          companyId,
          stepId: step.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logLine({
      msg: 'OpsCC backoff cron completed',
      companyId,
      retried,
      skipped,
      totalProcessed: failedSteps.length,
    });

    return ok({
      message: 'Backoff retry completed',
      company_id: companyId,
      retried,
      skipped,
      total_processed: failedSteps.length,
    });
  } catch (error) {
    logLine({
      msg: 'OpsCC backoff cron error',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});
