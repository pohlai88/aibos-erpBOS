import { db } from "@/lib/db";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import {
    opsRule,
    opsPlaybook,
    opsPlaybookVersion,
    opsGuardPolicy,
    opsRun,
    opsRunStep,
    opsRollbackStep,
    opsOutbox,
    opsCap
} from "@aibos/db-adapter/schema";
import type {
    RuleUpsertM27_2,
    RuleResponseM27_2,
    PlaybookUpsertM27_2,
    PlaybookResponseM27_2,
    PlaybookVersionResponseM27_2,
    GuardPolicyUpsert,
    GuardPolicyResponse,
    RunRequestM27_2,
    RunResponseM27_2,
    ApproveRunM27_2,
    CancelRunM27_2,
    ListRunsQueryM27_2,
    ListRulesQueryM27_2,
    ListPlaybooksQueryM27_2,
    CapabilityGrantM27_2,
    CapabilityResponseM27_2,
    ActionDescriptorM27_2,
    RunMetricsM27_2,
    OutboxEventM27_2
} from "@aibos/contracts";

/**
 * M27.2: Rule Service
 * 
 * Manages rule metadata & schedule, compiles rule filters to predicates
 */
export class RuleService {

    /**
     * Create or update a rule
     */
    async upsertRule(
        companyId: string,
        userId: string,
        data: RuleUpsertM27_2
    ): Promise<RuleResponseM27_2> {
        const existingRule = await db
            .select()
            .from(opsRule)
            .where(
                and(
                    eq(opsRule.company_id, companyId),
                    eq(opsRule.code, data.code)
                )
            )
            .limit(1);

        if (existingRule.length > 0) {
            // Update existing rule
            const [updatedRule] = await db
                .update(opsRule)
                .set({
                    name: data.name,
                    kind: data.kind,
                    enabled: data.enabled,
                    source: data.source,
                    where_jsonb: data.where,
                    schedule_cron: data.schedule_cron,
                    priority: data.priority,
                    updated_by: userId,
                    updated_at: new Date()
                })
                .where(eq(opsRule.id, existingRule[0]!.id))
                .returning();

            return this.mapRuleToResponse(updatedRule);
        } else {
            // Create new rule
            const [newRule] = await db
                .insert(opsRule)
                .values({
                    id: crypto.randomUUID(),
                    company_id: companyId,
                    code: data.code,
                    name: data.name,
                    kind: data.kind,
                    enabled: data.enabled,
                    source: data.source,
                    where_jsonb: data.where,
                    schedule_cron: data.schedule_cron,
                    priority: data.priority,
                    created_by: userId,
                    updated_by: userId
                })
                .returning();

            return this.mapRuleToResponse(newRule);
        }
    }

    /**
     * List rules with filtering
     */
    async listRules(
        companyId: string,
        query: ListRulesQueryM27_2
    ): Promise<{ rules: RuleResponseM27_2[]; total: number }> {
        const conditions = [eq(opsRule.company_id, companyId)];

        if (query.enabled !== undefined) {
            conditions.push(eq(opsRule.enabled, query.enabled));
        }

        if (query.kind) {
            conditions.push(eq(opsRule.kind, query.kind));
        }

        const [rules, totalResult] = await Promise.all([
            db
                .select()
                .from(opsRule)
                .where(and(...conditions))
                .orderBy(desc(opsRule.priority), asc(opsRule.created_at))
                .limit(query.limit)
                .offset(query.offset),
            db
                .select({ count: count() })
                .from(opsRule)
                .where(and(...conditions))
        ]);

        return {
            rules: rules.map(this.mapRuleToResponse),
            total: totalResult[0]!.count
        };
    }

    /**
     * Enable/disable a rule
     */
    async toggleRule(
        companyId: string,
        ruleCode: string,
        enabled: boolean,
        userId: string
    ): Promise<RuleResponseM27_2> {
        const [updatedRule] = await db
            .update(opsRule)
            .set({
                enabled,
                updated_by: userId,
                updated_at: new Date()
            })
            .where(
                and(
                    eq(opsRule.company_id, companyId),
                    eq(opsRule.code, ruleCode)
                )
            )
            .returning();

        if (!updatedRule) {
            throw new Error(`Rule ${ruleCode} not found`);
        }

        return this.mapRuleToResponse(updatedRule);
    }

