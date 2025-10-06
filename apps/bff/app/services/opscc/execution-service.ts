import { db } from '@/lib/db';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import {
  opsRun,
  opsRunStep,
  opsRollbackStep,
  opsOutbox,
  opsPlaybook,
  opsPlaybookVersion,
} from '@aibos/db-adapter/schema';
import { ActionRegistry } from './action-registry';
import { GuardrailService } from './guardrail-service';
import type {
  RunRequestM27_2,
  RunResponseM27_2,
  ApproveRunM27_2,
  CancelRunM27_2,
  ListRunsQueryM27_2,
  RunMetricsM27_2,
  OutboxEventM27_2,
} from '@aibos/contracts';

/**
 * M27.2: Execution Service
 *
 * Core guarded autonomy runtime with canaries, blast-radius caps, dual-control,
 * outcome checks, and auto-rollback
 */
export class ExecutionService {
  private actionRegistry: ActionRegistry;
  private guardrailService: GuardrailService;

  constructor() {
    this.actionRegistry = new ActionRegistry();
    this.guardrailService = new GuardrailService();
  }

  /**
   * Plan a run: resolve playbook version, evaluate canary sample, compute steps
   */
  async planRun(
    companyId: string,
    userId: string,
    request: RunRequestM27_2
  ): Promise<{
    playbookVersion: any;
    canaryScope?: any;
    blastRadiusEval: any;
    steps: any[];
    requiresApproval: boolean;
    approvalReason?: string;
  }> {
    // Get playbook and version
    const playbook = await db
      .select()
      .from(opsPlaybook)
      .where(
        and(
          eq(opsPlaybook.company_id, companyId),
          eq(opsPlaybook.code, request.playbook_code)
        )
      )
      .limit(1);

    if (playbook.length === 0) {
      throw new Error(`Playbook ${request.playbook_code} not found`);
    }

    const version = request.version || playbook[0]!.latest_version;
    const playbookVersion = await db
      .select()
      .from(opsPlaybookVersion)
      .where(
        and(
          eq(opsPlaybookVersion.playbook_id, playbook[0]!.id),
          eq(opsPlaybookVersion.version, version)
        )
      )
      .limit(1);

    if (playbookVersion.length === 0) {
      throw new Error(`Playbook version ${version} not found`);
    }

    const spec = playbookVersion[0]!.spec_jsonb as any;

    // Evaluate blast radius
    const blastRadiusEval = await this.guardrailService.evaluateBlastRadius(
      companyId,
      request.scope,
      request.playbook_code,
      spec.guards
    );

    if (!blastRadiusEval.allowed) {
      throw new Error(`Blast radius check failed: ${blastRadiusEval.reason}`);
    }

    // Check if canary is required
    const canaryEval = await this.guardrailService.evaluateCanary(
      companyId,
      request.playbook_code,
      spec.guards
    );

    let canaryScope: any;
    if (canaryEval.required) {
      canaryScope = this.computeCanaryScope(
        request.scope,
        canaryEval.samplePercent || 10,
        canaryEval.minEntities || 5
      );
    }

    // Check if dual control is required
    const requiresDualControl = await this.guardrailService.requiresDualControl(
      companyId,
      request.playbook_code,
      spec.guards
    );

    // Compute steps
    const steps = spec.steps.map((step: any, index: number) => ({
      idx: index,
      action_code: step.action,
      input_jsonb: this.resolveStepInput(step.input, request.scope),
      status: 'pending' as const,
    }));

    return {
      playbookVersion: playbookVersion[0],
      canaryScope,
      blastRadiusEval,
      steps,
      requiresApproval: requiresDualControl || !request.dry_run,
      approvalReason: requiresDualControl
        ? 'Dual control required'
        : 'Live execution requires approval',
    };
  }

  /**
   * Request approval for a run
   */
  async requestApproval(
    companyId: string,
    userId: string,
    plan: any
  ): Promise<RunResponseM27_2> {
    const [run] = await db
      .insert(opsRun)
      .values({
        id: crypto.randomUUID(),
        company_id: companyId,
        playbook_version_id: plan.playbookVersion.id,
        trigger: 'manual',
        status: 'queued',
        canary: !!plan.canaryScope,
        scope_jsonb: plan.canaryScope || plan.scope,
        blast_radius_eval: plan.blastRadiusEval,
        approvals_jsonb: {
          required: plan.requiresApproval,
          reason: plan.approvalReason,
          requested_by: userId,
          requested_at: new Date().toISOString(),
        },
        created_by: userId,
      })
      .returning();

    if (!run) {
      throw new Error('Failed to create run');
    }

    // Create run steps
    const steps = await db
      .insert(opsRunStep)
      .values(
        plan.steps.map((step: any) => ({
          run_id: run.id,
          idx: step.idx,
          action_code: step.action_code,
          input_jsonb: step.input_jsonb,
          status: 'pending',
        }))
      )
      .returning();

    // Emit outbox event
    await this.emitEvent('ops.run.queued', run.id, {
      run_id: run.id,
      playbook_code: plan.playbookVersion.playbook_id,
      requires_approval: plan.requiresApproval,
      canary: !!plan.canaryScope,
    });

    return this.mapRunToResponse(run, steps);
  }

