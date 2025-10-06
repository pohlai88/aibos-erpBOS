import { db } from '@/lib/db';
import {
  eq,
  and,
  desc,
  gte,
  lte,
  sql,
  count,
  avg,
  max,
  min,
} from 'drizzle-orm';
import {
  opsPlaybookVersion,
  opsRuleVersion,
  opsDryRunExecution,
  opsCanaryExecution,
  opsApprovalRequest,
  opsActionVerification,
  opsExecutionMetrics,
  opsBlastRadiusLog,
  opsPlaybook,
  opsRule,
  opsFire,
  opsFireStep,
} from '@aibos/db-adapter/schema';
import type {
  PlaybookVersionUpsert,
  PlaybookVersionResponse,
  RuleVersionUpsert,
  RuleVersionResponse,
  VisualEditorSave,
  VisualEditorLoad,
  CanaryExecutionRequest,
  CanaryExecutionResponse,
  ApprovalRequestCreate,
  ApprovalRequestResponse,
  ApprovalDecision,
  ActionVerificationRequest,
  ActionVerificationResponse,
  ExecutionMetricsQuery,
  ExecutionMetricsResponse,
  BlastRadiusQuery,
  BlastRadiusResponse,
  VersionHistoryQuery,
  VersionHistoryResponse,
} from '@aibos/contracts';

/**
 * M27.2: Playbook Studio + Guarded Autonomy Service
 *
 * Provides visual rule/playbook editing with versioning, dry-run sandboxes,
 * blast-radius caps, human-in-the-loop approvals, canary mode, and post-action
 * verification with rollback capabilities.
 */
export class PlaybookStudioService {
  // === PLAYBOOK VERSIONING ===

  /**
   * Create a new version of a playbook with git-like history
   */
  async createPlaybookVersion(
    companyId: string,
    userId: string,
    data: PlaybookVersionUpsert
  ): Promise<PlaybookVersionResponse> {
    // Get next version number
    const latestVersion = await db
      .select({ version_no: opsPlaybookVersion.version_no })
      .from(opsPlaybookVersion)
      .where(
        and(
          eq(opsPlaybookVersion.company_id, companyId),
          eq(opsPlaybookVersion.playbook_id, data.playbook_id)
        )
      )
      .orderBy(desc(opsPlaybookVersion.version_no))
      .limit(1);

    const nextVersion = (latestVersion[0]?.version_no || 0) + 1;

    // Create new version
    const [version] = await db
      .insert(opsPlaybookVersion)
      .values({
        id: crypto.randomUUID(),
        company_id: companyId,
        playbook_id: data.playbook_id,
        version_no: nextVersion,
        version: nextVersion, // Add the required version field
        name: data.name,
        description: data.description,
        steps: data.steps,
        max_blast_radius: data.max_blast_radius,
        dry_run_default: data.dry_run_default,
        require_dual_control: data.require_dual_control,
        timeout_sec: data.timeout_sec,
        change_summary: data.change_summary,
        created_by: userId,
        is_active: true, // Will be set by trigger
      })
      .returning();

    if (!version) {
      throw new Error('Failed to create playbook version');
    }

    return {
      id: version.id,
      company_id: version.company_id,
      playbook_id: version.playbook_id,
      version_no: version.version_no,
      name: version.name,
      description: version.description || undefined,
      steps: version.steps as any,
      max_blast_radius: version.max_blast_radius,
      dry_run_default: version.dry_run_default,
      require_dual_control: version.require_dual_control,
      timeout_sec: version.timeout_sec,
      change_summary: version.change_summary || undefined,
      is_active: version.is_active,
      created_by: version.created_by,
      created_at: version.created_at.toISOString(),
      updated_at: version.updated_at.toISOString(),
    };
  }

