import { z } from "zod";

// --- M25.3: SSP Catalog, Bundles & Discounts Allocation Contracts (ASC 606) ---

// SSP Catalog Management
export const SspUpsert = z.object({
    product_id: z.string(),
    currency: z.string().length(3),
    ssp: z.number().nonnegative(),
    method: z.enum(["OBSERVABLE", "BENCHMARK", "ADJ_COST", "RESIDUAL"]),
    corridor_min_pct: z.number().min(0).max(1).optional(),
    corridor_max_pct: z.number().min(0).max(5).optional(),
    effective_from: z.string(), // YYYY-MM-DD
    effective_to: z.string().optional() // YYYY-MM-DD
});

export const SspEvidenceUpsert = z.object({
    catalog_id: z.string(),
    source: z.enum(["OBSERVABLE", "BENCHMARK", "ADJ_COST", "RESIDUAL"]),
    note: z.string().optional(),
    value: z.number().optional(),
    doc_uri: z.string().optional()
});

export const SspPolicyUpsert = z.object({
    rounding: z.enum(["HALF_UP", "BANKERS"]).default("HALF_UP"),
    residual_allowed: z.boolean().default(true),
    residual_eligible_products: z.array(z.string()).default([]),
    default_method: z.enum(["OBSERVABLE", "BENCHMARK", "ADJ_COST", "RESIDUAL"]).default("OBSERVABLE"),
    corridor_tolerance_pct: z.number().min(0).max(1).default(0.20),
    alert_threshold_pct: z.number().min(0).max(1).default(0.15)
});

export const SspChangeRequest = z.object({
    diff: z.any(),
    reason: z.string().min(3)
});

export const SspChangeDecision = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    decision_notes: z.string().optional()
});

