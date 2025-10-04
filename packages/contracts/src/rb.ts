import { z } from "zod";

// --- Revenue & Billing (M25) ------------------------------------------------

// Catalog Contracts
export const ProductUpsert = z.object({
    sku: z.string(),
    name: z.string(),
    kind: z.enum(['ONE_TIME', 'RECURRING', 'USAGE']),
    gl_rev_acct: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

export const PriceBookUpsert = z.object({
    code: z.string(),
    currency: z.string().length(3),
    active: z.boolean().default(true)
});

export const PriceUpsert = z.object({
    product_id: z.string(),
    book_id: z.string(),
    model: z.enum(['FLAT', 'TIERED', 'STAIR', 'VOLUME']),
    unit_amount: z.number().optional(),
    unit: z.string().optional(),
    interval: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']).optional(),
    interval_count: z.number().int().min(1).default(1),
    min_qty: z.number().min(0).default(0),
    max_qty: z.number().optional(),
    meta: z.object({
        // For TIERED pricing: tiers array with from, to, price
        tiers: z.array(z.object({
            from: z.number().int().min(0),
            to: z.number().int().min(0),
            price: z.number().positive()
        })).optional(),
        // For VOLUME pricing: discounts array with threshold, percentage
        discounts: z.array(z.object({
            threshold: z.number().int().min(0),
            percentage: z.number().min(0).max(100)
        })).optional()
    }).optional()
});

// Contract Contracts
export const ContractUpsert = z.object({
    customer_id: z.string(),
    book_id: z.string(),
    start_date: z.string(),
    end_date: z.string().optional(),
    terms: z.any().optional()
});

export const SubscriptionUpsert = z.object({
    contract_id: z.string(),
    product_id: z.string(),
    price_id: z.string(),
    qty: z.number().positive(),
    start_date: z.string(),
    end_date: z.string().optional(),
    bill_anchor: z.string(),
    proration: z.enum(['DAILY', 'NONE']).default('DAILY'),
    meta: z.any().optional()
});

export const SubscriptionUpgradeReq = z.object({
    subscription_id: z.string(),
    new_price_id: z.string(),
    effective_date: z.string(),
    proration: z.enum(['DAILY', 'NONE']).default('DAILY')
});

// Usage Contracts
export const UsageIngest = z.object({
    subscription_id: z.string(),
    events: z.array(z.object({
        event_time: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
        uniq_hash: z.string(),
        payload: z.any().optional()
    }))
});

export const UsageRollupReq = z.object({
    subscription_id: z.string(),
    window_start: z.string(),
    window_end: z.string(),
    unit: z.string()
});

// Billing Contracts
export const BillingRunReq = z.object({
    period_start: z.string(),
    period_end: z.string(),
    present: z.string().length(3),
    dry_run: z.boolean().default(true)
});

export const InvoiceFinalizeReq = z.object({
    invoice_id: z.string(),
    issue_date: z.string().optional(),
    due_date: z.string().optional()
});

// Credit Contracts
export const CreditMemoReq = z.object({
    customer_id: z.string(),
    amount: z.number().positive(),
    reason: z.string().optional()
});

export const CreditApplyReq = z.object({
    memo_id: z.string(),
    invoice_id: z.string(),
    amount: z.number().positive()
});

// Query Contracts
export const ProductQuery = z.object({
    sku: z.string().optional(),
    kind: z.enum(['ONE_TIME', 'RECURRING', 'USAGE']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

export const SubscriptionQuery = z.object({
    customer_id: z.string().optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
    bill_anchor: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

export const InvoiceQuery = z.object({
    customer_id: z.string().optional(),
    status: z.enum(['DRAFT', 'FINAL', 'VOID', 'PAID', 'PARTIAL']).optional(),
    period_start: z.string().optional(),
    period_end: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Response Types
export const ProductResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    sku: z.string(),
    name: z.string(),
    kind: z.enum(['ONE_TIME', 'RECURRING', 'USAGE']),
    gl_rev_acct: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    updated_at: z.string(),
    updated_by: z.string()
});

export const PriceBookResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    code: z.string(),
    currency: z.string(),
    active: z.boolean(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const PriceResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    product_id: z.string(),
    book_id: z.string(),
    model: z.enum(['FLAT', 'TIERED', 'STAIR', 'VOLUME']),
    unit_amount: z.number().optional(),
    unit: z.string().optional(),
    interval: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']).optional(),
    interval_count: z.number(),
    min_qty: z.number(),
    max_qty: z.number().optional(),
    meta: z.any().optional()
});

export const ContractResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    customer_id: z.string(),
    book_id: z.string(),
    start_date: z.string(),
    end_date: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'CANCELLED']),
    terms: z.any().optional(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const SubscriptionResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    contract_id: z.string(),
    product_id: z.string(),
    price_id: z.string(),
    qty: z.number(),
    start_date: z.string(),
    end_date: z.string().optional(),
    bill_anchor: z.string(),
    status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']),
    proration: z.enum(['DAILY', 'NONE']),
    meta: z.any().optional()
});

export const InvoiceResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    customer_id: z.string(),
    present_ccy: z.string(),
    issue_date: z.string(),
    due_date: z.string(),
    status: z.enum(['DRAFT', 'FINAL', 'VOID', 'PAID', 'PARTIAL']),
    subtotal: z.number(),
    tax_total: z.number(),
    total: z.number(),
    fx_present_rate: z.number().optional(),
    portal_link: z.string().optional(),
    meta: z.any().optional(),
    created_at: z.string(),
    created_by: z.string()
});

export const InvoiceLineResponse = z.object({
    id: z.string(),
    invoice_id: z.string(),
    company_id: z.string(),
    kind: z.enum(['ONE_TIME', 'RECURRING', 'USAGE', 'CREDIT', 'ADJUSTMENT', 'ROUNDING']),
    product_id: z.string().optional(),
    description: z.string(),
    qty: z.number(),
    unit: z.string().optional(),
    unit_price: z.number(),
    line_subtotal: z.number(),
    tax_code: z.string().optional(),
    tax_amount: z.number(),
    line_total: z.number()
});

export const CreditMemoResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    customer_id: z.string(),
    reason: z.string().optional(),
    status: z.enum(['DRAFT', 'FINAL', 'APPLIED', 'VOID']),
    present_ccy: z.string(),
    amount: z.number(),
    created_at: z.string(),
    created_by: z.string()
});