    /**
     * Compile rule filters to predicates for signal bus
     */
    async compileRuleFilters(companyId: string): Promise<Array<{
        ruleId: string;
        code: string;
        predicate: any;
        priority: number;
    }>> {
        const rules = await db
            .select({
                id: opsRule.id,
                code: opsRule.code,
                where_jsonb: opsRule.where_jsonb,
                priority: opsRule.priority
            })
            .from(opsRule)
            .where(
                and(
                    eq(opsRule.company_id, companyId),
                    eq(opsRule.enabled, true)
                )
            )
            .orderBy(desc(opsRule.priority));

        return rules.map(rule => ({
            ruleId: rule.id,
            code: rule.code,
            predicate: rule.where_jsonb,
            priority: rule.priority
        }));
    }

    private mapRuleToResponse(rule: any): RuleResponseM27_2 {
        return {
            id: rule.id,
            company_id: rule.company_id,
            code: rule.code,
            name: rule.name,
            kind: rule.kind,
            enabled: rule.enabled,
            source: rule.source,
            where: rule.where_jsonb,
            schedule_cron: rule.schedule_cron,
            priority: rule.priority,
            created_by: rule.created_by,
            updated_by: rule.updated_by,
            created_at: rule.created_at.toISOString(),
            updated_at: rule.updated_at.toISOString()
        };
    }
}

/**
 * M27.2: Playbook Service
 * 
 * Manages versioned playbook definitions with git-like history
 */
export class PlaybookService {

    /**
     * Create or update a playbook
     */
    async upsertPlaybook(
        companyId: string,
        userId: string,
        data: PlaybookUpsertM27_2
    ): Promise<PlaybookResponseM27_2> {
        const existingPlaybook = await db
            .select()
            .from(opsPlaybook)
            .where(
                and(
                    eq(opsPlaybook.company_id, companyId),
                    eq(opsPlaybook.code, data.code)
                )
            )
            .limit(1);

        if (existingPlaybook.length > 0) {
            // Update existing playbook
            const [updatedPlaybook] = await db
                .update(opsPlaybook)
                .set({
                    name: data.name,
                    status: data.status,
                    updated_by: userId,
                    updated_at: new Date()
                })
                .where(eq(opsPlaybook.id, existingPlaybook[0]!.id))
                .returning();

            return this.mapPlaybookToResponse(updatedPlaybook);
        } else {
            // Create new playbook
            const [newPlaybook] = await db
                .insert(opsPlaybook)
                .values({
                    id: crypto.randomUUID(),
                    company_id: companyId,
                    code: data.code,
                    name: data.name,
                    status: data.status,
                    created_by: userId,
                    updated_by: userId
                })
                .returning();

            return this.mapPlaybookToResponse(newPlaybook);
        }
    }

    /**
     * Publish a new version of a playbook
     */
    async publishPlaybookVersion(
        companyId: string,
        playbookCode: string,
        spec: any,
        userId: string,
        changeSummary?: string
    ): Promise<PlaybookVersionResponseM27_2> {
        // Get playbook
        const playbook = await db
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

        const nextVersion = playbook[0]!.latest_version + 1;
        const hash = this.computeSpecHash(spec);

        // Create new version
        const [version] = await db
            .insert(opsPlaybookVersion)
            .values({
                id: crypto.randomUUID(),
                company_id: playbook[0]!.company_id,
                playbook_id: playbook[0]!.id,
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
                hash: hash || '',
                created_by: userId
            })
            .returning();

        // Update playbook latest version
        await db
            .update(opsPlaybook)
            .set({
                latest_version: nextVersion,
                status: 'active',
                updated_by: userId,
                updated_at: new Date()
            })
            .where(eq(opsPlaybook.id, playbook[0]!.id));

        if (!version) {
            throw new Error('Failed to create playbook version');
        }

        return {
            id: version.id,
            playbook_id: version.playbook_id,
            version: version.version_no,
            spec_jsonb: version.spec_jsonb as any,
            hash: version.hash || '',
            created_by: version.created_by,
            created_at: version.created_at.toISOString()
        };
    }

