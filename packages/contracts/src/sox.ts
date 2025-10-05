import { z } from "zod";

// --- M26.5: SOX 302/404 Pack Contracts ---

// Key Control Management
export const KeyControlUpsert = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    process: z.enum(["R2R", "O2C", "P2P", "ITGC", "OTHER"]),
    risk_stmt: z.string().min(1),
    assertion: z.enum(["E/O", "C/O", "V/A", "P/D", "OTHER"]),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ADHOC"]),
    automation: z.enum(["MANUAL", "IT_DEP", "AUTOMATED"]),
    owner_id: z.string().min(1),
    active: z.boolean().default(true)
});

export const ControlScopeUpsert = z.object({
    control_id: z.string().uuid(),
    period: z.string().min(1), // YYYYQn or YYYY-MM
    in_scope: z.boolean().default(true),
    materiality: z.number().positive().optional()
});

// Test Planning & Execution
export const TestPlanUpsert = z.object({
    control_id: z.string().uuid(),
    period: z.string().min(1), // YYYYQn
    attributes: z.array(z.string()).min(1),
    sample_method: z.enum(["RANDOM", "JUDGMENTAL", "ALL"]),
    sample_size: z.number().int().positive()
});

export const TestPlanApprove = z.object({
    plan_id: z.string().uuid()
});

export const SampleUpsert = z.object({
    plan_id: z.string().uuid(),
    ref: z.string().min(1),
    picked_reason: z.string().optional()
});

export const TestResultUpsert = z.object({
    plan_id: z.string().uuid(),
    sample_id: z.string().uuid().optional(),
    attribute: z.string().min(1),
    outcome: z.enum(["PASS", "FAIL", "N/A"]),
    note: z.string().optional(),
    evd_record_id: z.string().uuid().optional()
});

// Deficiency Management
export const DeficiencyUpsert = z.object({
    control_id: z.string().uuid().optional(),
    discovered_in: z.string().min(1), // YYYYQn
    type: z.enum(["DESIGN", "OPERATING"]),
    severity: z.enum(["INCONSEQUENTIAL", "SIGNIFICANT", "MATERIAL"]),
    description: z.string().min(1),
    root_cause: z.string().optional(),
    aggregation_id: z.string().uuid().optional(),
    rem_owner_id: z.string().optional(),
    remediation_plan: z.string().optional(),
    remediation_due: z.string().optional() // ISO date string
});

export const DeficiencyUpdate = z.object({
    deficiency_id: z.string().uuid(),
    status: z.enum(["OPEN", "IN_PROGRESS", "VALIDATING", "CLOSED"]).optional(),
    severity: z.enum(["INCONSEQUENTIAL", "SIGNIFICANT", "MATERIAL"]).optional(),
    description: z.string().min(1).optional(),
    root_cause: z.string().optional(),
    rem_owner_id: z.string().optional(),
    remediation_plan: z.string().optional(),
    remediation_due: z.string().optional()
});

export const DeficiencyLinkUpsert = z.object({
    deficiency_id: z.string().uuid(),
    source: z.enum(["TEST_RESULT", "INCIDENT", "AUDIT"]),
    source_id: z.string().min(1)
});

// Management Assertions
export const AssertionCreate = z.object({
    period: z.string().min(1), // YYYYQn or YYYY
    type: z.enum(["302", "404"]),
    statement: z.object({
        scope: z.string().min(1),
        exceptions: z.array(z.string()).default([]),
        certifications: z.array(z.string()).default([]),
        disclosures: z.array(z.string()).default([])
    }),
    ebinder_id: z.string().uuid().optional(),
    signed_role: z.enum(["CEO", "CFO", "CONTROLLER", "OTHER"])
});

// Query Parameters
export const SOXQueryParams = z.object({
    company_id: z.string().optional(),
    period: z.string().optional(),
    process: z.enum(["R2R", "O2C", "P2P", "ITGC", "OTHER"]).optional(),
    status: z.string().optional(),
    severity: z.enum(["INCONSEQUENTIAL", "SIGNIFICANT", "MATERIAL"]).optional(),
    type: z.enum(["302", "404"]).optional(),
    limit: z.number().int().positive().max(1000).default(100),
    offset: z.number().int().nonnegative().default(0)
});

