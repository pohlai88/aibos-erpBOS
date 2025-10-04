import { z } from "zod";

// --- M26.9: ITGC & UAR Bridge Contracts ---

// Enums
export const ItSystemKindSchema = z.enum(["ERP", "DB", "CLOUD", "BI", "APP"]);
export const ItConnectorSchema = z.enum(["SCIM", "SAML", "OIDC", "SQL", "CSV", "API"]);
export const ItUserStatusSchema = z.enum(["ACTIVE", "DISABLED", "LOCKED", "TERMINATED"]);
export const ItEntitlementKindSchema = z.enum(["ROLE", "GROUP", "PRIV", "SCHEMA", "TABLE", "ACTION"]);
export const ItGrantSourceSchema = z.enum(["HR", "JOINER", "TICKET", "EMERGENCY", "MANUAL"]);
export const ItSodSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const ItSodViolationStatusSchema = z.enum(["OPEN", "WAIVED", "RESOLVED"]);
export const UarCampaignStatusSchema = z.enum(["DRAFT", "OPEN", "ESCALATED", "CLOSED"]);
export const UarItemStateSchema = z.enum(["PENDING", "CERTIFIED", "REVOKE", "EXCEPTION"]);
export const ItSnapshotScopeSchema = z.enum(["USERS", "ROLES", "GRANTS", "SOD", "BREAKGLASS"]);

// Systems & Connectors
export const SystemUpsert = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    kind: ItSystemKindSchema,
    owner_user_id: z.string().uuid(),
    is_active: z.boolean().default(true)
});

export const ConnectorUpsert = z.object({
    system_id: z.string().uuid(),
    connector: ItConnectorSchema,
    settings: z.record(z.any()),
    secret_ref: z.string().uuid().optional(),
    schedule_cron: z.string().optional(),
    is_enabled: z.boolean().default(true)
});

export const IngestRunReq = z.object({
    system_id: z.string().uuid().optional(), // If not provided, run all enabled connectors
    force: z.boolean().default(false)
});

// SoD Policies
export const SoDRuleUpsert = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    severity: ItSodSeveritySchema,
    logic: z.object({
        type: z.enum(["allOf", "anyOf"]),
        entitlements: z.array(z.string()).optional(),
        roles: z.array(z.string()).optional()
    }),
    active: z.boolean().default(true)
});

export const SoDQuery = z.object({
    company_id: z.string().optional(),
    system_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    status: ItSodViolationStatusSchema.optional(),
    severity: ItSodSeveritySchema.optional(),
    paging: z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0)
    }).default({ limit: 50, offset: 0 })
});

export const ViolationAction = z.object({
    violation_id: z.string().uuid(),
    action: z.enum(["waive", "resolve"]),
    note: z.string().min(1)
});

// UAR Campaigns
export const CampaignUpsert = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    period_start: z.string().date(),
    period_end: z.string().date(),
    due_at: z.string().datetime()
});

export const CampaignOpen = z.object({
    campaign_id: z.string().uuid(),
    include_systems: z.array(z.string().uuid()).optional(),
    exclude_systems: z.array(z.string().uuid()).optional()
});

export const CampaignDecideItem = z.object({
    campaign_id: z.string().uuid(),
    items: z.array(z.object({
        user_id: z.string().uuid(),
        system_id: z.string().uuid(),
        decision: UarItemStateSchema,
        exception_note: z.string().optional()
    }))
});

export const CampaignClose = z.object({
    campaign_id: z.string().uuid(),
    build_evidence_pack: z.boolean().default(true)
});

// Break-glass
export const BreakglassOpen = z.object({
    system_id: z.string().uuid(),
    user_id: z.string().uuid(),
    expires_at: z.string().datetime(),
    ticket: z.string().min(1),
    reason: z.string().min(1)
});

export const BreakglassClose = z.object({
    breakglass_id: z.string().uuid(),
    reason: z.string().min(1)
});

// Evidence
export const SnapshotReq = z.object({
    scope: ItSnapshotScopeSchema,
    systems: z.array(z.string().uuid()).optional()
});

export const PackBuildReq = z.object({
    campaign_id: z.string().uuid()
});

// Queries
export const EntitlementQuery = z.object({
    company_id: z.string().optional(),
    system_id: z.string().uuid().optional(),
    kind: ItEntitlementKindSchema.optional(),
    search: z.string().optional(),
    paging: z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0)
    }).default({ limit: 50, offset: 0 })
});

export const ItGrantQuery = z.object({
    company_id: z.string().optional(),
    system_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    entitlement_id: z.string().uuid().optional(),
    source: ItGrantSourceSchema.optional(),
    expires_soon: z.boolean().optional(), // Within 30 days
    expired: z.boolean().optional(),
    paging: z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0)
    }).default({ limit: 50, offset: 0 })
});

export const UserQuery = z.object({
    company_id: z.string().optional(),
    system_id: z.string().uuid().optional(),
    status: ItUserStatusSchema.optional(),
    search: z.string().optional(),
    has_expired_grants: z.boolean().optional(),
    paging: z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0)
    }).default({ limit: 50, offset: 0 })
});

// Response Types
export const SystemResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    code: z.string(),
    name: z.string(),
    kind: ItSystemKindSchema,
    owner_user_id: z.string(),
    is_active: z.boolean(),
    created_at: z.string().datetime(),
    connector_count: z.number().int().optional()
});

export const ConnectorResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    system_id: z.string().uuid(),
    connector: ItConnectorSchema,
    settings: z.record(z.any()),
    secret_ref: z.string().uuid().optional(),
    schedule_cron: z.string().optional(),
    is_enabled: z.boolean(),
    created_at: z.string().datetime(),
    last_run_at: z.string().datetime().optional(),
    last_run_status: z.string().optional()
});