  /**
   * Get playbook version history
   */
  async getPlaybookVersionHistory(
    companyId: string,
    playbookId: string,
    query: VersionHistoryQuery
  ): Promise<VersionHistoryResponse[]> {
    const versions = await db
      .select({
        id: opsPlaybookVersion.id,
        version_no: opsPlaybookVersion.version_no,
        name: opsPlaybookVersion.name,
        change_summary: opsPlaybookVersion.change_summary,
        is_active: opsPlaybookVersion.is_active,
        created_by: opsPlaybookVersion.created_by,
        created_at: opsPlaybookVersion.created_at,
        updated_at: opsPlaybookVersion.updated_at,
      })
      .from(opsPlaybookVersion)
      .where(
        and(
          eq(opsPlaybookVersion.company_id, companyId),
          eq(opsPlaybookVersion.playbook_id, playbookId)
        )
      )
      .orderBy(desc(opsPlaybookVersion.version_no))
      .limit(query.limit)
      .offset(query.offset);

    return versions.map((v: any) => ({
      id: v.id,
      version_no: v.version_no,
      name: v.name,
      change_summary: v.change_summary,
      is_active: v.is_active,
      created_by: v.created_by,
      created_at: v.created_at.toISOString(),
      updated_at: v.updated_at.toISOString(),
    }));
  }

  // === RULE VERSIONING ===

  /**
   * Create a new version of a rule with git-like history
   */
  async createRuleVersion(
    companyId: string,
    userId: string,
    data: RuleVersionUpsert
  ): Promise<RuleVersionResponse> {
    // Get next version number
    const latestVersion = await db
      .select({ version_no: opsRuleVersion.version_no })
      .from(opsRuleVersion)
      .where(
        and(
          eq(opsRuleVersion.company_id, companyId),
          eq(opsRuleVersion.rule_id, data.rule_id)
        )
      )
      .orderBy(desc(opsRuleVersion.version_no))
      .limit(1);

    const nextVersion = (latestVersion[0]?.version_no || 0) + 1;

    // Create new version
    const [version] = await db
      .insert(opsRuleVersion)
      .values({
        company_id: companyId,
        rule_id: data.rule_id,
        version_no: nextVersion,
        name: data.name,
        enabled: data.enabled,
        severity: data.severity,
        when_expr: data.when_expr,
        window_sec: data.window_sec,
        threshold: data.threshold,
        throttle_sec: data.throttle_sec,
        approvals: data.approvals,
        action_playbook_id: data.action_playbook_id,
        change_summary: data.change_summary,
        created_by: userId,
        is_active: true, // Will be set by trigger
      })
      .returning();

    if (!version) {
      throw new Error('Failed to create rule version');
    }

    return {
      id: version.id,
      company_id: version.company_id,
      rule_id: version.rule_id,
      version_no: version.version_no,
      name: version.name,
      enabled: version.enabled,
      severity: version.severity,
      when_expr: version.when_expr as any,
      window_sec: version.window_sec,
      threshold: version.threshold as any,
      throttle_sec: version.throttle_sec,
      approvals: version.approvals,
      action_playbook_id: version.action_playbook_id || undefined,
      change_summary: version.change_summary || undefined,
      is_active: version.is_active,
      created_by: version.created_by,
      created_at: version.created_at.toISOString(),
      updated_at: version.updated_at.toISOString(),
    };
  }

  // === VISUAL EDITOR ===

  /**
   * Save playbook/rule from visual editor
   */
  async saveFromVisualEditor(
    companyId: string,
    userId: string,
    data: VisualEditorSave
  ): Promise<{ playbook_id?: string; rule_id?: string; version_no: number }> {
    if (data.playbook_id) {
      // Save as playbook version
      const version = await this.createPlaybookVersion(companyId, userId, {
        playbook_id: data.playbook_id,
        name: data.name,
        description: data.description,
        steps: data.definition.steps || [],
        max_blast_radius: data.definition.max_blast_radius || 100,
        dry_run_default: data.definition.dry_run_default ?? true,
        require_dual_control: data.definition.require_dual_control ?? false,
        timeout_sec: data.definition.timeout_sec || 300,
        change_summary: data.change_summary,
      });

      return {
        playbook_id: version.playbook_id,
        version_no: version.version_no,
      };
    } else if (data.rule_id) {
      // Save as rule version
      const version = await this.createRuleVersion(companyId, userId, {
        rule_id: data.rule_id,
        name: data.name,
        enabled: data.definition.enabled ?? true,
        severity: data.definition.severity || 'HIGH',
        when_expr: data.definition.when_expr || {},
        window_sec: data.definition.window_sec || 3600,
        threshold: data.definition.threshold || {},
        throttle_sec: data.definition.throttle_sec || 3600,
        approvals: data.definition.approvals || 0,
        action_playbook_id: data.definition.action_playbook_id,
        change_summary: data.change_summary,
      });

      return {
        rule_id: version.rule_id,
        version_no: version.version_no,
      };
    } else {
      throw new Error('Either playbook_id or rule_id must be provided');
    }
  }

