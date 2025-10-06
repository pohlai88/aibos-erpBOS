import { db } from '@/lib/db';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { opsGuardPolicy, opsRun, opsCap } from '@aibos/db-adapter/schema';
import type {
  GuardPolicyUpsert,
  GuardPolicyResponse,
  RunRequestM27_2,
  RunMetricsM27_2,
} from '@aibos/contracts';

/**
 * M27.2: Guardrail Service
 *
 * Manages safety guardrails, blast radius evaluation, and concurrency control
 */
export class GuardrailService {
  /**
   * Create or update guard policy
   */
  async upsertGuardPolicy(
    companyId: string,
    userId: string,
    data: GuardPolicyUpsert
  ): Promise<GuardPolicyResponse> {
    const existingPolicy = await db
      .select()
      .from(opsGuardPolicy)
      .where(
        and(
          eq(opsGuardPolicy.company_id, companyId),
          eq(opsGuardPolicy.scope, data.scope)
        )
      )
      .limit(1);

    if (existingPolicy.length > 0) {
      // Update existing policy
      const [updatedPolicy] = await db
        .update(opsGuardPolicy)
        .set({
          max_concurrent: data.max_concurrent,
          blast_radius: data.blast_radius,
          requires_dual_control: data.requires_dual_control,
          canary: data.canary,
          rollback_policy: data.rollback_policy,
          timeout_sec: data.timeout_sec,
          cooldown_sec: data.cooldown_sec,
          updated_by: userId,
          updated_at: new Date(),
        })
        .where(eq(opsGuardPolicy.id, existingPolicy[0]!.id))
        .returning();

      return this.mapPolicyToResponse(updatedPolicy);
    } else {
      // Create new policy
      const [newPolicy] = await db
        .insert(opsGuardPolicy)
        .values({
          id: crypto.randomUUID(),
          company_id: companyId,
          scope: data.scope,
          max_concurrent: data.max_concurrent,
          blast_radius: data.blast_radius,
          requires_dual_control: data.requires_dual_control,
          canary: data.canary,
          rollback_policy: data.rollback_policy,
          timeout_sec: data.timeout_sec,
          cooldown_sec: data.cooldown_sec,
          updated_by: userId,
        })
        .returning();

      return this.mapPolicyToResponse(newPolicy);
    }
  }

  /**
   * Get effective guard policy (global → playbook scope → spec guards)
   */
  async getEffectiveGuards(
    companyId: string,
    playbookCode?: string,
    specGuards?: any
  ): Promise<GuardPolicyResponse> {
    // Start with global policy
    const globalPolicy = await db
      .select()
      .from(opsGuardPolicy)
      .where(
        and(
          eq(opsGuardPolicy.company_id, companyId),
          eq(opsGuardPolicy.scope, 'global')
        )
      )
      .limit(1);

    let effectivePolicy = globalPolicy[0] || this.getDefaultPolicy();

    // Override with playbook-specific policy if exists
    if (playbookCode) {
      const playbookPolicy = await db
        .select()
        .from(opsGuardPolicy)
        .where(
          and(
            eq(opsGuardPolicy.company_id, companyId),
            eq(opsGuardPolicy.scope, `playbook:${playbookCode}`)
          )
        )
        .limit(1);

      if (playbookPolicy.length > 0) {
        effectivePolicy = this.mergePolicies(
          effectivePolicy,
          playbookPolicy[0]
        );
      }
    }

    // Override with spec guards if provided
    if (specGuards) {
      effectivePolicy = this.mergeSpecGuards(effectivePolicy, specGuards);
    }

    return this.mapPolicyToResponse(effectivePolicy);
  }

  /**
   * Evaluate blast radius against scope
   */
  async evaluateBlastRadius(
    companyId: string,
    scope: any,
    playbookCode: string,
    specGuards?: any
  ): Promise<{
    allowed: boolean;
    reason?: string;
    entityCount: number;
    percentage: number;
  }> {
    const guards = await this.getEffectiveGuards(
      companyId,
      playbookCode,
      specGuards
    );

    // Count entities in scope
    const entityCount = this.countEntitiesInScope(scope);
    const percentage = this.calculatePercentage(companyId, entityCount);

    // Check blast radius limits
    if (
      guards.blast_radius?.maxEntities &&
      entityCount > guards.blast_radius.maxEntities
    ) {
      return {
        allowed: false,
        reason: `Entity count ${entityCount} exceeds maximum ${guards.blast_radius.maxEntities}`,
        entityCount,
        percentage,
      };
    }

    if (
      guards.blast_radius?.maxPercent &&
      percentage > guards.blast_radius.maxPercent
    ) {
      return {
        allowed: false,
        reason: `Percentage ${percentage}% exceeds maximum ${guards.blast_radius.maxPercent}%`,
        entityCount,
        percentage,
      };
    }

    return {
      allowed: true,
      entityCount,
      percentage,
    };
  }