export const UserResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    system_id: z.string().uuid(),
    ext_id: z.string(),
    email: z.string().optional(),
    display_name: z.string().optional(),
    status: ItUserStatusSchema,
    first_seen: z.string().datetime(),
    last_seen: z.string().datetime(),
    grant_count: z.number().int().optional()
});

export const EntitlementResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    system_id: z.string().uuid(),
    kind: ItEntitlementKindSchema,
    code: z.string(),
    name: z.string().optional(),
    grant_count: z.number().int().optional()
});

export const ItGrantResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    system_id: z.string().uuid(),
    user_id: z.string().uuid(),
    entitlement_id: z.string().uuid(),
    granted_at: z.string().datetime(),
    expires_at: z.string().datetime().optional(),
    source: ItGrantSourceSchema,
    reason: z.string().optional(),
    created_at: z.string().datetime(),
    user: UserResponse.optional(),
    entitlement: EntitlementResponse.optional()
});

export const SoDRuleResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    code: z.string(),
    name: z.string(),
    severity: ItSodSeveritySchema,
    logic: z.record(z.any()),
    active: z.boolean(),
    created_at: z.string().datetime(),
    violation_count: z.number().int().optional()
});

export const SoDViolationResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    rule_id: z.string().uuid(),
    system_id: z.string().uuid(),
    user_id: z.string().uuid(),
    detected_at: z.string().datetime(),
    status: ItSodViolationStatusSchema,
    note: z.string().optional(),
    explanation: z.record(z.any()).optional(),
    rule: SoDRuleResponse.optional(),
    user: UserResponse.optional(),
    system: SystemResponse.optional()
});

export const UarCampaignResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    code: z.string(),
    name: z.string(),
    period_start: z.string().date(),
    period_end: z.string().date(),
    due_at: z.string().datetime(),
    status: UarCampaignStatusSchema,
    created_by: z.string(),
    created_at: z.string().datetime(),
    item_count: z.number().int().optional(),
    completed_count: z.number().int().optional(),
    overdue_count: z.number().int().optional()
});

export const UarItemResponse = z.object({
    id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    company_id: z.string(),
    system_id: z.string().uuid(),
    user_id: z.string().uuid(),
    owner_user_id: z.string(),
    snapshot: z.record(z.any()),
    state: UarItemStateSchema,
    decided_by: z.string().optional(),
    decided_at: z.string().datetime().optional(),
    exception_note: z.string().optional(),
    created_at: z.string().datetime(),
    user: UserResponse.optional(),
    system: SystemResponse.optional()
});

export const BreakglassResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    system_id: z.string().uuid(),
    user_id: z.string().uuid(),
    opened_at: z.string().datetime(),
    expires_at: z.string().datetime(),
    ticket: z.string(),
    reason: z.string(),
    closed_at: z.string().datetime().optional(),
    closed_by: z.string().optional(),
    user: UserResponse.optional(),
    system: SystemResponse.optional()
});

export const SnapshotResponse = z.object({
    id: z.string().uuid(),
    company_id: z.string(),
    taken_at: z.string().datetime(),
    scope: ItSnapshotScopeSchema,
    sha256: z.string(),
    evd_record_id: z.string().uuid().optional(),
    record_count: z.number().int().optional()
});

export const UarPackResponse = z.object({
    id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    sha256: z.string(),
    evd_record_id: z.string().uuid(),
    created_at: z.string().datetime(),
    campaign: UarCampaignResponse.optional()
});

// Type exports
export type SystemUpsertType = z.infer<typeof SystemUpsert>;
export type ConnectorUpsertType = z.infer<typeof ConnectorUpsert>;
export type IngestRunReqType = z.infer<typeof IngestRunReq>;
export type SoDRuleUpsertType = z.infer<typeof SoDRuleUpsert>;
export type SoDQueryType = z.infer<typeof SoDQuery>;
export type ViolationActionType = z.infer<typeof ViolationAction>;
export type CampaignUpsertType = z.infer<typeof CampaignUpsert>;
export type CampaignOpenType = z.infer<typeof CampaignOpen>;
export type CampaignDecideItemType = z.infer<typeof CampaignDecideItem>;
export type CampaignCloseType = z.infer<typeof CampaignClose>;
export type BreakglassOpenType = z.infer<typeof BreakglassOpen>;
export type BreakglassCloseType = z.infer<typeof BreakglassClose>;
export type SnapshotReqType = z.infer<typeof SnapshotReq>;
export type PackBuildReqType = z.infer<typeof PackBuildReq>;
export type EntitlementQueryType = z.infer<typeof EntitlementQuery>;
export type ItGrantQueryType = z.infer<typeof ItGrantQuery>;
export type UserQueryType = z.infer<typeof UserQuery>;

export type SystemResponseType = z.infer<typeof SystemResponse>;
export type ConnectorResponseType = z.infer<typeof ConnectorResponse>;
export type UserResponseType = z.infer<typeof UserResponse>;
export type EntitlementResponseType = z.infer<typeof EntitlementResponse>;
export type ItGrantResponseType = z.infer<typeof ItGrantResponse>;
export type SoDRuleResponseType = z.infer<typeof SoDRuleResponse>;
export type SoDViolationResponseType = z.infer<typeof SoDViolationResponse>;
export type UarCampaignResponseType = z.infer<typeof UarCampaignResponse>;
export type UarItemResponseType = z.infer<typeof UarItemResponse>;
export type BreakglassResponseType = z.infer<typeof BreakglassResponse>;
export type SnapshotResponseType = z.infer<typeof SnapshotResponse>;
export type UarPackResponseType = z.infer<typeof UarPackResponse>;