    /**
     * Archive a playbook
     */
    async archivePlaybook(
        companyId: string,
        playbookCode: string,
        userId: string
    ): Promise<PlaybookResponseM27_2> {
        const [updatedPlaybook] = await db
            .update(opsPlaybook)
            .set({
                status: 'archived',
                updated_by: userId,
                updated_at: new Date()
            })
            .where(
                and(
                    eq(opsPlaybook.company_id, companyId),
                    eq(opsPlaybook.code, playbookCode)
                )
            )
            .returning();

        if (!updatedPlaybook) {
            throw new Error(`Playbook ${playbookCode} not found`);
        }

        return this.mapPlaybookToResponse(updatedPlaybook);
    }

    /**
     * List playbooks with filtering
     */
    async listPlaybooks(
        companyId: string,
        query: ListPlaybooksQueryM27_2
    ): Promise<{ playbooks: PlaybookResponseM27_2[]; total: number }> {
        const conditions = [eq(opsPlaybook.company_id, companyId)];

        if (query.status) {
            conditions.push(eq(opsPlaybook.status, query.status));
        }

        const [playbooks, totalResult] = await Promise.all([
            db
                .select()
                .from(opsPlaybook)
                .where(and(...conditions))
                .orderBy(desc(opsPlaybook.created_at))
                .limit(query.limit)
                .offset(query.offset),
            db
                .select({ count: count() })
                .from(opsPlaybook)
                .where(and(...conditions))
        ]);

        return {
            playbooks: playbooks.map(this.mapPlaybookToResponse),
            total: totalResult[0]!.count
        };
    }

    /**
     * Get playbook versions
     */
    async getPlaybookVersions(
        companyId: string,
        playbookCode: string
    ): Promise<PlaybookVersionResponseM27_2[]> {
        const versions = await db
            .select({
                id: opsPlaybookVersion.id,
                playbook_id: opsPlaybookVersion.playbook_id,
                version: opsPlaybookVersion.version,
                spec_jsonb: opsPlaybookVersion.spec_jsonb,
                hash: opsPlaybookVersion.hash,
                created_by: opsPlaybookVersion.created_by,
                created_at: opsPlaybookVersion.created_at
            })
            .from(opsPlaybookVersion)
            .innerJoin(opsPlaybook, eq(opsPlaybookVersion.playbook_id, opsPlaybook.id))
            .where(
                and(
                    eq(opsPlaybook.company_id, companyId),
                    eq(opsPlaybook.code, playbookCode)
                )
            )
            .orderBy(desc(opsPlaybookVersion.version));

        return versions.map(v => ({
            id: v.id,
            playbook_id: v.playbook_id,
            version: v.version,
            spec_jsonb: v.spec_jsonb as any,
            hash: v.hash || '',
            created_by: v.created_by,
            created_at: v.created_at.toISOString()
        }));
    }

    /**
     * Validate playbook spec structure and references
     */
    async validateSpec(spec: any): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        if (!spec.steps || !Array.isArray(spec.steps) || spec.steps.length === 0) {
            errors.push("Playbook must have at least one step");
        }

        if (spec.steps) {
            for (let i = 0; i < spec.steps.length; i++) {
                const step = spec.steps[i];
                if (!step.id || !step.action) {
                    errors.push(`Step ${i + 1} must have id and action`);
                }
                if (!step.input) {
                    errors.push(`Step ${i + 1} must have input`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    private computeSpecHash(spec: any): string {
        // Simple hash computation - in production, use crypto.createHash
        return Buffer.from(JSON.stringify(spec)).toString('base64').slice(0, 16);
    }

    private mapPlaybookToResponse(playbook: any): PlaybookResponseM27_2 {
        return {
            id: playbook.id,
            company_id: playbook.company_id,
            code: playbook.code,
            name: playbook.name,
            status: playbook.status,
            latest_version: playbook.latest_version,
            created_by: playbook.created_by,
            updated_by: playbook.updated_by,
            created_at: playbook.created_at.toISOString(),
            updated_at: playbook.updated_at.toISOString(),
            spec: { steps: [] } // Default empty spec
        };
    }
}
