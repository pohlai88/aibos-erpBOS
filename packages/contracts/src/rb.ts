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

// --- Revenue Recognition Modifications (M25.2) ------------------------------------------------

// Change Order Contracts
export const ChangeOrderCreate = z.object({
    contract_id: z.string(),
    effective_date: z.string(), // YYYY-MM-DD
    reason: z.string().optional(),
    lines: z.array(z.object({
        pob_id: z.string().optional(),     // existing POB (modify) or undefined to add
        product_id: z.string().optional(), // for new POB
        qty_delta: z.number().optional(),
        price_delta: z.number().optional(), // Δ to allocated or new TP element
        term_delta_days: z.number().int().optional(),
        new_method: z.enum(['POINT_IN_TIME', 'RATABLE_DAILY', 'RATABLE_MONTHLY', 'USAGE']).optional(),
        new_ssp: z.number().optional()
    }))
});

export const ApplyChangeOrderReq = z.object({
    change_order_id: z.string(),
    treatment: z.enum(['SEPARATE', 'TERMINATION_NEW', 'PROSPECTIVE', 'RETROSPECTIVE'])
});

// Variable Consideration Contracts
export const VCUpsert = z.object({
    contract_id: z.string(),
    pob_id: z.string(),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    method: z.enum(['EXPECTED_VALUE', 'MOST_LIKELY']),
    estimate: z.number(),       // raw estimate
    confidence: z.number().min(0).max(1),
    resolve: z.boolean().default(false)
});

export const VCPolicyUpsert = z.object({
    default_method: z.enum(['EXPECTED_VALUE', 'MOST_LIKELY']),
    constraint_probability_threshold: z.number().min(0).max(1).default(0.5),
    volatility_lookback_months: z.number().int().min(1).max(24).default(12)
});

// Recognition Contracts
export const RecognizeRevisedReq = z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true)
});

// Query Contracts
export const ChangeOrderQuery = z.object({
    contract_id: z.string().optional(),
    status: z.enum(['DRAFT', 'APPLIED', 'VOID']).optional(),
    type: z.enum(['SEPARATE', 'TERMINATION_NEW', 'PROSPECTIVE', 'RETROSPECTIVE']).optional(),
    effective_date_from: z.string().optional(),
    effective_date_to: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

export const VCQuery = z.object({
    contract_id: z.string().optional(),
    pob_id: z.string().optional(),
    year: z.number().int().optional(),
    month: z.number().int().min(1).max(12).optional(),
    status: z.enum(['OPEN', 'RESOLVED']).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

export const RevisionQuery = z.object({
    contract_id: z.string().optional(),
    pob_id: z.string().optional(),
    year: z.number().int().optional(),
    month: z.number().int().min(1).max(12).optional(),
    cause: z.enum(['CO', 'VC_TRUEUP']).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
});

// Response Types
export const ChangeOrderResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    contract_id: z.string(),
    effective_date: z.string(),
    type: z.enum(['SEPARATE', 'TERMINATION_NEW', 'PROSPECTIVE', 'RETROSPECTIVE']),
    reason: z.string().optional(),
    status: z.enum(['DRAFT', 'APPLIED', 'VOID']),
    created_at: z.string(),
    created_by: z.string(),
    lines: z.array(z.object({
        id: z.string(),
        pob_id: z.string().optional(),
        product_id: z.string().optional(),
        qty_delta: z.number().optional(),
        price_delta: z.number().optional(),
        term_delta_days: z.number().optional(),
        new_method: z.string().optional(),
        new_ssp: z.number().optional()
    }))
});

export const VCResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    contract_id: z.string(),
    pob_id: z.string(),
    year: z.number(),
    month: z.number(),
    method: z.enum(['EXPECTED_VALUE', 'MOST_LIKELY']),
    raw_estimate: z.number(),
    constrained_amount: z.number(),
    confidence: z.number(),
    status: z.enum(['OPEN', 'RESOLVED']),
    created_at: z.string(),
    created_by: z.string()
});

export const VCPolicyResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    default_method: z.enum(['EXPECTED_VALUE', 'MOST_LIKELY']),
    constraint_probability_threshold: z.number(),
    volatility_lookback_months: z.number(),
    updated_at: z.string(),
    updated_by: z.string()
});

export const RevisionResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    pob_id: z.string(),
    from_period_year: z.number(),
    from_period_month: z.number(),
    planned_before: z.number(),
    planned_after: z.number(),
    delta_planned: z.number(),
    cause: z.enum(['CO', 'VC_TRUEUP']),
    change_order_id: z.string().optional(),
    vc_estimate_id: z.string().optional(),
    created_at: z.string(),
    created_by: z.string()
});

export const CatchupResponse = z.object({
    id: z.string(),
    run_id: z.string(),
    pob_id: z.string(),
    year: z.number(),
    month: z.number(),
    catchup_amount: z.number(),
    dr_account: z.string(),
    cr_account: z.string(),
    memo: z.string().optional(),
    created_at: z.string(),
    created_by: z.string()
});

export const DisclosureResponse = z.object({
    modification_register: z.array(z.object({
        id: z.string(),
        contract_id: z.string(),
        change_order_id: z.string(),
        effective_date: z.string(),
        type: z.string(),
        reason: z.string().optional(),
        txn_price_before: z.number(),
        txn_price_after: z.number(),
        txn_price_delta: z.number(),
        created_at: z.string(),
        created_by: z.string()
    })),
    vc_rollforward: z.array(z.object({
        id: z.string(),
        contract_id: z.string(),
        pob_id: z.string(),
        year: z.number(),
        month: z.number(),
        opening_balance: z.number(),
        additions: z.number(),
        changes: z.number(),
        releases: z.number(),
        recognized: z.number(),
        closing_balance: z.number(),
        created_at: z.string(),
        created_by: z.string()
    })),
    rpo_snapshot: z.array(z.object({
        id: z.string(),
        contract_id: z.string(),
        pob_id: z.string(),
        year: z.number(),
        month: z.number(),
        rpo_amount: z.number(),
        delta_from_revisions: z.number(),
        delta_from_vc: z.number(),
        notes: z.string().optional(),
        created_at: z.string(),
        created_by: z.string()
    }))
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

// M25.2 Revenue Recognition Modifications Types
export type ChangeOrderCreateType = z.infer<typeof ChangeOrderCreate>;
export type ApplyChangeOrderReqType = z.infer<typeof ApplyChangeOrderReq>;
export type VCUpsertType = z.infer<typeof VCUpsert>;
export type VCPolicyUpsertType = z.infer<typeof VCPolicyUpsert>;
export type RecognizeRevisedReqType = z.infer<typeof RecognizeRevisedReq>;
export type ChangeOrderQueryType = z.infer<typeof ChangeOrderQuery>;
export type VCQueryType = z.infer<typeof VCQuery>;
export type RevisionQueryType = z.infer<typeof RevisionQuery>;
export type ChangeOrderResponseType = z.infer<typeof ChangeOrderResponse>;
export type VCResponseType = z.infer<typeof VCResponse>;
export type VCPolicyResponseType = z.infer<typeof VCPolicyResponse>;
export type RevisionResponseType = z.infer<typeof RevisionResponse>;
export type CatchupResponseType = z.infer<typeof CatchupResponse>;
export type DisclosureResponseType = z.infer<typeof DisclosureResponse>;
