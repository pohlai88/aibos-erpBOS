// packages/contracts/src/ar-portal.ts
import { z } from "zod";

// --- Portal Session Management ---

export const PortalInitReq = z.object({
    company_id: z.string(),
    customer_id: z.string(),
    email: z.string().email(),
    ttl_minutes: z.number().int().min(10).max(1440).default(60)
});

export const PortalInitRes = z.object({
    success: z.boolean(),
    message: z.string()
});

export const PortalInvoicesReq = z.object({
    token: z.string(),
    include_paid: z.boolean().default(false)
});

export const PortalInvoice = z.object({
    id: z.string(),
    invoice_no: z.string(),
    invoice_date: z.string(),
    due_date: z.string(),
    gross_amount: z.number(),
    paid_amount: z.number(),
    remaining_amount: z.number(),
    ccy: z.string(),
    status: z.enum(['OPEN', 'PAID', 'CANCELLED', 'VOID']),
    portal_link: z.string().optional()
});

export const PortalInvoicesRes = z.object({
    invoices: z.array(PortalInvoice),
    customer_name: z.string(),
    default_method: z.object({
        id: z.string(),
        brand: z.string(),
        last4: z.string(),
        exp_month: z.number().optional(),
        exp_year: z.number().optional()
    }).optional()
});

// --- Checkout & Payment ---

export const CheckoutIntentReq = z.object({
    token: z.string(),
    invoices: z.array(z.object({
        invoice_id: z.string(),
        amount: z.number().positive()
    })),
    present_ccy: z.string().length(3),
    gateway: z.enum(["STRIPE", "ADYEN", "PAYPAL", "BANK"]),
    save_method: z.boolean().default(false)
});

export const CheckoutIntentRes = z.object({
    intent_id: z.string(),
    client_secret: z.string().optional(),
    amount: z.number(),
    surcharge: z.number(),
    total_amount: z.number(),
    gateway: z.string(),
    expires_at: z.string()
});

export const CheckoutConfirmReq = z.object({
    intent_id: z.string(),
    gateway_payload: z.any()  // raw client payload / payment_method id
});

export const CheckoutConfirmRes = z.object({
    success: z.boolean(),
    transaction_id: z.string(),
    receipt_url: z.string().optional(),
    message: z.string()
});

// --- Self-Serve PTP & Disputes ---

export const PtpPublicCreate = z.object({
    token: z.string(),
    invoice_id: z.string(),
    promised_date: z.string(),
    amount: z.number().positive(),
    note: z.string().optional()
});

export const PtpPublicRes = z.object({
    ptp_id: z.string(),
    status: z.string(),
    message: z.string()
});

export const DisputePublicCreate = z.object({
    token: z.string(),
    invoice_id: z.string(),
    reason_code: z.enum(["PRICING", "SERVICE", "GOODS", "ADMIN"]),
    detail: z.string().optional()
});

export const DisputePublicRes = z.object({
    dispute_id: z.string(),
    status: z.string(),
    message: z.string()
});

// --- Surcharge Policy ---

export const SurchargePolicyReq = z.object({
    enabled: z.boolean(),
    pct: z.number().min(0).max(0.1),  // max 10%
    min_fee: z.number().min(0),
    cap_fee: z.number().min(0).optional()
});

export const SurchargePolicyRes = z.object({
    company_id: z.string(),
    enabled: z.boolean(),
    pct: z.number(),
    min_fee: z.number(),
    cap_fee: z.number().optional(),
    updated_at: z.string(),
    updated_by: z.string()
});

// --- Webhook Types ---

export const GatewayWebhookReq = z.object({
    gateway: z.enum(["STRIPE", "ADYEN", "PAYPAL"]),
    payload: z.any(),
    signature: z.string().optional(),
    timestamp: z.number().optional()
});

export const GatewayWebhookRes = z.object({
    success: z.boolean(),
    processed: z.boolean(),
    reason: z.string().optional()
});

// --- Ops/Admin Types ---

export const PortalSessionOps = z.object({
    id: z.string(),
    company_id: z.string(),
    customer_id: z.string(),
    token: z.string(),
    expires_at: z.string(),
    used_at: z.string().optional(),
    created_at: z.string(),
    created_by: z.string()
});

export const CheckoutIntentOps = z.object({
    id: z.string(),
    company_id: z.string(),
    customer_id: z.string(),
    amount: z.number(),
    surcharge: z.number(),
    gateway: z.string(),
    status: z.string(),
    created_at: z.string(),
    created_by: z.string()
});

export const RefundReq = z.object({
    transaction_id: z.string(),
    amount: z.number().positive().optional(),  // partial refund
    reason: z.string().optional()
});

export const RefundRes = z.object({
    refund_id: z.string(),
    amount: z.number(),
    status: z.string(),
    message: z.string()
});

// --- Type Exports ---

export type PortalInitReqType = z.infer<typeof PortalInitReq>;
export type PortalInitResType = z.infer<typeof PortalInitRes>;
export type PortalInvoicesReqType = z.infer<typeof PortalInvoicesReq>;
export type PortalInvoiceType = z.infer<typeof PortalInvoice>;
export type PortalInvoicesResType = z.infer<typeof PortalInvoicesRes>;
export type CheckoutIntentReqType = z.infer<typeof CheckoutIntentReq>;
export type CheckoutIntentResType = z.infer<typeof CheckoutIntentRes>;
export type CheckoutConfirmReqType = z.infer<typeof CheckoutConfirmReq>;
export type CheckoutConfirmResType = z.infer<typeof CheckoutConfirmRes>;
export type PtpPublicCreateType = z.infer<typeof PtpPublicCreate>;
export type PtpPublicResType = z.infer<typeof PtpPublicRes>;
export type DisputePublicCreateType = z.infer<typeof DisputePublicCreate>;
export type DisputePublicResType = z.infer<typeof DisputePublicRes>;
export type SurchargePolicyReqType = z.infer<typeof SurchargePolicyReq>;
export type SurchargePolicyResType = z.infer<typeof SurchargePolicyRes>;
export type GatewayWebhookReqType = z.infer<typeof GatewayWebhookReq>;
export type GatewayWebhookResType = z.infer<typeof GatewayWebhookRes>;
export type PortalSessionOpsType = z.infer<typeof PortalSessionOps>;
export type CheckoutIntentOpsType = z.infer<typeof CheckoutIntentOps>;
export type RefundReqType = z.infer<typeof RefundReq>;
export type RefundResType = z.infer<typeof RefundRes>;
