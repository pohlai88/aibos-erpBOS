import { z } from 'zod';

// --- M27.2: Playbook Studio + Guarded Autonomy Contracts ---

// Enums
export const RuleKindSchema = z.enum(['alert', 'periodic', 'manual']);
export const PlaybookStatusSchema = z.enum(['draft', 'active', 'archived']);
export const RunTriggerSchema = z.enum(['cron', 'signal', 'manual', 'canary']);
export const RunStatusSchema = z.enum([
  'queued',
  'approved',
  'running',
  'rolled_back',
  'succeeded',
  'failed',
  'cancelled',
  'cooling_down',
]);
export const StepStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'rolled_back',
]);
export const RollbackStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
]);
export const CapabilitySchema = z.enum([
  // Core capabilities
  'reports:read',
  'journals:post',
  'reversal:create',
  'inventory:move',
  'payments:post',
  'periods:manage',
  'keys:manage',
  'audit:read',
  'audit:admin',
  'audit:respond',
  'audit:view',
  'itgc:view',
  'itgc:admin',
  'itgc:breakglass',
  'itgc:campaigns',
  'itgc:ingest',
  'close:board:view',
  'close:board:manage',
  'close:board:export',
  'close:run',
  'close:report',
  'close:manage',
  'flux:run',
  'flux:manage',
  'mdna:edit',
  'mdna:manage',
  'mdna:read',
  'mdna:publish',
  'budgets:manage',
  'budgets:read',
  'budgets:approve',
  'forecasts:manage',
  'forecasts:approve',
  'cash:manage',
  'capex:manage',
  'fx:manage',
  'fx:read',
  'alloc:manage',
  'alloc:read',
  'tax:manage',
  'tax:read',
  'consol:manage',
  'consol:read',
  'pay:bank_profile',
  'pay:dispatch',
  'pay:discount:policy',
  'pay:discount:run',
  'pay:discount:offer',
  'ar:dunning:policy',
  'ar:dunning:run',
  'ar:remit:import',
  'ar:cashapp:run',
  'ar:ptp',
  'ar:dispute',
  'ar:credit:policy',
  'ar:credit:run',
  'ar:credit:approve',
  'ar:credit:dispute',
  'ar:credit:writeoff',
  'ar:credit:reserve',
  'ar:credit:customer',
  'ar:collect:workbench',
  'ar:portal:policy',
  'ar:portal:ops',
  'ar:stmt:policy',
  'ar:stmt:run',
  'ar:stmt:email',
  'rb:catalog',
  'rb:contract',
  'rb:usage:ingest',
  'rb:invoice:run',
  'rb:credit',
  'rev:policy',
  'rev:allocate',
  'rev:schedule',
  'rev:recognize',
  'rev:export',
  'rev:ssp:catalog',
  'rev:ssp:bundle',
  'rev:ssp:discount',
  'controls:auto',
  'controls:cert',
  'cert:report',
  'cert:sign',
  'cert:manage',
  'insights:benchmark',
  'insights:close',
  'evidence:vault',
  'evidence:ebinder',
  'evidence:write',
  'evidence:read',
  'sox:302',
  'sox:404',
  'attest:portal',
  'attest:program',
  'attest:campaign',
  'attest:export',
  'attest:approve',
  'attest:respond',
  'attest:read',
  'attest:write',
  'audit:workspace',
  'itgc:uar',
  // Ops Command Center capabilities
  'ops:playbook:approve',
  'ops:playbook:execute',
  'ops:run:read',
  // Lease capabilities
  'lease:read',
  'lease:manage',
  'lease:post',
  'lease:disclose',
  'lease:sublease',
  'lease:slb',
  'lease:lessor_post',
  'lease:exit:prepare',
  'lease:exit:post',
  'lease:restoration',
  'lease:impair:test',
  'lease:impair:post',
  'lease:impair',
  'lease:component',
  'lease:onerous',
]);
export const ApprovalDecisionSchema = z.enum(['approve', 'reject']);
export const RollbackPolicySchema = z.enum([
  'inverse_action',
  'custom',
  'none',
]);
export const OutcomeCheckOpSchema = z.enum(['gt', 'lt', 'eq', 'between']);
export const PostCheckTypeSchema = z.enum([
  'bvaImproves',
  'breachesZero',
  'errCountBelow',
]);

// Rule Contracts
export const RuleUpsertM27_2 = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  kind: RuleKindSchema,
  enabled: z.boolean().default(true),
  source: z.string().optional(),
  where: z.record(z.any()).optional(),
  schedule_cron: z.string().optional(),
  priority: z.number().int().default(0),
});