  /**
   * Check concurrency limits
   */
  async checkConcurrency(
    companyId: string,
    playbookCode: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    currentRunning: number;
    maxConcurrent: number;
  }> {
    const guards = await this.getEffectiveGuards(companyId, playbookCode);

    // Count currently running executions
    const runningCount = await db
      .select({ count: count() })
      .from(opsRun)
      .where(
        and(eq(opsRun.company_id, companyId), eq(opsRun.status, 'running'))
      );

    const currentRunning = runningCount[0]!.count;
    const maxConcurrent = guards.max_concurrent || 1;

    if (currentRunning >= maxConcurrent) {
      return {
        allowed: false,
        reason: `Concurrency limit reached: ${currentRunning}/${maxConcurrent}`,
        currentRunning,
        maxConcurrent,
      };
    }

    return {
      allowed: true,
      currentRunning,
      maxConcurrent,
    };
  }

  /**
   * Check cooldown period
   */
  async checkCooldown(
    companyId: string,
    playbookCode: string,
    lastRunTime?: Date
  ): Promise<{
    allowed: boolean;
    reason?: string;
    cooldownRemaining?: number;
  }> {
    const guards = await this.getEffectiveGuards(companyId, playbookCode);
    const cooldownSec = guards.cooldown_sec || 3600;

    if (!lastRunTime) {
      return { allowed: true };
    }

    const now = new Date();
    const timeSinceLastRun = (now.getTime() - lastRunTime.getTime()) / 1000;
    const cooldownRemaining = cooldownSec - timeSinceLastRun;

    if (cooldownRemaining > 0) {
      return {
        allowed: false,
        reason: `Cooldown period active: ${Math.ceil(cooldownRemaining)}s remaining`,
        cooldownRemaining,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if dual control is required
   */
  async requiresDualControl(
    companyId: string,
    playbookCode: string,
    specGuards?: any
  ): Promise<boolean> {
    const guards = await this.getEffectiveGuards(
      companyId,
      playbookCode,
      specGuards
    );
    return guards.requires_dual_control || false;
  }

  /**
   * Evaluate canary requirements
   */
  async evaluateCanary(
    companyId: string,
    playbookCode: string,
    specGuards?: any
  ): Promise<{
    required: boolean;
    samplePercent?: number;
    minEntities?: number;
  }> {
    const guards = await this.getEffectiveGuards(
      companyId,
      playbookCode,
      specGuards
    );

    return {
      required: !!guards.canary,
      ...(guards.canary?.samplePercent !== undefined && {
        samplePercent: guards.canary.samplePercent,
      }),
      ...(guards.canary?.minEntities !== undefined && {
        minEntities: guards.canary.minEntities,
      }),
    };
  }

  private getDefaultPolicy(): any {
    return {
      id: 'default',
      company_id: '',
      scope: 'default',
      max_concurrent: 1,
      blast_radius: { maxEntities: 100, maxPercent: 10 },
      requires_dual_control: false,
      canary: null,
      rollback_policy: null,
      timeout_sec: 900,
      cooldown_sec: 3600,
      updated_at: new Date(),
      updated_by: 'system',
    };
  }

  private mergePolicies(base: any, override: any): any {
    return {
      ...base,
      ...override,
      blast_radius: { ...base.blast_radius, ...override.blast_radius },
      canary: { ...base.canary, ...override.canary },
      rollback_policy: { ...base.rollback_policy, ...override.rollback_policy },
    };
  }

  private mergeSpecGuards(policy: any, specGuards: any): any {
    return {
      ...policy,
      requiresDualControl:
        specGuards.requiresDualControl ?? policy.requires_dual_control,
      blastRadius: specGuards.blastRadius ?? policy.blast_radius,
      timeoutSec: specGuards.timeoutSec ?? policy.timeout_sec,
      cooldownSec: specGuards.cooldownSec ?? policy.cooldown_sec,
      canary: specGuards.canary ?? policy.canary,
      rollbackPolicy: specGuards.rollbackPolicy ?? policy.rollback_policy,
    };
  }

  private countEntitiesInScope(scope: any): number {
    if (!scope) return 0;

    // Count entities based on scope structure
    if (scope.company_ids && Array.isArray(scope.company_ids)) {
      return scope.company_ids.length;
    }

    if (scope.entity_ids && Array.isArray(scope.entity_ids)) {
      return scope.entity_ids.length;
    }

    if (typeof scope === 'object') {
      return Object.keys(scope).length;
    }

    return 1; // Default to 1 if we can't determine
  }

  private calculatePercentage(companyId: string, entityCount: number): number {
    // This would typically query total entities for the company
    // For now, return a mock percentage
    return Math.min((entityCount / 1000) * 100, 100);
  }

  private mapPolicyToResponse(policy: any): GuardPolicyResponse {
    return {
      id: policy.id,
      company_id: policy.company_id,
      scope: policy.scope,
      max_concurrent: policy.max_concurrent,
      blast_radius: policy.blast_radius,
      requires_dual_control: policy.requires_dual_control,
      canary: policy.canary,
      rollback_policy: policy.rollback_policy,
      timeout_sec: policy.timeout_sec,
      cooldown_sec: policy.cooldown_sec,
      updated_at: policy.updated_at.toISOString(),
      updated_by: policy.updated_by,
    };
  }
}