// Response Types
export const KeyControlResponse = z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    process: z.string(),
    risk_stmt: z.string(),
    assertion: z.string(),
    frequency: z.string(),
    automation: z.string(),
    owner_id: z.string(),
    active: z.boolean(),
    created_at: z.string()
});

export const ControlScopeResponse = z.object({
    id: z.string().uuid(),
    control_id: z.string().uuid(),
    period: z.string(),
    in_scope: z.boolean(),
    materiality: z.number().nullable(),
    updated_at: z.string()
});

export const TestPlanResponse = z.object({
    id: z.string().uuid(),
    control_id: z.string().uuid(),
    period: z.string(),
    attributes: z.array(z.string()),
    sample_method: z.string(),
    sample_size: z.number(),
    status: z.string(),
    prepared_at: z.string(),
    approved_at: z.string().nullable()
});

export const TestResultResponse = z.object({
    id: z.string().uuid(),
    plan_id: z.string().uuid(),
    sample_id: z.string().uuid().nullable(),
    attribute: z.string(),
    outcome: z.string(),
    note: z.string().nullable(),
    evd_record_id: z.string().uuid().nullable(),
    tested_at: z.string()
});

export const DeficiencyResponse = z.object({
    id: z.string().uuid(),
    control_id: z.string().uuid().nullable(),
    discovered_in: z.string(),
    type: z.string(),
    severity: z.string(),
    description: z.string(),
    root_cause: z.string().nullable(),
    status: z.string(),
    rem_owner_id: z.string().nullable(),
    remediation_due: z.string().nullable(),
    created_at: z.string()
});

export const AssertionResponse = z.object({
    id: z.string().uuid(),
    period: z.string(),
    type: z.string(),
    statement: z.object({
        scope: z.string(),
        exceptions: z.array(z.string()),
        certifications: z.array(z.string()),
        disclosures: z.array(z.string())
    }),
    ebinder_id: z.string().uuid().nullable(),
    signed_by: z.string(),
    signed_role: z.string(),
    sha256_hex: z.string(),
    signed_at: z.string()
});

// Health & Dashboard Responses
export const SOXHealthResponse = z.object({
    control_coverage: z.object({
        total_controls: z.number(),
        in_scope_controls: z.number(),
        coverage_percentage: z.number()
    }),
    test_completeness: z.object({
        planned_tests: z.number(),
        executed_tests: z.number(),
        completeness_percentage: z.number()
    }),
    pass_rate: z.object({
        total_results: z.number(),
        passed: z.number(),
        failed: z.number(),
        pass_percentage: z.number()
    }),
    deficiency_summary: z.object({
        total_deficiencies: z.number(),
        open_deficiencies: z.number(),
        significant_deficiencies: z.number(),
        material_deficiencies: z.number(),
        avg_age_days: z.number()
    }),
    assertion_status: z.object({
        q302_signed: z.number(),
        q302_pending: z.number(),
        q404_signed: z.number(),
        q404_pending: z.number()
    })
});

// Type exports
export type KeyControlUpsertType = z.infer<typeof KeyControlUpsert>;
export type ControlScopeUpsertType = z.infer<typeof ControlScopeUpsert>;
export type TestPlanUpsertType = z.infer<typeof TestPlanUpsert>;
export type TestPlanApproveType = z.infer<typeof TestPlanApprove>;
export type SampleUpsertType = z.infer<typeof SampleUpsert>;
export type TestResultUpsertType = z.infer<typeof TestResultUpsert>;
export type DeficiencyUpsertType = z.infer<typeof DeficiencyUpsert>;
export type DeficiencyUpdateType = z.infer<typeof DeficiencyUpdate>;
export type DeficiencyLinkUpsertType = z.infer<typeof DeficiencyLinkUpsert>;
export type AssertionCreateType = z.infer<typeof AssertionCreate>;
export type SOXQueryParamsType = z.infer<typeof SOXQueryParams>;
export type KeyControlResponseType = z.infer<typeof KeyControlResponse>;
export type ControlScopeResponseType = z.infer<typeof ControlScopeResponse>;
export type TestPlanResponseType = z.infer<typeof TestPlanResponse>;
export type TestResultResponseType = z.infer<typeof TestResultResponse>;
export type DeficiencyResponseType = z.infer<typeof DeficiencyResponse>;
export type AssertionResponseType = z.infer<typeof AssertionResponse>;
export type SOXHealthResponseType = z.infer<typeof SOXHealthResponse>;