export const RuleResponseM27_2 = RuleUpsertM27_2.extend({
  id: z.string(),
  company_id: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Playbook Spec - Core playbook definition
export const PlaybookSpec = z.object({
  guards: z
    .object({
      requiresDualControl: z.boolean().optional(),
      blastRadius: z
        .object({
          maxEntities: z.number().int().positive().optional(),
          maxPercent: z.number().min(0).max(100).optional(),
        })
        .optional(),
      timeoutSec: z.number().int().positive().optional(),
      cooldownSec: z.number().int().nonnegative().optional(),
      canary: z
        .object({
          samplePercent: z.number().min(1).max(100).optional(),
          minEntities: z.number().int().positive().optional(),
        })
        .optional(),
      rollbackPolicy: RollbackPolicySchema.optional(),
      postChecks: z
        .array(
          z.object({
            check: PostCheckTypeSchema,
            params: z.record(z.any()).optional(),
          })
        )
        .optional(),
    })
    .optional(),
  steps: z
    .array(
      z.object({
        id: z.string(),
        action: z.string(), // e.g. "payments.run.dispatch" | "ar.dunning.run"
        input: z.record(z.any()),
        onFailure: z.enum(['stop', 'continue', 'rollback']).optional(),
        outcomeChecks: z
          .array(
            z.object({
              metric: z.string(),
              op: OutcomeCheckOpSchema,
              value: z.union([z.any(), z.tuple([z.any(), z.any()])]),
            })
          )
          .optional(),
        rollback: z
          .object({
            action: z.string().optional(),
            input: z.any().optional(),
          })
          .optional(),
      })
    )
    .min(1),
});

// Playbook Contracts
export const PlaybookUpsertM27_2 = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  status: PlaybookStatusSchema,
  spec: PlaybookSpec,
});

