import { z } from "zod";

// --- M23.3 Early-Payment Discounts & Dynamic Discounting ----------------------

export const DiscountPolicyUpsert = z.object({
    hurdle_apy: z.number().positive(),
    min_savings_amt: z.number().min(0).default(0),
    min_savings_pct: z.number().min(0).max(1).default(0),
    liquidity_buffer: z.number().min(0).default(0),
    posting_mode: z.enum(["REDUCE_EXPENSE", "OTHER_INCOME"]),
    posting_account: z.string().optional(),
    max_tenor_days: z.number().int().min(1).max(120).default(30)
});

export type DiscountPolicyUpsertType = z.infer<typeof DiscountPolicyUpsert>;

export const DiscountScanReq = z.object({
    window_from: z.string(),  // ISO date
    window_to: z.string(),
    present: z.string().length(3).optional()
});

export type DiscountScanReqType = z.infer<typeof DiscountScanReq>;

export const DiscountRunReq = z.object({
    window_from: z.string(),
    window_to: z.string(),
    cash_cap: z.number().positive().optional(),
    present: z.string().length(3).optional(),
    dry_run: z.boolean().default(true)
});

export type DiscountRunReqType = z.infer<typeof DiscountRunReq>;

export const OfferCreateReq = z.object({
    invoice_id: z.string(),
    supplier_id: z.string(),
    offer_pct: z.number().positive().max(0.1),   // v1 limit 10%
    pay_by_date: z.string()                       // ISO
});

export type OfferCreateReqType = z.infer<typeof OfferCreateReq>;

export const OfferDecisionReq = z.object({
    token: z.string(),
    decision: z.enum(["accepted", "declined"])
});

export type OfferDecisionReqType = z.infer<typeof OfferDecisionReq>;

// --- Response types -----------------------------------------------------------

export const DiscountPolicy = z.object({
    company_id: z.string(),
    hurdle_apy: z.number(),
    min_savings_amt: z.number(),
    min_savings_pct: z.number(),
    liquidity_buffer: z.number(),
    posting_mode: z.enum(["REDUCE_EXPENSE", "OTHER_INCOME"]),
    posting_account: z.string().optional(),
    max_tenor_days: z.number(),
    updated_at: z.string(),
    updated_by: z.string()
});

export type DiscountPolicyType = z.infer<typeof DiscountPolicy>;

export const DiscountLine = z.object({
    id: z.string(),
    run_id: z.string(),
    invoice_id: z.string(),
    supplier_id: z.string(),
    inv_ccy: z.string(),
    pay_ccy: z.string(),
    base_amount: z.number(),
    discount_amt: z.number(),
    early_pay_amt: z.number(),
    apr: z.number(),
    pay_by_date: z.string(),
    selected: z.boolean()
});

export type DiscountLineType = z.infer<typeof DiscountLine>;

export const DiscountRun = z.object({
    id: z.string(),
    company_id: z.string(),
    present_ccy: z.string().optional(),
    status: z.enum(["dry_run", "committed"]),
    window_from: z.string(),
    window_to: z.string(),
    cash_cap: z.number().optional(),
    created_by: z.string(),
    created_at: z.string(),
    lines: z.array(DiscountLine).optional()
});

export type DiscountRunType = z.infer<typeof DiscountRun>;

export const DiscountOffer = z.object({
    id: z.string(),
    company_id: z.string(),
    supplier_id: z.string(),
    invoice_id: z.string(),
    offer_pct: z.number(),
    pay_by_date: z.string(),
    status: z.enum(["proposed", "accepted", "declined", "expired"]),
    token: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    decided_at: z.string().optional(),
    decided_by: z.string().optional()
});

export type DiscountOfferType = z.infer<typeof DiscountOffer>;