  // === DRY-RUN SANDBOX ===

  /**
   * Execute playbook in dry-run sandbox
   */
  async executeDryRun(
    companyId: string,
    userId: string,
    playbookId: string,
    versionNo?: number,
    payload: Record<string, any> = {}
  ): Promise<{
    execution_id: string;
    steps: any[];
    total_duration_ms: number;
  }> {
    const executionId = crypto.randomUUID();
    const startTime = Date.now();

    // Get playbook version
    const playbookQuery = versionNo
      ? db
          .select()
          .from(opsPlaybookVersion)
          .where(
            and(
              eq(opsPlaybookVersion.company_id, companyId),
              eq(opsPlaybookVersion.playbook_id, playbookId),
              eq(opsPlaybookVersion.version_no, versionNo)
            )
          )
      : db
          .select()
          .from(opsPlaybookVersion)
          .where(
            and(
              eq(opsPlaybookVersion.company_id, companyId),
              eq(opsPlaybookVersion.playbook_id, playbookId),
              eq(opsPlaybookVersion.is_active, true)
            )
          );

    const [playbookVersion] = await playbookQuery.limit(1);

    if (!playbookVersion) {
      throw new Error('Playbook version not found');
    }

    const steps = playbookVersion.steps as any[];
    const executedSteps = [];

    // Execute each step in dry-run mode
    for (const step of steps) {
      const stepStartTime = Date.now();

      try {
        // Simulate step execution (in real implementation, call actual action handlers)
        const result = await this.simulateStepExecution(step, payload, true);

        executedSteps.push({
          step_no: step.step_no || steps.indexOf(step) + 1,
          action_code: step.action_code,
          payload: step.payload,
          result: result,
          error_message: null,
          duration_ms: Date.now() - stepStartTime,
          dry_run: true,
        });
      } catch (error) {
        executedSteps.push({
          step_no: step.step_no || steps.indexOf(step) + 1,
          action_code: step.action_code,
          payload: step.payload,
          result: null,
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - stepStartTime,
          dry_run: true,
        });
      }
    }

    const totalDuration = Date.now() - startTime;

    // Save dry-run execution record
    await db.insert(opsDryRunExecution).values({
      company_id: companyId,
      playbook_id: playbookId,
      version_no: playbookVersion.version_no,
      execution_id: executionId,
      steps: executedSteps,
      total_duration_ms: totalDuration,
      created_by: userId,
      status: 'COMPLETED',
    });

    return {
      execution_id: executionId,
      steps: executedSteps,
      total_duration_ms: totalDuration,
    };
  }

  // === CANARY MODE ===

  /**
   * Execute playbook in canary mode (scoped subset)
   */
  async executeCanary(
    companyId: string,
    userId: string,
    data: CanaryExecutionRequest
  ): Promise<CanaryExecutionResponse> {
    const canaryId = crypto.randomUUID();
    const executionId = crypto.randomUUID();

    // Create canary execution record
    const [canaryExecution] = await db
      .insert(opsCanaryExecution)
      .values({
        company_id: companyId,
        fire_id: data.fire_id,
        playbook_id: data.playbook_id,
        canary_scope: data.canary_scope,
        execution_id: executionId,
        status: 'PENDING',
        created_by: userId,
      })
      .returning();

    // Start canary execution (in real implementation, this would be async)
    if (canaryExecution) {
      await this.startCanaryExecution(canaryExecution.id, data);
    }

    return {
      canary_id: canaryExecution?.id || '',
      execution_id: executionId,
      status: 'PENDING',
      canary_scope: data.canary_scope,
      success_rate: null,
      impact_summary: null,
      started_at: null,
      completed_at: null,
    };
  }

  // === APPROVAL WORKFLOW ===