  /**
   * Approve a run
   */
  async approveRun(
    companyId: string,
    userId: string,
    data: ApproveRunM27_2
  ): Promise<RunResponseM27_2> {
    const run = await db
      .select()
      .from(opsRun)
      .where(
        and(
          eq(opsRun.company_id, companyId),
          eq(opsRun.id, data.run_id),
          eq(opsRun.status, 'queued')
        )
      )
      .limit(1);

    if (run.length === 0) {
      throw new Error(`Run ${data.run_id} not found or not queued`);
    }

    if (data.decision === 'reject') {
      const [updatedRun] = await db
        .update(opsRun)
        .set({
          status: 'cancelled',
          approvals_jsonb: {
            ...((run[0]!.approvals_jsonb as any) || {}),
            rejected_by: userId,
            rejected_at: new Date().toISOString(),
            rejection_reason: data.reason,
          },
        })
        .where(eq(opsRun.id, data.run_id))
        .returning();

      await this.emitEvent('ops.run.rejected', data.run_id, {
        run_id: data.run_id,
        rejected_by: userId,
        reason: data.reason,
      });

      return this.mapRunToResponse(updatedRun);
    }

    // Check dual control requirement
    const approvals = run[0]!.approvals_jsonb as any;
    if (approvals.required && approvals.requested_by === userId) {
      throw new Error(
        'Requester cannot approve their own run (dual control required)'
      );
    }

    const [updatedRun] = await db
      .update(opsRun)
      .set({
        status: 'approved',
        approvals_jsonb: {
          ...approvals,
          approved_by: userId,
          approved_at: new Date().toISOString(),
          approval_reason: data.reason,
        },
      })
      .where(eq(opsRun.id, data.run_id))
      .returning();

    await this.emitEvent('ops.run.approved', data.run_id, {
      run_id: data.run_id,
      approved_by: userId,
      reason: data.reason,
    });

    return this.mapRunToResponse(updatedRun);
  }