export const PlaybookResponseM27_2 = PlaybookUpsertM27_2.extend({
  id: z.string(),
  company_id: z.string(),
  latest_version: z.number().int(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const PlaybookVersionResponseM27_2 = z.object({
  id: z.string(),
  playbook_id: z.string(),
  version: z.number().int(),
  spec_jsonb: PlaybookSpec,
  hash: z.string(),
  created_by: z.string(),
  created_at: z.string().datetime(),
});

// Guard Policy Contracts
export const GuardPolicyUpsert = z.object({
  scope: z.string(), // 'global' or 'playbook:<code>'
  max_concurrent: z.number().int().positive().optional(),
  blast_radius: z
    .object({
      maxEntities: z.number().int().positive().optional(),
      maxPercent: z.number().min(0).max(100).optional(),
    })
    .optional(),
  requires_dual_control: z.boolean().optional(),
  canary: z
    .object({
      samplePercent: z.number().min(1).max(100).optional(),
      minEntities: z.number().int().positive().optional(),
    })
    .optional(),
  rollback_policy: z
    .object({
      type: RollbackPolicySchema,
      timeoutSec: z.number().int().positive().optional(),
    })
    .optional(),
  timeout_sec: z.number().int().positive().optional(),
  cooldown_sec: z.number().int().nonnegative().optional(),
});

export const GuardPolicyResponse = GuardPolicyUpsert.extend({
  id: z.string(),
  company_id: z.string(),
  updated_at: z.string().datetime(),
  updated_by: z.string(),
});

// Run Contracts
export const RunRequestM27_2 = z.object({
  playbook_code: z.string(),
  version: z.number().int().optional(),
  dry_run: z.boolean().default(false),
  scope: z.record(z.any()).optional(),
});

export const RunResponseM27_2 = z.object({
  id: z.string(),
  company_id: z.string(),
  rule_id: z.string().nullable(),
  playbook_version_id: z.string(),
  trigger: RunTriggerSchema,
  status: RunStatusSchema,
  canary: z.boolean(),
  scope_jsonb: z.record(z.any()).nullable(),
  blast_radius_eval: z.record(z.any()).nullable(),
  approvals_jsonb: z.record(z.any()).nullable(),
  metrics_jsonb: z.record(z.any()).nullable(),
  started_at: z.string().datetime().nullable(),
  ended_at: z.string().datetime().nullable(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  steps: z
    .array(
      z.object({
        id: z.string(),
        idx: z.number().int(),
        action_code: z.string(),
        input_jsonb: z.record(z.any()),
        output_jsonb: z.record(z.any()).nullable(),
        status: StepStatusSchema,
        duration_ms: z.number().int().nullable(),
        rolled_back: z.boolean(),
        created_at: z.string().datetime(),
        updated_at: z.string().datetime(),
      })
    )
    .optional(),
});

// Approval Contracts
export const ApproveRunM27_2 = z.object({
  run_id: z.string(),
  decision: ApprovalDecisionSchema,
  reason: z.string().optional(),
});

export const CancelRunM27_2 = z.object({
  run_id: z.string(),
  reason: z.string().optional(),
});

// Query Contracts
export const ListRunsQueryM27_2 = z.object({
  status: RunStatusSchema.optional(),
  code: z.string().optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const ListRulesQueryM27_2 = z.object({
  enabled: z.boolean().optional(),
  kind: RuleKindSchema.optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const ListPlaybooksQueryM27_2 = z.object({
  status: PlaybookStatusSchema.optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Capability Contracts
export const CapabilityGrantM27_2 = z.object({
  playbook_code: z.string(),
  capability: CapabilitySchema,
  role: z.string(),
});

export const CapabilityResponseM27_2 = CapabilityGrantM27_2.extend({
  id: z.string(),
  company_id: z.string(),
  created_at: z.string().datetime(),
});

// Action Registry Contracts
export const ActionDescriptorM27_2 = z.object({
  code: z.string(),
  inputSchema: z.any(), // z.ZodTypeAny
  effect: z.enum(['read', 'write:journals', 'write:payments', 'write:alerts']),
  inverse: z
    .object({
      code: z.string(),
      deriveInput: z.function().optional(),
    })
    .optional(),
  defaultGuards: z
    .object({
      canaryRequired: z.boolean().optional(),
      maxEntities: z.number().int().positive().optional(),
    })
    .optional(),
  dryRunOnly: z.boolean().default(false),
});

// Observability Contracts
export const RunMetricsM27_2 = z.object({
  entities_count: z.number().int(),
  affected_amount: z.number().optional(),
  checks_pass: z.number().int(),
  checks_failed: z.number().int(),
  rollback_count: z.number().int(),
  p50_duration_ms: z.number().int(),
  p95_duration_ms: z.number().int(),
});

export const OutboxEventM27_2 = z.object({
  topic: z.string(),
  key: z.string(),
  payload_jsonb: z.record(z.any()),
  created_at: z.string().datetime(),
});

// Type exports
export type RuleKind = z.infer<typeof RuleKindSchema>;
export type PlaybookStatus = z.infer<typeof PlaybookStatusSchema>;
export type RunTrigger = z.infer<typeof RunTriggerSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type StepStatus = z.infer<typeof StepStatusSchema>;
export type RollbackStatus = z.infer<typeof RollbackStatusSchema>;
export type Capability = z.infer<typeof CapabilitySchema>;
export type ApprovalDecisionM27_2 = z.infer<typeof ApprovalDecisionSchema>;
export type RollbackPolicy = z.infer<typeof RollbackPolicySchema>;
export type OutcomeCheckOp = z.infer<typeof OutcomeCheckOpSchema>;
export type PostCheckType = z.infer<typeof PostCheckTypeSchema>;

export type RuleUpsertM27_2 = z.infer<typeof RuleUpsertM27_2>;
export type RuleResponseM27_2 = z.infer<typeof RuleResponseM27_2>;
export type PlaybookSpec = z.infer<typeof PlaybookSpec>;
export type PlaybookUpsertM27_2 = z.infer<typeof PlaybookUpsertM27_2>;
export type PlaybookResponseM27_2 = z.infer<typeof PlaybookResponseM27_2>;
export type PlaybookVersionResponseM27_2 = z.infer<
  typeof PlaybookVersionResponseM27_2
>;
export type GuardPolicyUpsert = z.infer<typeof GuardPolicyUpsert>;
export type GuardPolicyResponse = z.infer<typeof GuardPolicyResponse>;
export type RunRequestM27_2 = z.infer<typeof RunRequestM27_2>;
export type RunResponseM27_2 = z.infer<typeof RunResponseM27_2>;
export type ApproveRunM27_2 = z.infer<typeof ApproveRunM27_2>;
export type CancelRunM27_2 = z.infer<typeof CancelRunM27_2>;
export type ListRunsQueryM27_2 = z.infer<typeof ListRunsQueryM27_2>;
export type ListRulesQueryM27_2 = z.infer<typeof ListRulesQueryM27_2>;
export type ListPlaybooksQueryM27_2 = z.infer<typeof ListPlaybooksQueryM27_2>;
export type CapabilityGrantM27_2 = z.infer<typeof CapabilityGrantM27_2>;
export type CapabilityResponseM27_2 = z.infer<typeof CapabilityResponseM27_2>;
export type ActionDescriptorM27_2 = z.infer<typeof ActionDescriptorM27_2>;
export type RunMetricsM27_2 = z.infer<typeof RunMetricsM27_2>;
export type OutboxEventM27_2 = z.infer<typeof OutboxEventM27_2>;