  /**
   * Create approval request for human-in-the-loop
   */
  async createApprovalRequest(
    companyId: string,
    userId: string,
    data: ApprovalRequestCreate
  ): Promise<ApprovalRequestResponse> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expires_in_hours);

    const [approval] = await db
      .insert(opsApprovalRequest)
      .values({
        company_id: companyId,
        fire_id: data.fire_id,
        playbook_id: data.playbook_id,
        requested_by: userId,
        approval_type: data.approval_type,
        impact_estimate: data.impact_estimate,
        diff_summary: data.diff_summary,
        blast_radius_count: data.blast_radius_count,
        risk_score: data.risk_score.toString(),
        expires_at: expiresAt,
        status: 'PENDING',
      })
      .returning();

    if (!approval) {
      throw new Error('Failed to create approval request');
    }

    return {
      id: approval.id,
      company_id: approval.company_id,
      fire_id: approval.fire_id,
      playbook_id: approval.playbook_id,
      requested_by: approval.requested_by,
      approval_type: approval.approval_type,
      impact_estimate: approval.impact_estimate as any,
      diff_summary: approval.diff_summary as any,
      blast_radius_count: approval.blast_radius_count,
      risk_score: Number(approval.risk_score),
      status: approval.status,
      approved_by: approval.approved_by,
      approved_at: approval.approved_at?.toISOString() || null,
      rejection_reason: approval.rejection_reason,
      expires_at: approval.expires_at.toISOString(),
      created_at: approval.created_at.toISOString(),
      updated_at: approval.updated_at.toISOString(),
      expires_in_hours: data.expires_in_hours,
    };
  }

  /**
   * Process approval decision
   */
  async processApprovalDecision(
    companyId: string,
    userId: string,
    data: ApprovalDecision
  ): Promise<ApprovalRequestResponse> {
    const [approval] = await db
      .update(opsApprovalRequest)
      .set({
        status: data.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approved_by: userId,
        approved_at: new Date(),
        rejection_reason: data.decision === 'REJECT' ? data.reason : null,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(opsApprovalRequest.id, data.approval_id),
          eq(opsApprovalRequest.company_id, companyId)
        )
      )
      .returning();

    if (!approval) {
      throw new Error('Approval request not found');
    }

    return {
      id: approval.id,
      company_id: approval.company_id,
      fire_id: approval.fire_id,
      playbook_id: approval.playbook_id,
      requested_by: approval.requested_by,
      approval_type: approval.approval_type,
      impact_estimate: approval.impact_estimate as any,
      diff_summary: approval.diff_summary as any,
      blast_radius_count: approval.blast_radius_count,
      risk_score: Number(approval.risk_score),
      status: approval.status,
      approved_by: approval.approved_by,
      approved_at: approval.approved_at?.toISOString() || null,
      rejection_reason: approval.rejection_reason,
      expires_at: approval.expires_at.toISOString(),
      created_at: approval.created_at.toISOString(),
      updated_at: approval.updated_at.toISOString(),
      expires_in_hours: 24, // Default value since we don't have the original request
    };
  }

  // === ACTION VERIFICATION ===

  /**
   * Verify action outcome and trigger rollback if needed
   */
  async verifyActionOutcome(
    companyId: string,
    userId: string,
    data: ActionVerificationRequest
  ): Promise<ActionVerificationResponse> {
    const verificationId = crypto.randomUUID();

    // Perform verification logic based on type
    let verificationResult: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    let actualOutcome: Record<string, any> | null = null;
    let guardrailViolations: Record<string, any>[] = [];
    let rollbackTriggered = false;
    let rollbackReason: string | null = null;

    switch (data.verification_type) {
      case 'OUTCOME_CHECK':
        actualOutcome = await this.checkExpectedOutcome(data);
        verificationResult = this.evaluateOutcome(
          actualOutcome,
          data.expected_outcome
        );
        break;

      case 'GUARDRAIL_CHECK':
        guardrailViolations = await this.checkGuardrails(data);
        verificationResult = guardrailViolations.length > 0 ? 'FAIL' : 'PASS';
        break;

      case 'ROLLBACK_TRIGGER': {
        const shouldRollback = await this.evaluateRollbackTriggers(data);
        if (shouldRollback) {
          rollbackTriggered = true;
          rollbackReason = 'Rollback trigger conditions met';
          verificationResult = 'FAIL';
        }
        break;
      }
    }

    // Save verification record
    const [verification] = await db
      .insert(opsActionVerification)
      .values({
        id: verificationId,
        company_id: companyId,
        fire_id: data.fire_id,
        step_id: data.step_id,
        action_code: data.action_code,
        verification_type: data.verification_type,
        expected_outcome: data.expected_outcome,
        actual_outcome: actualOutcome,
        verification_result: verificationResult,
        guardrail_violations: guardrailViolations,
        rollback_triggered: rollbackTriggered,
        rollback_reason: rollbackReason,
        verified_by: userId,
      })
      .returning();

    if (!verification) {
      throw new Error('Failed to create verification record');
    }

    return {
      id: verification.id,
      verification_result: verification.verification_result,
      actual_outcome: verification.actual_outcome as any,
      guardrail_violations: verification.guardrail_violations as any,
      rollback_triggered: verification.rollback_triggered,
      rollback_reason: verification.rollback_reason,
      verified_at: verification.verified_at.toISOString(),
      verified_by: verification.verified_by,
    };
  }

  // === OBSERVABILITY ===

  /**
   * Get execution metrics for observability
   */
  async getExecutionMetrics(
    companyId: string,
    query: ExecutionMetricsQuery
  ): Promise<ExecutionMetricsResponse[]> {
    let whereConditions = [eq(opsExecutionMetrics.company_id, companyId)];

    if (query.playbook_id) {
      whereConditions.push(
        eq(opsExecutionMetrics.playbook_id, query.playbook_id)
      );
    }

    if (query.from_date) {
      whereConditions.push(
        gte(opsExecutionMetrics.execution_date, new Date(query.from_date))
      );
    }

    if (query.to_date) {
      whereConditions.push(
        lte(opsExecutionMetrics.execution_date, new Date(query.to_date))
      );
    }

    const metrics = await db
      .select()
      .from(opsExecutionMetrics)
      .where(and(...whereConditions))
      .orderBy(desc(opsExecutionMetrics.execution_date))
      .limit(query.limit);

    return metrics.map((m: any) => ({
      playbook_id: m.playbook_id,
      execution_date: m.execution_date.toISOString(),
      total_executions: m.total_executions,
      successful_executions: m.successful_executions,
      failed_executions: m.failed_executions,
      suppressed_executions: m.suppressed_executions,
      p50_duration_ms: m.p50_duration_ms,
      p95_duration_ms: m.p95_duration_ms,
      p99_duration_ms: m.p99_duration_ms,
      avg_duration_ms: m.avg_duration_ms,
      success_rate: m.success_rate ? Number(m.success_rate) : null,
    }));
  }

  /**
   * Get blast radius information
   */
  async getBlastRadius(
    companyId: string,
    query: BlastRadiusQuery
  ): Promise<BlastRadiusResponse[]> {
    let whereConditions = [eq(opsBlastRadiusLog.company_id, companyId)];

    if (query.fire_id) {
      whereConditions.push(eq(opsBlastRadiusLog.fire_id, query.fire_id));
    }

    if (query.playbook_id) {
      whereConditions.push(
        eq(opsBlastRadiusLog.playbook_id, query.playbook_id)
      );
    }

    if (query.entity_type) {
      whereConditions.push(
        eq(opsBlastRadiusLog.entity_type, query.entity_type)
      );
    }

    if (query.from_date) {
      whereConditions.push(
        gte(opsBlastRadiusLog.created_at, new Date(query.from_date))
      );
    }

    if (query.to_date) {
      whereConditions.push(
        lte(opsBlastRadiusLog.created_at, new Date(query.to_date))
      );
    }

    const logs = await db
      .select()
      .from(opsBlastRadiusLog)
      .where(and(...whereConditions))
      .orderBy(desc(opsBlastRadiusLog.created_at))
      .limit(query.limit);

    return logs.map((l: any) => ({
      id: l.id,
      fire_id: l.fire_id,
      playbook_id: l.playbook_id,
      entity_type: l.entity_type,
      entity_count: l.entity_count,
      entity_ids: l.entity_ids as string[],
      blast_radius_percentage: l.blast_radius_percentage
        ? Number(l.blast_radius_percentage)
        : null,
      created_at: l.created_at.toISOString(),
    }));
  }

  /**
   * Get rule version history
   */
  async getRuleVersionHistory(
    companyId: string,
    ruleId: string,
    query: VersionHistoryQuery
  ): Promise<VersionHistoryResponse[]> {
    const versions = await db
      .select({
        id: opsRuleVersion.id,
        version_no: opsRuleVersion.version_no,
        name: opsRuleVersion.name,
        change_summary: opsRuleVersion.change_summary,
        is_active: opsRuleVersion.is_active,
        created_by: opsRuleVersion.created_by,
        created_at: opsRuleVersion.created_at,
        updated_at: opsRuleVersion.updated_at,
      })
      .from(opsRuleVersion)
      .where(
        and(
          eq(opsRuleVersion.company_id, companyId),
          eq(opsRuleVersion.rule_id, ruleId)
        )
      )
      .orderBy(desc(opsRuleVersion.version_no))
      .limit(query.limit)
      .offset(query.offset);

    return versions.map((v: any) => ({
      id: v.id,
      version_no: v.version_no,
      name: v.name,
      change_summary: v.change_summary,
      is_active: v.is_active,
      created_by: v.created_by,
      created_at: v.created_at.toISOString(),
      updated_at: v.updated_at.toISOString(),
    }));
  }

  /**
   * Load playbook/rule for visual editor
   */
  async loadForVisualEditor(
    companyId: string,
    query: VisualEditorLoad
  ): Promise<Record<string, any>> {
    if (query.playbook_id) {
      const playbookQuery = query.version_no
        ? db
            .select()
            .from(opsPlaybookVersion)
            .where(
              and(
                eq(opsPlaybookVersion.company_id, companyId),
                eq(opsPlaybookVersion.playbook_id, query.playbook_id),
                eq(opsPlaybookVersion.version_no, query.version_no)
              )
            )
        : db
            .select()
            .from(opsPlaybookVersion)
            .where(
              and(
                eq(opsPlaybookVersion.company_id, companyId),
                eq(opsPlaybookVersion.playbook_id, query.playbook_id),
                eq(opsPlaybookVersion.is_active, true)
              )
            );

      const [playbookVersion] = await playbookQuery.limit(1);

      if (!playbookVersion) {
        throw new Error('Playbook version not found');
      }

      return {
        type: 'playbook',
        id: playbookVersion.playbook_id,
        version_no: playbookVersion.version_no,
        name: playbookVersion.name,
        description: playbookVersion.description,
        steps: playbookVersion.steps,
        max_blast_radius: playbookVersion.max_blast_radius,
        dry_run_default: playbookVersion.dry_run_default,
        require_dual_control: playbookVersion.require_dual_control,
        timeout_sec: playbookVersion.timeout_sec,
      };
    } else if (query.rule_id) {
      const ruleQuery = query.version_no
        ? db
            .select()
            .from(opsRuleVersion)
            .where(
              and(
                eq(opsRuleVersion.company_id, companyId),
                eq(opsRuleVersion.rule_id, query.rule_id),
                eq(opsRuleVersion.version_no, query.version_no)
              )
            )
        : db
            .select()
            .from(opsRuleVersion)
            .where(
              and(
                eq(opsRuleVersion.company_id, companyId),
                eq(opsRuleVersion.rule_id, query.rule_id),
                eq(opsRuleVersion.is_active, true)
              )
            );

      const [ruleVersion] = await ruleQuery.limit(1);

      if (!ruleVersion) {
        throw new Error('Rule version not found');
      }

      return {
        type: 'rule',
        id: ruleVersion.rule_id,
        version_no: ruleVersion.version_no,
        name: ruleVersion.name,
        enabled: ruleVersion.enabled,
        severity: ruleVersion.severity,
        when_expr: ruleVersion.when_expr,
        window_sec: ruleVersion.window_sec,
        threshold: ruleVersion.threshold,
        throttle_sec: ruleVersion.throttle_sec,
        approvals: ruleVersion.approvals,
        action_playbook_id: ruleVersion.action_playbook_id,
      };
    } else {
      throw new Error('Either playbook_id or rule_id must be provided');
    }
  }

  /**
   * Get canary execution status
   */
  async getCanaryStatus(
    companyId: string,
    canaryId: string
  ): Promise<CanaryExecutionResponse> {
    const [canary] = await db
      .select()
      .from(opsCanaryExecution)
      .where(
        and(
          eq(opsCanaryExecution.company_id, companyId),
          eq(opsCanaryExecution.id, canaryId)
        )
      )
      .limit(1);

    if (!canary) {
      throw new Error('Canary execution not found');
    }

    return {
      canary_id: canary.id,
      execution_id: canary.execution_id,
      status: canary.status,
      canary_scope: canary.canary_scope as any,
      success_rate: canary.success_rate ? Number(canary.success_rate) : null,
      impact_summary: canary.impact_summary as any,
      started_at: canary.started_at?.toISOString() || null,
      completed_at: canary.completed_at?.toISOString() || null,
    };
  }

  /**
   * Get approval requests
   */
  async getApprovalRequests(
    companyId: string,
    query: { fire_id?: string; status?: string; limit: number; offset: number }
  ): Promise<ApprovalRequestResponse[]> {
    let whereConditions = [eq(opsApprovalRequest.company_id, companyId)];

    if (query.fire_id) {
      whereConditions.push(eq(opsApprovalRequest.fire_id, query.fire_id));
    }

    if (query.status) {
      whereConditions.push(eq(opsApprovalRequest.status, query.status as any));
    }

    const approvals = await db
      .select()
      .from(opsApprovalRequest)
      .where(and(...whereConditions))
      .orderBy(desc(opsApprovalRequest.created_at))
      .limit(query.limit)
      .offset(query.offset);

    return approvals.map((a: any) => ({
      id: a.id,
      company_id: a.company_id,
      fire_id: a.fire_id,
      playbook_id: a.playbook_id,
      requested_by: a.requested_by,
      approval_type: a.approval_type,
      impact_estimate: a.impact_estimate as any,
      diff_summary: a.diff_summary as any,
      blast_radius_count: a.blast_radius_count,
      risk_score: Number(a.risk_score),
      status: a.status,
      approved_by: a.approved_by,
      approved_at: a.approved_at?.toISOString() || null,
      rejection_reason: a.rejection_reason,
      expires_at: a.expires_at.toISOString(),
      created_at: a.created_at.toISOString(),
      updated_at: a.updated_at.toISOString(),
      expires_in_hours: 24, // Default value since we don't have the original request
    }));
  }

  /**
   * Get action verifications
   */
  async getActionVerifications(
    companyId: string,
    query: { fire_id?: string; step_id?: string; limit: number; offset: number }
  ): Promise<ActionVerificationResponse[]> {
    let whereConditions = [eq(opsActionVerification.company_id, companyId)];

    if (query.fire_id) {
      whereConditions.push(eq(opsActionVerification.fire_id, query.fire_id));
    }

    if (query.step_id) {
      whereConditions.push(eq(opsActionVerification.step_id, query.step_id));
    }

    const verifications = await db
      .select()
      .from(opsActionVerification)
      .where(and(...whereConditions))
      .orderBy(desc(opsActionVerification.verified_at))
      .limit(query.limit)
      .offset(query.offset);

    return verifications.map((v: any) => ({
      id: v.id,
      verification_result: v.verification_result,
      actual_outcome: v.actual_outcome as any,
      guardrail_violations: v.guardrail_violations as any,
      rollback_triggered: v.rollback_triggered,
      rollback_reason: v.rollback_reason,
      verified_at: v.verified_at.toISOString(),
      verified_by: v.verified_by,
    }));
  }

  /**
   * Get dry-run execution history
   */
  async getDryRunHistory(
    companyId: string,
    playbookId: string,
    query: { limit: number; offset: number }
  ): Promise<any[]> {
    const executions = await db
      .select()
      .from(opsDryRunExecution)
      .where(
        and(
          eq(opsDryRunExecution.company_id, companyId),
          eq(opsDryRunExecution.playbook_id, playbookId)
        )
      )
      .orderBy(desc(opsDryRunExecution.executed_at))
      .limit(query.limit)
      .offset(query.offset);

    return executions.map((e: any) => ({
      id: e.id,
      execution_id: e.execution_id,
      version_no: e.version_no,
      steps: e.steps,
      total_duration_ms: e.total_duration_ms,
      executed_at: e.executed_at.toISOString(),
      created_by: e.created_by,
      status: e.status,
      error_message: e.error_message,
      result_summary: e.result_summary,
    }));
  }

  // === HELPER METHODS ===

  private async simulateStepExecution(
    step: any,
    payload: Record<string, any>,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    // Simulate step execution based on action_code
    // In real implementation, this would call actual action handlers

    const actionCode = step.action_code;
    const stepPayload = { ...step.payload, ...payload };

    // Simulate different action types
    switch (actionCode) {
      case 'ar_send_dunning':
        return {
          emails_sent: dryRun ? 0 : Math.floor(Math.random() * 10),
          customers_notified: dryRun ? 0 : Math.floor(Math.random() * 5),
          dry_run: dryRun,
        };

      case 'ap_process_payment':
        return {
          payments_processed: dryRun ? 0 : Math.floor(Math.random() * 20),
          total_amount: dryRun ? 0 : Math.floor(Math.random() * 10000),
          dry_run: dryRun,
        };

      case 'rev_generate_invoice':
        return {
          invoices_generated: dryRun ? 0 : Math.floor(Math.random() * 15),
          total_revenue: dryRun ? 0 : Math.floor(Math.random() * 50000),
          dry_run: dryRun,
        };

      default:
        return {
          action_executed: true,
          dry_run: dryRun,
          simulated: true,
        };
    }
  }

  private async startCanaryExecution(
    canaryId: string,
    data: CanaryExecutionRequest
  ): Promise<void> {
    // Update status to RUNNING
    await db
      .update(opsCanaryExecution)
      .set({
        status: 'RUNNING',
        started_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(opsCanaryExecution.id, canaryId));

    // In real implementation, this would start actual canary execution
    // For now, simulate completion after a delay
    setTimeout(async () => {
      await db
        .update(opsCanaryExecution)
        .set({
          status: 'COMPLETED',
          completed_at: new Date(),
          success_rate: '95.5', // Simulated success rate as string
          impact_summary: {
            entities_affected: Math.floor(Math.random() * 10),
            estimated_impact: 'Low risk',
          },
          updated_at: new Date(),
        })
        .where(eq(opsCanaryExecution.id, canaryId));
    }, 5000);
  }

  private async checkExpectedOutcome(
    data: ActionVerificationRequest
  ): Promise<Record<string, any>> {
    // Simulate checking actual outcome against expected
    return {
      status: 'completed',
      entities_affected: Math.floor(Math.random() * 10),
      success_rate: 95.5,
    };
  }

  private evaluateOutcome(
    actual: Record<string, any> | null,
    expected: Record<string, any> | undefined
  ): 'PASS' | 'FAIL' | 'WARNING' {
    if (!actual || !expected) return 'WARNING';

    // Simple evaluation logic
    const actualSuccessRate = actual.success_rate || 0;
    const expectedSuccessRate = expected.success_rate || 90;

    if (actualSuccessRate >= expectedSuccessRate) return 'PASS';
    if (actualSuccessRate >= expectedSuccessRate * 0.8) return 'WARNING';
    return 'FAIL';
  }

  private async checkGuardrails(
    data: ActionVerificationRequest
  ): Promise<Record<string, any>[]> {
    // Simulate guardrail checks
    const violations = [];

    // Example: Check blast radius
    if (
      data.verification_rules.some(
        (rule: any) => rule.rule_type === 'blast_radius'
      )
    ) {
      const entityCount = Math.floor(Math.random() * 100);
      if (entityCount > 50) {
        violations.push({
          rule_type: 'blast_radius',
          threshold: 50,
          actual_value: entityCount,
          severity: 'HIGH',
        });
      }
    }

    return violations;
  }

  private async evaluateRollbackTriggers(
    data: ActionVerificationRequest
  ): Promise<boolean> {
    // Simulate rollback trigger evaluation
    const successRate = Math.random() * 100;
    return successRate < 80; // Rollback if success rate < 80%
  }
}