  /**
   * Execute an approved run
   */
  async executeRun(
    companyId: string,
    runId: string
  ): Promise<RunResponseM27_2> {
    const run = await db
      .select()
      .from(opsRun)
      .where(
        and(
          eq(opsRun.company_id, companyId),
          eq(opsRun.id, runId),
          eq(opsRun.status, 'approved')
        )
      )
      .limit(1);

    if (run.length === 0) {
      throw new Error(`Run ${runId} not found or not approved`);
    }

    // Check concurrency limits
    const concurrencyCheck = await this.guardrailService.checkConcurrency(
      companyId,
      'global' // Would get from playbook
    );

    if (!concurrencyCheck.allowed) {
      throw new Error(`Concurrency check failed: ${concurrencyCheck.reason}`);
    }

    // Start execution
    const [updatedRun] = await db
      .update(opsRun)
      .set({
        status: 'running',
        started_at: new Date(),
      })
      .where(eq(opsRun.id, runId))
      .returning();

    try {
      // Get run steps
      const steps = await db
        .select()
        .from(opsRunStep)
        .where(eq(opsRunStep.run_id, runId))
        .orderBy(asc(opsRunStep.idx));

      // Execute steps
      const executedSteps = [];
      for (const step of steps) {
        const executedStep = await this.executeStep(step, companyId);
        executedSteps.push(executedStep);

        // Check outcome checks
        const outcomeCheck = await this.checkOutcomes(runId, executedStep);
        if (!outcomeCheck.passed) {
          // Trigger rollback
          await this.rollbackRun(runId, executedSteps);
          break;
        }
      }

      // Finalize run
      const finalRun = await this.finalizeRun(runId, executedSteps);
      return this.mapRunToResponse(finalRun, executedSteps);
    } catch (error) {
      // Mark run as failed
      await db
        .update(opsRun)
        .set({
          status: 'failed',
          ended_at: new Date(),
          metrics_jsonb: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .where(eq(opsRun.id, runId));

      throw error;
    }
  }

  /**
   * Cancel a run
   */
  async cancelRun(
    companyId: string,
    userId: string,
    data: CancelRunM27_2
  ): Promise<RunResponseM27_2> {
    const [updatedRun] = await db
      .update(opsRun)
      .set({
        status: 'cancelled',
        ended_at: new Date(),
        approvals_jsonb: {
          cancelled_by: userId,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: data.reason,
        },
      })
      .where(
        and(
          eq(opsRun.company_id, companyId),
          eq(opsRun.id, data.run_id),
          sql`status IN ('queued', 'approved', 'running')`
        )
      )
      .returning();

    if (!updatedRun) {
      throw new Error(`Run ${data.run_id} not found or cannot be cancelled`);
    }

    await this.emitEvent('ops.run.cancelled', data.run_id, {
      run_id: data.run_id,
      cancelled_by: userId,
      reason: data.reason,
    });

    return this.mapRunToResponse(updatedRun);
  }

  /**
   * List runs with filtering
   */
  async listRuns(
    companyId: string,
    query: ListRunsQueryM27_2
  ): Promise<{ runs: RunResponseM27_2[]; total: number }> {
    const conditions = [eq(opsRun.company_id, companyId)];

    if (query.status) {
      conditions.push(eq(opsRun.status, query.status));
    }

    if (query.code) {
      // Would join with playbook to filter by code
    }

    if (query.since) {
      conditions.push(sql`created_at >= ${query.since}`);
    }

    if (query.until) {
      conditions.push(sql`created_at <= ${query.until}`);
    }

    const [runs, totalResult] = await Promise.all([
      db
        .select()
        .from(opsRun)
        .where(and(...conditions))
        .orderBy(desc(opsRun.created_at))
        .limit(query.limit)
        .offset(query.offset),
      db
        .select({ count: count() })
        .from(opsRun)
        .where(and(...conditions)),
    ]);

    const runsWithSteps = await Promise.all(
      runs.map(async run => {
        const steps = await db
          .select()
          .from(opsRunStep)
          .where(eq(opsRunStep.run_id, run.id))
          .orderBy(asc(opsRunStep.idx));

        return this.mapRunToResponse(run, steps);
      })
    );

    return {
      runs: runsWithSteps,
      total: totalResult[0]!.count,
    };
  }

  private async executeStep(step: any, companyId: string): Promise<any> {
    const startTime = Date.now();

    try {
      // Update step status to running
      await db
        .update(opsRunStep)
        .set({ status: 'running' })
        .where(eq(opsRunStep.id, step.id));

      // Execute action
      const result = await this.actionRegistry.executeAction(
        step.action_code,
        step.input_jsonb,
        { companyId, userId: 'system' }
      );

      const duration = Date.now() - startTime;

      // Update step with results
      const [updatedStep] = await db
        .update(opsRunStep)
        .set({
          status: 'succeeded',
          output_jsonb: result.output,
          duration_ms: duration,
        })
        .where(eq(opsRunStep.id, step.id))
        .returning();

      return updatedStep;
    } catch (error) {
      const duration = Date.now() - startTime;

      const [updatedStep] = await db
        .update(opsRunStep)
        .set({
          status: 'failed',
          output_jsonb: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          duration_ms: duration,
        })
        .where(eq(opsRunStep.id, step.id))
        .returning();

      return updatedStep;
    }
  }

  private async checkOutcomes(
    runId: string,
    step: any
  ): Promise<{ passed: boolean; reason?: string }> {
    // Placeholder implementation for outcome checks
    // In production, this would evaluate metrics and thresholds

    if (step.status === 'failed') {
      return { passed: false, reason: 'Step execution failed' };
    }

    // Check if output contains error indicators
    if (step.output_jsonb?.error) {
      return { passed: false, reason: step.output_jsonb.error };
    }

    return { passed: true };
  }

  private async rollbackRun(
    runId: string,
    executedSteps: any[]
  ): Promise<void> {
    // Create rollback steps for executed steps in reverse order
    for (let i = executedSteps.length - 1; i >= 0; i--) {
      const step = executedSteps[i];

      const inverseAction = this.actionRegistry.getInverseAction(
        step.action_code,
        step.output_jsonb
      );

      if (inverseAction) {
        const [rollbackStep] = await db
          .insert(opsRollbackStep)
          .values({
            id: crypto.randomUUID(),
            run_step_id: step.id,
            action_code: inverseAction.code,
            input_jsonb: inverseAction.inputSchema.parse(step.output_jsonb),
            status: 'pending',
          })
          .returning();

        // Execute rollback step
        await this.executeRollbackStep(rollbackStep);
      }
    }

    // Mark run as rolled back
    await db
      .update(opsRun)
      .set({
        status: 'rolled_back',
        ended_at: new Date(),
      })
      .where(eq(opsRun.id, runId));
  }

  private async executeRollbackStep(rollbackStep: any): Promise<void> {
    try {
      await db
        .update(opsRollbackStep)
        .set({ status: 'running' })
        .where(eq(opsRollbackStep.id, rollbackStep.id));

      // Execute rollback action
      await this.actionRegistry.executeAction(
        rollbackStep.action_code,
        rollbackStep.input_jsonb,
        { companyId: 'system', userId: 'system' }
      );

      await db
        .update(opsRollbackStep)
        .set({ status: 'succeeded' })
        .where(eq(opsRollbackStep.id, rollbackStep.id));
    } catch (error) {
      await db
        .update(opsRollbackStep)
        .set({
          status: 'failed',
          // Store error in input_jsonb for now
        })
        .where(eq(opsRollbackStep.id, rollbackStep.id));
    }
  }

  private async finalizeRun(runId: string, steps: any[]): Promise<any> {
    const metrics: RunMetricsM27_2 = {
      entities_count: steps.reduce(
        (sum, step) => sum + (step.output_jsonb?.count || 0),
        0
      ),
      checks_pass: steps.filter(s => s.status === 'succeeded').length,
      checks_failed: steps.filter(s => s.status === 'failed').length,
      rollback_count: 0,
      p50_duration_ms: this.calculatePercentile(
        steps.map(s => s.duration_ms || 0),
        50
      ),
      p95_duration_ms: this.calculatePercentile(
        steps.map(s => s.duration_ms || 0),
        95
      ),
    };

    const [finalRun] = await db
      .update(opsRun)
      .set({
        status: 'succeeded',
        ended_at: new Date(),
        metrics_jsonb: metrics,
      })
      .where(eq(opsRun.id, runId))
      .returning();

    await this.emitEvent('ops.run.completed', runId, {
      run_id: runId,
      status: 'succeeded',
      metrics,
    });

    return finalRun;
  }

  private computeCanaryScope(
    scope: any,
    samplePercent: number,
    minEntities: number
  ): any {
    // Placeholder implementation for canary scope computation
    // In production, this would intelligently sample entities
    return {
      ...scope,
      canary: true,
      sample_percent: samplePercent,
      min_entities: minEntities,
    };
  }

  private resolveStepInput(stepInput: any, runScope: any): any {
    // Resolve template variables in step input
    if (typeof stepInput === 'string') {
      return stepInput.replace(
        /\{\{scope\.(\w+)\}\}/g,
        (match: string, key: string) => {
          return runScope?.[key] || match;
        }
      );
    }

    if (typeof stepInput === 'object' && stepInput !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(stepInput)) {
        resolved[key] = this.resolveStepInput(value, runScope);
      }
      return resolved;
    }

    return stepInput;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private async emitEvent(
    topic: string,
    key: string,
    payload: any
  ): Promise<void> {
    await db.insert(opsOutbox).values({
      id: crypto.randomUUID(),
      topic,
      key,
      payload_jsonb: payload,
    });
  }

  private mapRunToResponse(run: any, steps?: any[]): RunResponseM27_2 {
    return {
      id: run.id,
      company_id: run.company_id,
      rule_id: run.rule_id,
      playbook_version_id: run.playbook_version_id,
      trigger: run.trigger,
      status: run.status,
      canary: run.canary,
      scope_jsonb: run.scope_jsonb,
      blast_radius_eval: run.blast_radius_eval,
      approvals_jsonb: run.approvals_jsonb,
      metrics_jsonb: run.metrics_jsonb,
      started_at: run.started_at?.toISOString(),
      ended_at: run.ended_at?.toISOString(),
      created_by: run.created_by,
      created_at: run.created_at.toISOString(),
      steps: steps?.map(step => ({
        id: step.id,
        idx: step.idx,
        action_code: step.action_code,
        input_jsonb: step.input_jsonb,
        output_jsonb: step.output_jsonb,
        status: step.status,
        duration_ms: step.duration_ms,
        rolled_back: step.rolled_back,
        created_at: step.created_at.toISOString(),
        updated_at: step.updated_at.toISOString(),
      })),
    };
  }
}
