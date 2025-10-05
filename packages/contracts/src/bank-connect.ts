import { z } from "zod";

// --- M23.2 Bank Connectivity Contracts ----------------------------------------

export const BankProfileUpsert = z.object({
    bank_code: z.string(),
    kind: z.enum(["SFTP", "API"]),
    config: z.record(z.any()),   // host, port, username, key_ref, out_dir, in_dir OR api_base, auth_ref
    active: z.boolean().default(true)
});

export const DispatchRequest = z.object({
    run_id: z.string(),
    bank_code: z.string(),
    dry_run: z.boolean().default(false)
});

export const FetchRequest = z.object({
    bank_code: z.string(),
    channel: z.enum(["pain002", "camt054"]).optional(), // if omitted, fetch both
    max_files: z.number().int().min(1).max(50).default(10)
});

export const ReasonNormUpsert = z.object({
    bank_code: z.string(),
    code: z.string(),
    norm_status: z.enum(["ack", "exec_ok", "exec_fail", "partial"]),
    norm_label: z.string()
});

export const BankJobLogResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    bank_code: z.string(),
    kind: z.enum(["DISPATCH", "FETCH"]),
    detail: z.string(),
    payload: z.string().optional(),
    success: z.boolean(),
    created_at: z.string()
});

export const BankOutboxResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    run_id: z.string(),
    bank_code: z.string(),
    filename: z.string(),
    status: z.enum(["queued", "sent", "error", "ignored"]),
    attempts: z.number(),
    last_error: z.string().optional(),
    created_at: z.string(),
    sent_at: z.string().optional()
});

export const BankAckMapResponse = z.object({
    id: z.string(),
    ack_id: z.string(),
    run_id: z.string().optional(),
    line_id: z.string().optional(),
    status: z.enum(["ack", "exec_ok", "exec_fail", "partial"]),
    reason_code: z.string().optional(),
    reason_label: z.string().optional()
});

// Type exports
export type BankProfileUpsertType = z.infer<typeof BankProfileUpsert>;
export type DispatchRequestType = z.infer<typeof DispatchRequest>;
export type FetchRequestType = z.infer<typeof FetchRequest>;
export type ReasonNormUpsertType = z.infer<typeof ReasonNormUpsert>;
export type BankJobLogResponseType = z.infer<typeof BankJobLogResponse>;
export type BankOutboxResponseType = z.infer<typeof BankOutboxResponse>;
export type BankAckMapResponseType = z.infer<typeof BankAckMapResponse>;
