import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { createHash } from 'crypto';
import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import {
  opsPlaybook,
  opsPlaybookVersion,
  opsActionRegistry,
  opsFire,
  opsFireStep,
  opsGuardrailLock,
  opsQuorumVote,
  opsRule,
} from '@aibos/db-adapter/schema';
import type {
  PlaybookUpsertM27_2,
  PlaybookResponseM27_2,
  PlaybookSpec,
  FireResponse,
  FireApprove,
  FireExecute,
  DryRunRequest,
  DryRunResponse,
} from '@aibos/contracts';
import { logLine } from '@/lib/log';

export class OpsPlaybookEngine {
  constructor(private dbInstance = db) {}

  /**
   * Create or update a playbook
   */
  async upsertPlaybook(
    companyId: string,
    userId: string,
    data: PlaybookUpsertM27_2
  ): Promise<PlaybookResponseM27_2> {
    try {
      // Validate action codes exist in registry
      for (const step of data.spec.steps) {
        const action = await this.dbInstance
          .select()
          .from(opsActionRegistry)
          .where(eq(opsActionRegistry.code, step.action))
          .limit(1);

        if (action.length === 0) {
          throw new Error(`Action code "${step.action}" not found in registry`);
        }
      }

      // Check if playbook exists (by name for now)
      const existing = await this.dbInstance
        .select()
        .from(opsPlaybook)
        .where(
          and(
            eq(opsPlaybook.company_id, companyId),
            eq(opsPlaybook.name, data.name)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing playbook metadata
        const [updated] = await this.dbInstance
          .update(opsPlaybook)
          .set({
            name: data.name,
            status: data.status,
            updated_by: userId,
            updated_at: new Date(),
          })
          .where(eq(opsPlaybook.id, existing[0]!.id))
          .returning();

        // Create new version with the spec
        const newVersion = await this.createPlaybookVersion(
          companyId,
          existing[0]!.id,
          data.spec,
          userId
        );

        return this.mapPlaybookToResponse(updated, newVersion);
      } else {
        // Create new playbook
        const [created] = await this.dbInstance
          .insert(opsPlaybook)
          .values({
            id: crypto.randomUUID(),
            company_id: companyId,
            code: data.code,
            name: data.name,
            status: data.status,
            created_by: userId,
            updated_by: userId,
          })
          .returning();

        if (!created) {
          throw new Error('Failed to create playbook');
        }

        // Create initial version with the spec
        const initialVersion = await this.createPlaybookVersion(
          companyId,
          created.id,
          data.spec,
          userId
        );

        return this.mapPlaybookToResponse(created, initialVersion);
      }
    } catch (error) {
      logLine({
        msg: 'OpsPlaybookEngine.upsertPlaybook error',
        companyId,
        userId,
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute a playbook (dry run or actual)
   */
  async executePlaybook(
    companyId: string,
    userId: string,
    request: DryRunRequest
  ): Promise<DryRunResponse> {
    try {
      const playbook = await this.dbInstance
        .select()
        .from(opsPlaybook)
        .where(
          and(
            eq(opsPlaybook.id, request.playbook_id),
            eq(opsPlaybook.company_id, companyId)
          )
        )
        .limit(1);

      if (playbook.length === 0) {
        throw new Error(`Playbook not found: ${request.playbook_id}`);
      }

      const pb = playbook[0]!;

      // Get the latest version of the playbook
      const version = await this.dbInstance
        .select()
        .from(opsPlaybookVersion)
        .where(
          and(
            eq(opsPlaybookVersion.playbook_id, pb.id),
            eq(opsPlaybookVersion.version_no, pb.latest_version)
          )
        )
        .limit(1);

      if (version.length === 0) {
        throw new Error(`Playbook version not found: ${pb.id}`);
      }

      const playbookVersion = version[0]!;
      const executionId = ulid();
      const startTime = Date.now();
      const steps = [];

      // Execute each step
      const playbookSteps = playbookVersion.steps as any[];
      for (let i = 0; i < playbookSteps.length; i++) {
        const step = playbookSteps[i];
        const stepStartTime = Date.now();

        try {
          const result = await this.executeStep(
            step,
            request.payload,
            request.dry_run,
            executionId,
            i + 1
          );

          steps.push({
            step_no: i + 1,
            action_code: step.action,
            payload: step.input,
            result: result,
            error_message: null,
            duration_ms: Date.now() - stepStartTime,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          steps.push({
            step_no: i + 1,
            action_code: step.action,
            payload: step.input,
            result: null,
            error_message: errorMessage,
            duration_ms: Date.now() - stepStartTime,
          });

          // Handle step error based on configuration
          if (step.on_error === 'STOP') {
            break;
          } else if (step.on_error === 'RETRY' && step.retry) {
            // Implement retry logic here
            // For now, just continue
          }
          // If CONTINUE, just log and continue
        }
      }

      const totalDuration = Date.now() - startTime;

      logLine({
        msg: 'OpsPlaybookEngine.executePlaybook completed',
        companyId,
        userId,
        playbookId: request.playbook_id,
        executionId,
        dryRun: request.dry_run,
        totalDuration,
        stepsExecuted: steps.length,
      });

      return {
        execution_id: executionId,
        playbook_id: request.playbook_id,
        steps,
        total_duration_ms: totalDuration,
        executed_at: new Date().toISOString(),
      };
    } catch (error) {
      logLine({
        msg: 'OpsPlaybookEngine.executePlaybook error',
        companyId,
        userId,
        request,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute a single playbook step
   */
  private async executeStep(
    step: any,
    payload: Record<string, any>,
    dryRun: boolean,
    executionId: string,
    stepNo: number
  ): Promise<Record<string, any> | null> {
    try {
      // Get action registry entry
      const action = await this.dbInstance
        .select()
        .from(opsActionRegistry)
        .where(eq(opsActionRegistry.code, step.action_code))
        .limit(1);

      if (action.length === 0) {
        throw new Error(`Action "${step.action_code}" not found in registry`);
      }

      const actionDef = action[0];

      // Merge step payload with request payload
      const mergedPayload = { ...payload, ...step.payload };

      // Execute action based on code
      switch (step.action_code) {
        case 'AR.DUNNING.RUN':
          return await this.executeArDunningRun(mergedPayload, dryRun);
        case 'AP.PAYRUN.RESEQUENCE':
          return await this.executeApPayrunResequence(mergedPayload, dryRun);
        case 'FX.REVAL.DRY_RUN':
          return await this.executeFxRevalDryRun(mergedPayload, dryRun);
        case 'CLOSE.ACCRUAL.DRAFT':
          return await this.executeCloseAccrualDraft(mergedPayload, dryRun);
        case 'CTRL.INCIDENT.OPEN':
          return await this.executeCtrlIncidentOpen(mergedPayload, dryRun);
        case 'CASH.ALERTS.TEST':
          return await this.executeCashAlertsTest(mergedPayload, dryRun);
        default:
          throw new Error(`Unknown action code: ${step.action_code}`);
      }
    } catch (error) {
      logLine({
        msg: 'OpsPlaybookEngine.executeStep error',
        actionCode: step.action_code,
        executionId,
        stepNo,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute AR Dunning Run action
   */
  private async executeArDunningRun(
    payload: any,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    // TODO: Implement actual AR dunning service call
    return {
      action: 'AR.DUNNING.RUN',
      dry_run: dryRun,
      payload,
      result: dryRun ? 'DRY_RUN_SUCCESS' : 'EXECUTED',
      message: dryRun
        ? 'Dunning run would be executed'
        : 'Dunning run executed',
    };
  }

  /**
   * Execute AP Payrun Resequence action
   */
  private async executeApPayrunResequence(
    payload: any,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    // TODO: Implement actual AP payrun resequence service call
    return {
      action: 'AP.PAYRUN.RESEQUENCE',
      dry_run: dryRun,
      payload,
      result: dryRun ? 'DRY_RUN_SUCCESS' : 'EXECUTED',
      message: dryRun ? 'Payrun would be resequenced' : 'Payrun resequenced',
    };
  }

  /**
   * Execute FX Reval Dry Run action
   */
  private async executeFxRevalDryRun(
    payload: any,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    // TODO: Implement actual FX reval service call
    return {
      action: 'FX.REVAL.DRY_RUN',
      dry_run: dryRun,
      payload,
      result: 'DRY_RUN_SUCCESS',
      message: 'FX revaluation dry run completed',
    };
  }

  /**
   * Execute Close Accrual Draft action
   */
  private async executeCloseAccrualDraft(
    payload: any,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    // TODO: Implement actual close accrual service call
    return {
      action: 'CLOSE.ACCRUAL.DRAFT',
      dry_run: dryRun,
      payload,
      result: dryRun ? 'DRY_RUN_SUCCESS' : 'EXECUTED',
      message: dryRun
        ? 'Accrual draft would be created'
        : 'Accrual draft created',
    };
  }

  /**
   * Execute Control Incident Open action
   */
  private async executeCtrlIncidentOpen(
    payload: any,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    // TODO: Implement actual control incident service call
    return {
      action: 'CTRL.INCIDENT.OPEN',
      dry_run: dryRun,
      payload,
      result: dryRun ? 'DRY_RUN_SUCCESS' : 'EXECUTED',
      message: dryRun
        ? 'Control incident would be opened'
        : 'Control incident opened',
    };
  }

  /**
   * Execute Cash Alerts Test action
   */
  private async executeCashAlertsTest(
    payload: any,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    // TODO: Implement actual cash alerts service call
    return {
      action: 'CASH.ALERTS.TEST',
      dry_run: dryRun,
      payload,
      result: 'DRY_RUN_SUCCESS',
      message: 'Cash alerts test completed',
    };
  }

  /**
   * Approve or reject a fire
   */
  async approveFire(
    companyId: string,
    userId: string,
    request: FireApprove
  ): Promise<void> {
    try {
      // Record the vote
      await this.dbInstance.insert(opsQuorumVote).values({
        fire_id: request.fire_id,
        actor_id: userId,
        decision: request.decision,
        reason: request.reason || null,
      });

      // Check if quorum is reached
      const fire = await this.dbInstance
        .select()
        .from(opsFire)
        .where(
          and(
            eq(opsFire.id, request.fire_id),
            eq(opsFire.company_id, companyId)
          )
        )
        .limit(1);

      if (fire.length === 0) {
        throw new Error(`Fire not found: ${request.fire_id}`);
      }

      const fireData = fire[0]!;
      const votes = await this.dbInstance
        .select()
        .from(opsQuorumVote)
        .where(eq(opsQuorumVote.fire_id, request.fire_id));

      const approvals = votes.filter(v => v.decision === 'APPROVE').length;
      const rejections = votes.filter(v => v.decision === 'REJECT').length;

      // Update fire status based on votes
      if (approvals >= fireData.approvals_needed) {
        await this.dbInstance
          .update(opsFire)
          .set({
            status: 'APPROVED',
            approvals_got: approvals,
            updated_at: new Date(),
          })
          .where(eq(opsFire.id, request.fire_id));
      } else if (rejections > 0) {
        await this.dbInstance
          .update(opsFire)
          .set({
            status: 'SUPPRESSED',
            updated_at: new Date(),
          })
          .where(eq(opsFire.id, request.fire_id));
      }

      logLine({
        msg: 'OpsPlaybookEngine.approveFire',
        companyId,
        userId,
        fireId: request.fire_id,
        decision: request.decision,
        approvals,
        rejections,
        needed: fireData.approvals_needed,
      });
    } catch (error) {
      logLine({
        msg: 'OpsPlaybookEngine.approveFire error',
        companyId,
        userId,
        request,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute a fire
   */
  async executeFire(
    companyId: string,
    userId: string,
    request: FireExecute
  ): Promise<FireResponse> {
    try {
      const fire = await this.dbInstance
        .select()
        .from(opsFire)
        .where(
          and(
            eq(opsFire.id, request.fire_id),
            eq(opsFire.company_id, companyId)
          )
        )
        .limit(1);

      if (fire.length === 0) {
        throw new Error(`Fire not found: ${request.fire_id}`);
      }

      const fireData = fire[0]!;

      // Check if fire is ready for execution
      if (fireData.status !== 'APPROVED' && fireData.status !== 'PENDING') {
        throw new Error(
          `Fire is not ready for execution. Status: ${fireData.status}`
        );
      }

      // Update fire status to executing
      await this.dbInstance
        .update(opsFire)
        .set({
          status: 'EXECUTING',
          updated_at: new Date(),
        })
        .where(eq(opsFire.id, request.fire_id));

      // Get associated playbook
      const rule = await this.dbInstance
        .select()
        .from(opsRule)
        .where(eq(opsRule.id, fireData.rule_id))
        .limit(1);

      if (rule.length === 0 || !rule[0]!.action_playbook_id) {
        throw new Error('No playbook associated with this fire');
      }

      // Execute playbook
      const executionResult = await this.executePlaybook(companyId, userId, {
        playbook_id: rule[0]!.action_playbook_id,
        payload: {},
        dry_run: request.dry_run,
      });

      // Update fire status based on execution result
      const hasErrors = executionResult.steps.some(
        (step: any) => step.error_message
      );
      const finalStatus = hasErrors ? 'FAILED' : 'COMPLETED';

      await this.dbInstance
        .update(opsFire)
        .set({
          status: finalStatus,
          updated_at: new Date(),
        })
        .where(eq(opsFire.id, request.fire_id));

      // Create fire steps
      for (const step of executionResult.steps) {
        await this.dbInstance.insert(opsFireStep).values({
          fire_id: request.fire_id,
          step_no: step.step_no,
          action_code: step.action_code,
          dry_run: request.dry_run,
          payload: step.payload,
          attempt: 1,
          status: step.error_message ? 'FAILED' : 'OK',
          duration_ms: step.duration_ms,
          error_message: step.error_message,
          result: step.result,
          executed_at: new Date(),
        });
      }

      logLine({
        msg: 'OpsPlaybookEngine.executeFire completed',
        companyId,
        userId,
        fireId: request.fire_id,
        dryRun: request.dry_run,
        finalStatus,
        stepsExecuted: executionResult.steps.length,
      });

      // Return updated fire with steps
      return await this.getFireById(companyId, request.fire_id);
    } catch (error) {
      logLine({
        msg: 'OpsPlaybookEngine.executeFire error',
        companyId,
        userId,
        request,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get fire by ID with steps
   */
  async getFireById(companyId: string, fireId: string): Promise<FireResponse> {
    const fire = await this.dbInstance
      .select()
      .from(opsFire)
      .where(and(eq(opsFire.id, fireId), eq(opsFire.company_id, companyId)))
      .limit(1);

    if (fire.length === 0) {
      throw new Error(`Fire not found: ${fireId}`);
    }

    const fireData = fire[0]!;
    const steps = await this.dbInstance
      .select()
      .from(opsFireStep)
      .where(eq(opsFireStep.fire_id, fireId))
      .orderBy(asc(opsFireStep.step_no));

    return {
      id: fireData.id,
      company_id: fireData.company_id,
      rule_id: fireData.rule_id,
      window_from: fireData.window_from.toISOString(),
      window_to: fireData.window_to.toISOString(),
      reason: fireData.reason,
      status: fireData.status as any,
      approvals_needed: fireData.approvals_needed,
      approvals_got: fireData.approvals_got,
      created_by: fireData.created_by,
      created_at: fireData.created_at.toISOString(),
      updated_at: fireData.updated_at.toISOString(),
      steps: steps.map(step => ({
        id: step.id,
        step_no: step.step_no,
        action_code: step.action_code,
        dry_run: step.dry_run,
        payload: step.payload as Record<string, any>,
        attempt: step.attempt,
        status: step.status as any,
        duration_ms: step.duration_ms,
        error_message: step.error_message,
        result: step.result as Record<string, any> | null,
        executed_at: step.executed_at?.toISOString() || null,
      })),
    };
  }

  /**
   * Create a new playbook version
   */
  private async createPlaybookVersion(
    companyId: string,
    playbookId: string,
    spec: PlaybookSpec,
    userId: string
  ): Promise<any> {
    // Get the latest version number
    const latestVersion = await this.dbInstance
      .select({ version_no: opsPlaybookVersion.version_no })
      .from(opsPlaybookVersion)
      .where(eq(opsPlaybookVersion.playbook_id, playbookId))
      .orderBy(opsPlaybookVersion.version_no)
      .limit(1);

    const nextVersion =
      latestVersion.length > 0 ? latestVersion[0]!.version_no + 1 : 1;

    // Create the version
    const [version] = await this.dbInstance
      .insert(opsPlaybookVersion)
      .values({
        id: crypto.randomUUID(),
        company_id: companyId,
        playbook_id: playbookId,
        version_no: nextVersion,
        version: nextVersion, // Add the required version field
        name: `Version ${nextVersion}`,
        description: `Auto-generated version ${nextVersion}`,
        steps: spec.steps,
        max_blast_radius: spec.guards?.blastRadius?.maxEntities || 100,
        dry_run_default: spec.guards?.canary?.samplePercent ? true : false,
        require_dual_control: spec.guards?.requiresDualControl || false,
        timeout_sec: spec.guards?.timeoutSec || 300,
        spec_jsonb: spec,
        hash: createHash('sha256').update(JSON.stringify(spec)).digest('hex'),
        created_by: userId,
      })
      .returning();

    // Update the playbook's latest_version
    await this.dbInstance
      .update(opsPlaybook)
      .set({ latest_version: nextVersion })
      .where(eq(opsPlaybook.id, playbookId));

    return version;
  }

  /**
   * Validate playbook spec structure
   */
  async validateSpec(
    spec: PlaybookSpec
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!spec.steps || spec.steps.length === 0) {
      errors.push('Playbook must have at least one step');
    }

    // Validate each step
    for (const step of spec.steps) {
      if (!step.id) {
        errors.push('Step must have an id');
      }
      if (!step.action) {
        errors.push('Step must have an action');
      }
      if (!step.input) {
        errors.push('Step must have input');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Publish a playbook version (alias for createPlaybookVersion)
   */
  async publishPlaybookVersion(
    companyId: string,
    playbookCode: string,
    spec: PlaybookSpec,
    userId: string
  ): Promise<any> {
    // Find the playbook by code
    const playbook = await this.dbInstance
      .select()
      .from(opsPlaybook)
      .where(
        and(
          eq(opsPlaybook.company_id, companyId),
          eq(opsPlaybook.code, playbookCode)
        )
      )
      .limit(1);

    if (playbook.length === 0) {
      throw new Error(`Playbook ${playbookCode} not found`);
    }

    return this.createPlaybookVersion(companyId, playbook[0]!.id, spec, userId);
  }

  /**
   * Archive a playbook
   */
  async archivePlaybook(
    companyId: string,
    playbookCode: string,
    userId: string
  ): Promise<any> {
    const [updated] = await this.dbInstance
      .update(opsPlaybook)
      .set({
        status: 'archived',
        updated_by: userId,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(opsPlaybook.company_id, companyId),
          eq(opsPlaybook.code, playbookCode)
        )
      )
      .returning();

    return updated;
  }

  /**
   * Map database playbook to response type
   */
  private mapPlaybookToResponse(
    playbook: any,
    version?: any
  ): PlaybookResponseM27_2 {
    return {
      id: playbook.id,
      company_id: playbook.company_id,
      code: playbook.code,
      name: playbook.name,
      status: playbook.status,
      latest_version: playbook.latest_version,
      created_by: playbook.created_by,
      created_at: playbook.created_at.toISOString(),
      updated_by: playbook.updated_by,
      updated_at: playbook.updated_at.toISOString(),
      spec: version?.spec_jsonb || { steps: [] },
    };
  }
}
