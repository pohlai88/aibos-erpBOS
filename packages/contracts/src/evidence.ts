import { z } from "zod";

// --- M26.4: Evidence Vault & eBinder Contracts ---

// Evidence Manifest Management
export const EvidenceManifestUpsert = z.object({
    control_id: z.string().min(1),
    run_id: z.string().optional(),
    task_id: z.string().optional(),
    bundle_name: z.string().min(1),
    bundle_type: z.enum(["CONTROL", "CLOSE_RUN", "TASK", "CUSTOM"]),
    evidence_items: z.array(z.object({
        item_name: z.string().min(1),
        item_type: z.enum(["DOCUMENT", "SCREENSHOT", "EXPORT", "CALCULATION", "ATTESTATION", "EMAIL", "SYSTEM_LOG"]),
        content: z.string().min(1), // Base64 encoded content
        mime_type: z.string().optional(),
        metadata: z.record(z.any()).optional()
    })).min(1)
});

export const EvidenceManifestQuery = z.object({
    control_id: z.string().optional(),
    run_id: z.string().optional(),
    task_id: z.string().optional(),
    bundle_type: z.enum(["CONTROL", "CLOSE_RUN", "TASK", "CUSTOM"]).optional(),
    status: z.enum(["ACTIVE", "ARCHIVED", "REDACTED"]).optional(),
    created_from: z.string().optional(), // ISO 8601
    created_to: z.string().optional(), // ISO 8601
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Evidence Item Management
export const EvidenceItemAdd = z.object({
    manifest_id: z.string().min(1),
    item_name: z.string().min(1),
    item_type: z.enum(["DOCUMENT", "SCREENSHOT", "EXPORT", "CALCULATION", "ATTESTATION", "EMAIL", "SYSTEM_LOG"]),
    content: z.string().min(1), // Base64 encoded content
    mime_type: z.string().optional(),
    metadata: z.record(z.any()).optional()
});

export const EvidenceItemQuery = z.object({
    manifest_id: z.string().optional(),
    item_type: z.enum(["DOCUMENT", "SCREENSHOT", "EXPORT", "CALCULATION", "ATTESTATION", "EMAIL", "SYSTEM_LOG"]).optional(),
    redacted: z.boolean().optional(),
    created_from: z.string().optional(), // ISO 8601
    created_to: z.string().optional(), // ISO 8601
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// eBinder Management
export const EbinderGenerate = z.object({
    run_id: z.string().optional(),
    binder_name: z.string().min(1),
    binder_type: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"]),
    period_start: z.string(), // ISO 8601 date
    period_end: z.string(), // ISO 8601 date
    manifest_ids: z.array(z.string()).optional(), // If not provided, auto-discover
    include_redacted: z.boolean().default(false),
    redaction_rules: z.object({
        redact_sensitive_data: z.boolean().default(true),
        redact_personal_info: z.boolean().default(true),
        redact_financial_details: z.boolean().default(false)
    }).optional()
});

export const EbinderQuery = z.object({
    run_id: z.string().optional(),
    binder_type: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"]).optional(),
    period_from: z.string().optional(), // ISO 8601 date
    period_to: z.string().optional(), // ISO 8601 date
    status: z.enum(["GENERATING", "GENERATED", "ARCHIVED"]).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Evidence Attestation
export const EvidenceAttestationAdd = z.object({
    manifest_id: z.string().min(1),
    attestor_name: z.string().min(1),
    attestor_role: z.enum(["CONTROLLER", "MANAGER", "AUDITOR", "CFO"]),
    attestation_type: z.enum(["REVIEW", "APPROVAL", "VERIFICATION", "CERTIFICATION"]),
    digital_signature: z.string().min(1), // Digital signature hash
    expires_at: z.string().optional() // ISO 8601
});

export const EvidenceAttestationQuery = z.object({
    manifest_id: z.string().optional(),
    attestor_role: z.enum(["CONTROLLER", "MANAGER", "AUDITOR", "CFO"]).optional(),
    attestation_type: z.enum(["REVIEW", "APPROVAL", "VERIFICATION", "CERTIFICATION"]).optional(),
    signed_from: z.string().optional(), // ISO 8601
    signed_to: z.string().optional(), // ISO 8601
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Response Types
export const EvidenceManifestResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    control_id: z.string(),
    run_id: z.string().optional(),
    task_id: z.string().optional(),
    bundle_name: z.string(),
    bundle_type: z.string(),
    manifest_hash: z.string(),
    content_hash: z.string(),
    size_bytes: z.number(),
    evidence_count: z.number(),
    created_at: z.string(),
    created_by: z.string(),
    sealed_at: z.string(),
    status: z.string()
});

export const EvidenceItemResponse = z.object({
    id: z.string(),
    manifest_id: z.string(),
    item_name: z.string(),
    item_type: z.string(),
    file_path: z.string().optional(),
    content_hash: z.string(),
    size_bytes: z.number(),
    mime_type: z.string().optional(),
    metadata: z.record(z.any()),
    redacted: z.boolean(),
    redaction_reason: z.string().optional(),
    created_at: z.string(),
    created_by: z.string()
});

export const EbinderResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    run_id: z.string().optional(),
    binder_name: z.string(),
    binder_type: z.string(),
    period_start: z.string(),
    period_end: z.string(),
    manifest_ids: z.array(z.string()),
    total_manifests: z.number(),
    total_evidence_items: z.number(),
    total_size_bytes: z.number(),
    binder_hash: z.string(),
    generated_at: z.string(),
    generated_by: z.string(),
    download_count: z.number(),
    last_downloaded_at: z.string().optional(),
    status: z.string()
});

export const EvidenceAttestationResponse = z.object({
    id: z.string(),
    manifest_id: z.string(),
    attestor_name: z.string(),
    attestor_role: z.string(),
    attestation_type: z.string(),
    digital_signature: z.string(),
    signed_at: z.string(),
    expires_at: z.string().optional(),
    created_at: z.string(),
    created_by: z.string()
});

// Type Exports
export type EvidenceManifestUpsertType = z.infer<typeof EvidenceManifestUpsert>;
export type EvidenceManifestQueryType = z.infer<typeof EvidenceManifestQuery>;
export type EvidenceItemAddType = z.infer<typeof EvidenceItemAdd>;
export type EvidenceItemQueryType = z.infer<typeof EvidenceItemQuery>;
export type EbinderGenerateType = z.infer<typeof EbinderGenerate>;
export type EbinderQueryType = z.infer<typeof EbinderQuery>;
export type EvidenceAttestationAddType = z.infer<typeof EvidenceAttestationAdd>;
export type EvidenceAttestationQueryType = z.infer<typeof EvidenceAttestationQuery>;

export type EvidenceManifestResponseType = z.infer<typeof EvidenceManifestResponse>;
export type EvidenceItemResponseType = z.infer<typeof EvidenceItemResponse>;
export type EbinderResponseType = z.infer<typeof EbinderResponse>;
export type EvidenceAttestationResponseType = z.infer<typeof EvidenceAttestationResponse>;
