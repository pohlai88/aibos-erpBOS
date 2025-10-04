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

// --- Enhanced Evidence Vault Contracts (M26.4 Enhanced) ---

// Content-Addressed Evidence Upload
export const EvidenceUploadReq = z.object({
    source: z.enum(["CTRL", "CLOSE", "FLUX", "JOURNAL", "BANK", "OTHER"]),
    source_id: z.string().min(1),
    title: z.string().min(1),
    note: z.string().optional(),
    tags: z.array(z.string()).optional(),
    pii_level: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
    mime: z.string().min(1),
    size_bytes: z.number().int().min(0),
    sha256_hex: z.string().min(1),
    storage_hint: z.string().optional()
});

// Evidence Linking
export const EvidenceLinkReq = z.object({
    record_id: z.string().min(1),
    kind: z.enum(["CTRL_RUN", "CLOSE_RUN", "EXCEPTION", "TASK"]),
    ref_id: z.string().min(1)
});

// Redaction Rule Management
export const RedactionRuleUpsert = z.object({
    code: z.string().min(1),
    description: z.string().optional(),
    rule: z.record(z.any()), // JSONB rule definition
    enabled: z.boolean().default(true)
});

// Manifest Building
export const ManifestBuildReq = z.object({
    scope_kind: z.enum(["CTRL_RUN", "CLOSE_RUN"]),
    scope_id: z.string().min(1),
    filters: z.object({
        include_controls: z.array(z.string()).optional(),
        exclude_tags: z.array(z.string()).optional(),
        redaction_codes: z.array(z.string()).optional(),
        pii_level_max: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).optional()
    }).optional()
});

// eBinder Building
export const BinderBuildReq = z.object({
    manifest_id: z.string().min(1),
    format: z.literal("ZIP")
});

// eBinder Download
export const BinderDownloadReq = z.object({
    binder_id: z.string().min(1)
});

// Attestation
export const AttestReq = z.object({
    binder_id: z.string().min(1),
    signer_role: z.enum(["MANAGER", "CONTROLLER", "CFO", "AUDITOR"]),
    statement: z.string().min(1)
});

// Enhanced Response Types
export const EvidenceObjectResponse = z.object({
    id: z.string(),
    sha256_hex: z.string(),
    size_bytes: z.number(),
    mime: z.string(),
    storage_uri: z.string(),
    uploaded_by: z.string(),
    uploaded_at: z.string()
});

export const EvidenceRecordResponse = z.object({
    id: z.string(),
    object_id: z.string(),
    source: z.string(),
    source_id: z.string(),
    title: z.string(),
    note: z.string().optional(),
    tags: z.array(z.string()),
    pii_level: z.string(),
    created_by: z.string(),
    created_at: z.string()
});

export const RedactionRuleResponse = z.object({
    id: z.string(),
    code: z.string(),
    description: z.string().optional(),
    rule: z.record(z.any()),
    enabled: z.boolean(),
    updated_by: z.string(),
    updated_at: z.string()
});

export const ManifestResponse = z.object({
    id: z.string(),
    scope_kind: z.string(),
    scope_id: z.string(),
    filters: z.record(z.any()),
    object_count: z.number(),
    total_bytes: z.number(),
    sha256_hex: z.string(),
    created_by: z.string(),
    created_at: z.string()
});

export const BinderResponse = z.object({
    id: z.string(),
    scope_kind: z.string(),
    scope_id: z.string(),
    manifest_id: z.string(),
    format: z.string(),
    storage_uri: z.string(),
    size_bytes: z.number(),
    sha256_hex: z.string(),
    built_by: z.string(),
    built_at: z.string()
});

export const AttestationResponse = z.object({
    id: z.string(),
    binder_id: z.string(),
    signer_id: z.string(),
    signer_role: z.string(),
    payload: z.record(z.any()),
    sha256_hex: z.string(),
    signed_at: z.string()
});

// Enhanced Type Exports
export type EvidenceUploadReqType = z.infer<typeof EvidenceUploadReq>;
export type EvidenceLinkReqType = z.infer<typeof EvidenceLinkReq>;
export type RedactionRuleUpsertType = z.infer<typeof RedactionRuleUpsert>;
export type ManifestBuildReqType = z.infer<typeof ManifestBuildReq>;
export type BinderBuildReqType = z.infer<typeof BinderBuildReq>;
export type BinderDownloadReqType = z.infer<typeof BinderDownloadReq>;
export type AttestReqType = z.infer<typeof AttestReq>;

export type EvidenceObjectResponseType = z.infer<typeof EvidenceObjectResponse>;
export type EvidenceRecordResponseType = z.infer<typeof EvidenceRecordResponse>;
export type RedactionRuleResponseType = z.infer<typeof RedactionRuleResponse>;
export type ManifestResponseType = z.infer<typeof ManifestResponse>;
export type BinderResponseType = z.infer<typeof BinderResponse>;
export type AttestationResponseType = z.infer<typeof AttestationResponse>;