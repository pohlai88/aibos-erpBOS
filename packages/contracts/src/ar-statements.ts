// packages/contracts/src/ar-statements.ts
import { z } from "zod";

// --- AR Customer Statements & Portal Ledger (M24.3) -------------------------

export const FinanceChargePolicyUpsert = z.object({
    enabled: z.boolean(),
    annual_pct: z.number().min(0).default(0),
    min_fee: z.number().min(0).default(0),
    grace_days: z.number().int().min(0).default(0),
    comp_method: z.enum(["simple", "daily"]).default("simple"),
    present_ccy: z.string().length(3).optional()
});

export const StatementRunReq = z.object({
    as_of_date: z.string(),           // 'YYYY-MM-DD'
    present: z.string().length(3),
    finalize: z.boolean().default(true),
    include_pdf: z.boolean().default(true),
    include_csv: z.boolean().default(true),
    segments: z.array(z.string()).optional()   // optional filter
});

export const StatementEmailReq = z.object({
    run_id: z.string(),
    resend_failed: z.boolean().default(true)
});

export const PortalLedgerReq = z.object({
    token: z.string(),
    since: z.string().optional(),
    until: z.string().optional(),
    include_disputes: z.boolean().default(true)
});

export const StatementRunRes = z.object({
    run_id: z.string(),
    status: z.string(),
    customers_processed: z.number(),
    artifacts_generated: z.number(),
    errors: z.array(z.string()).optional()
});

export const StatementEmailRes = z.object({
    emails_queued: z.number(),
    emails_sent: z.number(),
    emails_failed: z.number(),
    errors: z.array(z.string()).optional()
});

export const PortalLedgerRes = z.object({
    customer_id: z.string(),
    as_of_date: z.string(),
    present_ccy: z.string(),
    opening_balance: z.number(),
    closing_balance: z.number(),
    lines: z.array(z.object({
        doc_type: z.string(),
        doc_date: z.string(),
        due_date: z.string().optional(),
        ref: z.string().optional(),
        memo: z.string().optional(),
        debit: z.number(),
        credit: z.number(),
        balance: z.number(),
        bucket: z.string(),
        currency: z.string()
    })),
    latest_statement: z.object({
        pdf_url: z.string().optional(),
        csv_url: z.string().optional(),
        as_of_date: z.string()
    }).optional()
});

// Type exports
export type FinanceChargePolicyUpsertType = z.infer<typeof FinanceChargePolicyUpsert>;
export type StatementRunReqType = z.infer<typeof StatementRunReq>;
export type StatementEmailReqType = z.infer<typeof StatementEmailReq>;
export type PortalLedgerReqType = z.infer<typeof PortalLedgerReq>;
export type StatementRunResType = z.infer<typeof StatementRunRes>;
export type StatementEmailResType = z.infer<typeof StatementEmailRes>;
export type PortalLedgerResType = z.infer<typeof PortalLedgerRes>;