export const BillingRunResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    period_start: z.string(),
    period_end: z.string(),
    present_ccy: z.string(),
    status: z.enum(['DRAFT', 'RATED', 'INVOICED', 'POSTED', 'ERROR']),
    stats: z.any().optional(),
    created_at: z.string(),
    created_by: z.string()
});

// Type exports
export type ProductUpsertType = z.infer<typeof ProductUpsert>;
export type PriceBookUpsertType = z.infer<typeof PriceBookUpsert>;
export type PriceUpsertType = z.infer<typeof PriceUpsert>;
export type ContractUpsertType = z.infer<typeof ContractUpsert>;
export type SubscriptionUpsertType = z.infer<typeof SubscriptionUpsert>;
export type SubscriptionUpgradeReqType = z.infer<typeof SubscriptionUpgradeReq>;
export type UsageIngestType = z.infer<typeof UsageIngest>;
export type UsageRollupReqType = z.infer<typeof UsageRollupReq>;
export type BillingRunReqType = z.infer<typeof BillingRunReq>;
export type InvoiceFinalizeReqType = z.infer<typeof InvoiceFinalizeReq>;
export type CreditMemoReqType = z.infer<typeof CreditMemoReq>;
export type CreditApplyReqType = z.infer<typeof CreditApplyReq>;
export type ProductQueryType = z.infer<typeof ProductQuery>;
export type SubscriptionQueryType = z.infer<typeof SubscriptionQuery>;
export type InvoiceQueryType = z.infer<typeof InvoiceQuery>;
export type ProductResponseType = z.infer<typeof ProductResponse>;
export type PriceBookResponseType = z.infer<typeof PriceBookResponse>;
export type PriceResponseType = z.infer<typeof PriceResponse>;
export type ContractResponseType = z.infer<typeof ContractResponse>;
export type SubscriptionResponseType = z.infer<typeof SubscriptionResponse>;
export type InvoiceResponseType = z.infer<typeof InvoiceResponse>;
export type InvoiceLineResponseType = z.infer<typeof InvoiceLineResponse>;
export type CreditMemoResponseType = z.infer<typeof CreditMemoResponse>;
export type BillingRunResponseType = z.infer<typeof BillingRunResponse>;
