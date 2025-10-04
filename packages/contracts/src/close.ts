import { z } from "zod";

// --- M26: Close Orchestrator & Narrative Reporting Contracts ---

// Close Policy Management
export const ClosePolicyUpsert = z.object({
    materiality_abs: z.number().positive().default(10000),
    materiality_pct: z.number().min(0).max(1).default(0.02),
    sla_default_hours: z.number().int().positive().default(72),
    reminder_cadence_mins: z.number().int().positive().default(60),
    tz: z.string().default("UTC")
});

// Close Run Management
export const CloseRunCreate = z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    owner: z.string().min(1),
    notes: z.string().optional()
});

export const CloseRunQuery = z.object({
    year: z.number().int().optional(),
    month: z.number().int().optional(),
    status: z.enum(["DRAFT", "IN_PROGRESS", "REVIEW", "APPROVED", "PUBLISHED", "ABORTED"]).optional(),
    owner: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Close Task Management
export const CloseTaskUpsert = z.object({
    code: z.string().min(1),
    title: z.string().min(1),
    owner: z.string().min(1),
    sla_due_at: z.string().optional(), // ISO 8601
    priority: z.number().int().min(0).max(10).default(0),
    tags: z.array(z.string()).default([]),
    evidence_required: z.boolean().default(false),
    approver: z.string().optional()
});

export const CloseTaskAction = z.object({
    action: z.enum(["start", "block", "ready", "done", "reject"]),
    notes: z.string().optional()
});

export const CloseTaskQuery = z.object({
    run_id: z.string().optional(),
    status: z.enum(["OPEN", "BLOCKED", "READY", "DONE", "REJECTED"]).optional(),
    owner: z.string().optional(),
    sla_breach: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Close Evidence Management
export const CloseEvidenceAdd = z.object({
    task_id: z.string(),
    kind: z.enum(["LINK", "FILE", "NOTE"]),
    uri_or_note: z.string().min(1)
});

export const CloseEvidenceQuery = z.object({
    run_id: z.string().optional(),
    task_id: z.string().optional(),
    kind: z.enum(["LINK", "FILE", "NOTE"]).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Close Lock Management
export const CloseLockRequest = z.object({
    entity_id: z.string().min(1),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12)
});

// Flux Analysis
export const FluxRunReq = z.object({
    base: z.object({
        y: z.number().int().min(2000).max(2100),
        m: z.number().int().min(1).max(12)
    }),
    cmp: z.object({
        y: z.number().int().min(2000).max(2100),
        m: z.number().int().min(1).max(12)
    }),
    present: z.string().length(3).optional(),
    scope: z.enum(["PL", "BS", "CF"]).default("PL"),
    dim: z.enum(["ACCOUNT", "COST_CENTER", "PROJECT", "NONE"]).default("ACCOUNT")
});

export const FluxCommentReq = z.object({
    line_id: z.string(),
    body: z.string().min(1)
});

export const FluxQuery = z.object({
    run_id: z.string().optional(),
    company_id: z.string().optional(),
    base_year: z.number().int().optional(),
    base_month: z.number().int().optional(),
    cmp_year: z.number().int().optional(),
    cmp_month: z.number().int().optional(),
    material_only: z.boolean().default(false),
    requires_comment: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Flux Rule Management
export const FluxRuleUpsert = z.object({
    scope: z.enum(["PL", "BS", "CF"]),
    dim: z.enum(["ACCOUNT", "COST_CENTER", "PROJECT", "NONE"]),
    threshold_abs: z.number().positive().optional(),
    threshold_pct: z.number().min(0).max(1).optional(),
    require_comment: z.boolean().default(false),
    active: z.boolean().default(true)
});

export const FluxRuleQuery = z.object({
    scope: z.enum(["PL", "BS", "CF"]).optional(),
    dim: z.enum(["ACCOUNT", "COST_CENTER", "PROJECT", "NONE"]).optional(),
    active: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// MD&A Template Management
export const MdnaTemplateUpsert = z.object({
    name: z.string().min(1),
    sections: z.record(z.any()).default({}),
    variables: z.record(z.any()).default({})
});

export const MdnaTemplateQuery = z.object({
    status: z.enum(["DRAFT", "APPROVED"]).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// MD&A Draft Management
export const MdnaDraftUpsert = z.object({
    template_id: z.string(),
    run_id: z.string().optional(),
    content: z.record(z.any()).default({}),
    variables: z.record(z.any()).default({})
});

export const MdnaDraftQuery = z.object({
    template_id: z.string().optional(),
    run_id: z.string().optional(),
    status: z.enum(["EDITING", "REVIEW", "APPROVED"]).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// MD&A Publishing
export const MdnaPublishReq = z.object({
    run_id: z.string().optional(),
    template_id: z.string().optional(),
    draft_id: z.string().optional()
});

export const MdnaPublishQuery = z.object({
    run_id: z.string().optional(),
    draft_id: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// KPI Management
export const KpiQuery = z.object({
    run_id: z.string().optional(),
    metric: z.enum(["DAYS_TO_CLOSE", "ON_TIME_RATE", "AVG_TASK_AGE", "LATE_TASKS"]).optional(),
    computed_at_from: z.string().optional(), // ISO 8601
    computed_at_to: z.string().optional(), // ISO 8601
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Response Types
export const CloseRunResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    year: z.number(),
    month: z.number(),
    status: z.string(),
    started_at: z.string().optional(),
    closed_at: z.string().optional(),
    owner: z.string(),
    notes: z.string().optional(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const CloseTaskResponse = z.object({
    id: z.string(),
    run_id: z.string(),
    code: z.string(),
    title: z.string(),
    owner: z.string(),
    sla_due_at: z.string().optional(),
    status: z.string(),
    priority: z.number(),
    tags: z.array(z.string()),
    evidence_required: z.boolean(),
    approver: z.string().optional(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const CloseEvidenceResponse = z.object({
    id: z.string(),
    run_id: z.string(),
    task_id: z.string(),
    kind: z.string(),
    uri_or_note: z.string(),
    added_by: z.string(),
    added_at: z.string()
});

export const ClosePolicyResponse = z.object({
    company_id: z.string(),
    materiality_abs: z.number(),
    materiality_pct: z.number(),
    sla_default_hours: z.number(),
    reminder_cadence_mins: z.number(),
    tz: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const CloseLockResponse = z.object({
    company_id: z.string(),
    entity_id: z.string(),
    year: z.number(),
    month: z.number(),
    locked_by: z.string(),
    locked_at: z.string()
});

export const FluxRunResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    run_id: z.string().optional(),
    base_year: z.number(),
    base_month: z.number(),
    cmp_year: z.number(),
    cmp_month: z.number(),
    present_ccy: z.string(),
    status: z.string(),
    created_at: z.string(),
    created_by: z.string()
});

export const FluxLineResponse = z.object({
    id: z.string(),
    run_id: z.string(),
    account_code: z.string(),
    dim_key: z.string().optional(),
    base_amount: z.number(),
    cmp_amount: z.number(),
    delta: z.number(),
    delta_pct: z.number(),
    requires_comment: z.boolean(),
    material: z.boolean(),
    created_at: z.string()
});

export const FluxCommentResponse = z.object({
    id: z.string(),
    run_id: z.string(),
    line_id: z.string(),
    author: z.string(),
    body: z.string(),
    created_at: z.string()
});

export const FluxRuleResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    scope: z.string(),
    dim: z.string(),
    threshold_abs: z.number().optional(),
    threshold_pct: z.number().optional(),
    require_comment: z.boolean(),
    active: z.boolean(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const MdnaTemplateResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    name: z.string(),
    sections: z.any(),
    variables: z.any(),
    status: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const MdnaDraftResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    run_id: z.string().optional(),
    template_id: z.string(),
    content: z.any(),
    variables: z.any(),
    status: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const MdnaPublishResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    run_id: z.string().optional(),
    draft_id: z.string(),
    html_uri: z.string(),
    checksum: z.string(),
    published_at: z.string(),
    published_by: z.string()
});

export const KpiResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    run_id: z.string().optional(),
    metric: z.string(),
    value: z.number(),
    computed_at: z.string(),
    created_at: z.string()
});

// Type exports
export type ClosePolicyUpsertType = z.infer<typeof ClosePolicyUpsert>;
export type CloseRunCreateType = z.infer<typeof CloseRunCreate>;
export type CloseRunQueryType = z.infer<typeof CloseRunQuery>;
export type CloseTaskUpsertType = z.infer<typeof CloseTaskUpsert>;
export type CloseTaskActionType = z.infer<typeof CloseTaskAction>;
export type CloseTaskQueryType = z.infer<typeof CloseTaskQuery>;
export type CloseEvidenceAddType = z.infer<typeof CloseEvidenceAdd>;
export type CloseEvidenceQueryType = z.infer<typeof CloseEvidenceQuery>;
export type CloseLockRequestType = z.infer<typeof CloseLockRequest>;
export type FluxRunReqType = z.infer<typeof FluxRunReq>;
export type FluxCommentReqType = z.infer<typeof FluxCommentReq>;
export type FluxQueryType = z.infer<typeof FluxQuery>;
export type FluxRuleUpsertType = z.infer<typeof FluxRuleUpsert>;
export type FluxRuleQueryType = z.infer<typeof FluxRuleQuery>;
export type MdnaTemplateUpsertType = z.infer<typeof MdnaTemplateUpsert>;
export type MdnaTemplateQueryType = z.infer<typeof MdnaTemplateQuery>;
export type MdnaDraftUpsertType = z.infer<typeof MdnaDraftUpsert>;
export type MdnaDraftQueryType = z.infer<typeof MdnaDraftQuery>;
export type MdnaPublishReqType = z.infer<typeof MdnaPublishReq>;
export type MdnaPublishQueryType = z.infer<typeof MdnaPublishQuery>;
export type KpiQueryType = z.infer<typeof KpiQuery>;

export type CloseRunResponseType = z.infer<typeof CloseRunResponse>;
export type CloseTaskResponseType = z.infer<typeof CloseTaskResponse>;
export type CloseEvidenceResponseType = z.infer<typeof CloseEvidenceResponse>;
export type ClosePolicyResponseType = z.infer<typeof ClosePolicyResponse>;
export type CloseLockResponseType = z.infer<typeof CloseLockResponse>;
export type FluxRunResponseType = z.infer<typeof FluxRunResponse>;
export type FluxLineResponseType = z.infer<typeof FluxLineResponse>;
export type FluxCommentResponseType = z.infer<typeof FluxCommentResponse>;
export type FluxRuleResponseType = z.infer<typeof FluxRuleResponse>;
export type MdnaTemplateResponseType = z.infer<typeof MdnaTemplateResponse>;
export type MdnaDraftResponseType = z.infer<typeof MdnaDraftResponse>;
export type MdnaPublishResponseType = z.infer<typeof MdnaPublishResponse>;
export type KpiResponseType = z.infer<typeof KpiResponse>;