export const SspQuery = z.object({
    product_id: z.string().optional(),
    currency: z.string().optional(),
    method: z.enum(["OBSERVABLE", "BENCHMARK", "ADJ_COST", "RESIDUAL"]).optional(),
    status: z.enum(["DRAFT", "REVIEWED", "APPROVED"]).optional(),
    effective_from: z.string().optional(),
    effective_to: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Bundle Management
export const BundleUpsert = z.object({
    bundle_sku: z.string(),
    name: z.string(),
    components: z.array(z.object({
        product_id: z.string(),
        weight_pct: z.number().min(0).max(1),
        required: z.boolean().default(true),
        min_qty: z.number().positive().default(1),
        max_qty: z.number().positive().optional()
    })),
    effective_from: z.string(), // YYYY-MM-DD
    effective_to: z.string().optional() // YYYY-MM-DD
});

export const BundleQuery = z.object({
    bundle_sku: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
    effective_from: z.string().optional(),
    effective_to: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Discount Rules Management
export const DiscountRuleUpsert = z.object({
    kind: z.enum(["PROP", "RESIDUAL", "TIERED", "PROMO", "PARTNER"]),
    code: z.string(),
    name: z.string().optional(),
    params: z.record(z.any()).default({}),
    effective_from: z.string(), // YYYY-MM-DD
    effective_to: z.string().optional(), // YYYY-MM-DD
    active: z.boolean().default(true),
    priority: z.number().int().min(0).default(0),
    max_usage_count: z.number().int().positive().optional(),
    max_usage_amount: z.number().nonnegative().optional()
});

export const DiscountRuleQuery = z.object({
    kind: z.enum(["PROP", "RESIDUAL", "TIERED", "PROMO", "PARTNER"]).optional(),
    code: z.string().optional(),
    active: z.boolean().optional(),
    effective_from: z.string().optional(),
    effective_to: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Allocation Engine
export const AllocateFromInvoiceReq = z.object({
    invoice_id: z.string(),
    strategy: z.enum(["RELATIVE_SSP", "RESIDUAL", "AUTO"]).default("AUTO")
});

export const AllocateFromInvoiceResp = z.object({
    invoice_id: z.string(),
    pobs_created: z.number(),
    total_allocated: z.number(),
    rounding_adjustment: z.number(),
    corridor_flags: z.array(z.string()),
    processing_time_ms: z.number(),
    pobs: z.array(z.object({
        id: z.string(),
        name: z.string(),
        method: z.string(),
        allocated_amount: z.number(),
        currency: z.string(),
        ssp: z.number().optional()
    }))
});

export const AllocationAuditQuery = z.object({
    invoice_id: z.string().optional(),
    run_id: z.string().optional(),
    method: z.enum(["RELATIVE_SSP", "RESIDUAL", "ADJ_COST", "AUTO"]).optional(),
    corridor_flag: z.boolean().optional(),
    created_at_from: z.string().optional(),
    created_at_to: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Prospective Reallocation
export const ProspectiveReallocationReq = z.object({
    ssp_change_id: z.string(),
    dry_run: z.boolean().default(true)
});

export const ProspectiveReallocationResp = z.object({
    ssp_change_id: z.string(),
    open_pobs_affected: z.number(),
    total_reallocation_delta: z.number(),
    schedule_revisions_created: z.number(),
    dry_run: z.boolean(),
    details: z.array(z.object({
        pob_id: z.string(),
        old_ssp: z.number(),
        new_ssp: z.number(),
        reallocation_delta: z.number(),
        schedule_revision_id: z.string().optional()
    }))
});

// Response Types
export const SspCatalogResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    product_id: z.string(),
    currency: z.string(),
    ssp: z.number(),
    method: z.string(),
    effective_from: z.string(),
    effective_to: z.string().optional(),
    corridor_min_pct: z.number().optional(),
    corridor_max_pct: z.number().optional(),
    status: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const SspEvidenceResponse = z.object({
    id: z.string(),
    catalog_id: z.string(),
    source: z.string(),
    note: z.string().optional(),
    value: z.number().optional(),
    doc_uri: z.string().optional(),
    created_at: z.string(),
    created_by: z.string()
});

export const SspPolicyResponse = z.object({
    company_id: z.string(),
    rounding: z.string(),
    residual_allowed: z.boolean(),
    residual_eligible_products: z.array(z.string()),
    default_method: z.string(),
    corridor_tolerance_pct: z.number(),
    alert_threshold_pct: z.number(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const BundleResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    bundle_sku: z.string(),
    name: z.string(),
    effective_from: z.string(),
    effective_to: z.string().optional(),
    status: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string(),
    components: z.array(z.object({
        id: z.string(),
        product_id: z.string(),
        weight_pct: z.number(),
        required: z.boolean(),
        min_qty: z.number().optional(),
        max_qty: z.number().optional()
    }))
});

export const DiscountRuleResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    kind: z.string(),
    code: z.string(),
    name: z.string().optional(),
    params: z.any(),
    active: z.boolean(),
    effective_from: z.string(),
    effective_to: z.string().optional(),
    priority: z.number(),
    max_usage_count: z.number().optional(),
    max_usage_amount: z.number().optional(),
    created_at: z.string(),
    created_by: z.string(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const AllocationAuditResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    invoice_id: z.string(),
    run_id: z.string(),
    method: z.string(),
    strategy: z.string(),
    inputs: z.any(),
    results: z.any(),
    corridor_flag: z.boolean(),
    total_invoice_amount: z.number(),
    total_allocated_amount: z.number(),
    rounding_adjustment: z.number(),
    processing_time_ms: z.number().optional(),
    created_at: z.string(),
    created_by: z.string()
});

export const SspChangeResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    requestor: z.string(),
    reason: z.string(),
    diff: z.any(),
    status: z.string(),
    decided_by: z.string().optional(),
    decided_at: z.string().optional(),
    decision_notes: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string()
});

// Type exports
export type SspUpsertType = z.infer<typeof SspUpsert>;
export type SspEvidenceUpsertType = z.infer<typeof SspEvidenceUpsert>;
export type SspPolicyUpsertType = z.infer<typeof SspPolicyUpsert>;
export type SspChangeRequestType = z.infer<typeof SspChangeRequest>;
export type SspChangeDecisionType = z.infer<typeof SspChangeDecision>;
export type SspQueryType = z.infer<typeof SspQuery>;
export type BundleUpsertType = z.infer<typeof BundleUpsert>;
export type BundleQueryType = z.infer<typeof BundleQuery>;
export type DiscountRuleUpsertType = z.infer<typeof DiscountRuleUpsert>;
export type DiscountRuleQueryType = z.infer<typeof DiscountRuleQuery>;
export type AllocateFromInvoiceReqType = z.infer<typeof AllocateFromInvoiceReq>;
export type AllocateFromInvoiceRespType = z.infer<typeof AllocateFromInvoiceResp>;
export type AllocationAuditQueryType = z.infer<typeof AllocationAuditQuery>;
export type ProspectiveReallocationReqType = z.infer<typeof ProspectiveReallocationReq>;
export type ProspectiveReallocationRespType = z.infer<typeof ProspectiveReallocationResp>;

export type SspCatalogResponseType = z.infer<typeof SspCatalogResponse>;
export type SspEvidenceResponseType = z.infer<typeof SspEvidenceResponse>;
export type SspPolicyResponseType = z.infer<typeof SspPolicyResponse>;
export type BundleResponseType = z.infer<typeof BundleResponse>;
export type DiscountRuleResponseType = z.infer<typeof DiscountRuleResponse>;
export type AllocationAuditResponseType = z.infer<typeof AllocationAuditResponse>;
export type SspChangeResponseType = z.infer<typeof SspChangeResponse>;
