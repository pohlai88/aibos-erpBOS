import { z } from "zod";

// --- AR Collections & Cash Application (M24) ------------------------------------

export const DunningPolicyUpsert = z.object({
    policy_code: z.string(),
    segment: z.string().optional(),
    from_bucket: z.enum(["CURRENT", "1-30", "31-60", "61-90", "90+"]),
    step_idx: z.number().int().min(0),
    wait_days: z.number().int().min(0),
    channel: z.enum(["EMAIL", "WEBHOOK"]),
    template_id: z.string(),
    throttle_days: z.number().int().min(1).default(3)
});

export const TemplateUpsert = z.object({
    id: z.string().optional(),
    kind: z.enum(["AR_DUNNING", "AR_REMIND", "AR_PTP"]),
    subject: z.string(),
    body: z.string()
});

export const RemitImportReq = z.object({
    source: z.enum(["CAMT054", "CSV", "EMAIL"]),
    filename: z.string().optional(),
    payload: z.string(), // raw xml/csv or parsed JSON string
});

export const CashAppRunReq = z.object({
    dry_run: z.boolean().default(true),
    min_confidence: z.number().min(0).max(1).default(0.7)
});

export const PtpCreate = z.object({
    customer_id: z.string(),
    invoice_id: z.string(),
    promised_date: z.string(),
    amount: z.number(),
    reason: z.string().optional()
});

export const PtpResolve = z.object({
    id: z.string(),
    outcome: z.enum(["kept", "broken", "cancelled"])
});

export const DisputeCreate = z.object({
    customer_id: z.string(),
    invoice_id: z.string(),
    reason_code: z.enum(["PRICING", "SERVICE", "GOODS", "ADMIN"]),
    detail: z.string().optional()
});

export const DisputeResolve = z.object({
    id: z.string(),
    status: z.enum(["resolved", "written_off"]),
    detail: z.string().optional()
});

// Response types
export const DunningRunResult = z.object({
    company_id: z.string(),
    customers_processed: z.number(),
    emails_sent: z.number(),
    webhooks_sent: z.number(),
    errors: z.number(),
    dry_run: z.boolean(),
    run_id: z.string(),
});

export const CashAppResult = z.object({
    company_id: z.string(),
    receipts_processed: z.number(),
    auto_matched: z.number(),
    partial_matches: z.number(),
    unmatched: z.number(),
    confidence_threshold: z.number(),
    dry_run: z.boolean(),
    run_id: z.string(),
});

export const ArAgingBucket = z.object({
    bucket: z.enum(["CURRENT", "1-30", "31-60", "61-90", "90+"]),
    amount: z.number(),
    invoice_count: z.number(),
    oldest_days: z.number(),
});

export const ArAgingReport = z.object({
    company_id: z.string(),
    customer_id: z.string(),
    customer_name: z.string(),
    total_due: z.number(),
    buckets: z.array(ArAgingBucket),
    as_of_date: z.string(),
});

export const CashAppMatch = z.object({
    id: z.string(),
    receipt_date: z.string(),
    amount: z.number(),
    ccy: z.string(),
    customer_id: z.string().optional(),
    reference: z.string().optional(),
    confidence: z.number(),
    status: z.enum(["matched", "partial", "unmatched", "rejected"]),
    links: z.array(z.object({
        invoice_id: z.string(),
        link_amount: z.number(),
    })).optional(),
});

export const PtpRecord = z.object({
    id: z.string(),
    customer_id: z.string(),
    invoice_id: z.string(),
    promised_date: z.string(),
    amount: z.number(),
    reason: z.string().optional(),
    status: z.enum(["open", "kept", "broken", "cancelled"]),
    created_at: z.string(),
    decided_at: z.string().optional(),
});

export const DisputeRecord = z.object({
    id: z.string(),
    customer_id: z.string(),
    invoice_id: z.string(),
    reason_code: z.enum(["PRICING", "SERVICE", "GOODS", "ADMIN"]),
    detail: z.string().optional(),
    status: z.enum(["open", "resolved", "written_off"]),
    created_at: z.string(),
    resolved_at: z.string().optional(),
});

export const CfReceiptSignal = z.object({
    id: z.string(),
    week_start: z.string(),
    ccy: z.string(),
    amount: z.number(),
    source: z.enum(["AUTO_MATCH", "PTP", "MANUAL"]),
    ref_id: z.string().optional(),
    created_at: z.string(),
});

// Type exports
export type PtpCreateType = z.infer<typeof PtpCreate>;
export type PtpResolveType = z.infer<typeof PtpResolve>;
export type DisputeCreateType = z.infer<typeof DisputeCreate>;
export type DisputeResolveType = z.infer<typeof DisputeResolve>;
export type PtpRecordType = z.infer<typeof PtpRecord>;
export type DisputeRecordType = z.infer<typeof DisputeRecord>;
export type RemitImportReqType = z.infer<typeof RemitImportReq>;
export type CashAppRunReqType = z.infer<typeof CashAppRunReq>;
export type CashAppResultType = z.infer<typeof CashAppResult>;
export type CashAppMatchType = z.infer<typeof CashAppMatch>;
export type DunningPolicyUpsertType = z.infer<typeof DunningPolicyUpsert>;
export type TemplateUpsertType = z.infer<typeof TemplateUpsert>;
export type DunningRunResultType = z.infer<typeof DunningRunResult>;