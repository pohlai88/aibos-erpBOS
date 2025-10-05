import { pgTable, text, integer, numeric, timestamp, date, primaryKey, boolean, jsonb } from "drizzle-orm/pg-core";

// --- AR Collections & Cash Application (M24) ------------------------------------

export const arDunningPolicy = pgTable("ar_dunning_policy", {
    companyId: text("company_id").notNull(),
    policyCode: text("policy_code").notNull(),           // 'DEFAULT','ENTERPRISE','SMB'
    segment: text("segment"),                           // optional customer segment
    fromBucket: text("from_bucket").notNull(),          // 'CURRENT','1-30','31-60','61-90','90+'
    stepIdx: integer("step_idx").notNull(),             // 0..N sequence
    waitDays: integer("wait_days").notNull(),           // after entering bucket
    channel: text("channel").notNull(),                 // 'EMAIL','WEBHOOK'
    templateId: text("template_id").notNull(),
    throttleDays: integer("throttle_days").notNull().default(3),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.policyCode, table.fromBucket, table.stepIdx] })
}));

export const commTemplate = pgTable("comm_template", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    kind: text("kind").notNull(),                       // 'AR_DUNNING','AR_REMIND','AR_PTP'
    subject: text("subject").notNull(),
    body: text("body").notNull(),                       // handlebars variables
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const arRemittanceImport = pgTable("ar_remittance_import", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    source: text("source").notNull(),                   // 'CAMT054','CSV','EMAIL'
    filename: text("filename"),
    uniqHash: text("uniq_hash").notNull(),              // dedupe
    rowsOk: integer("rows_ok").notNull().default(0),
    rowsErr: integer("rows_err").notNull().default(0),
    payload: text("payload"),                           // raw
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const arCashApp = pgTable("ar_cash_app", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    receiptDate: date("receipt_date").notNull(),
    ccy: text("ccy").notNull(),
    amount: numeric("amount").notNull(),
    customerId: text("customer_id"),
    reference: text("reference"),                       // payer ref / invoice ref
    confidence: numeric("confidence").notNull(),        // 0..1
    status: text("status").notNull(),                   // 'matched','partial','unmatched','rejected'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const arCashAppLink = pgTable("ar_cash_app_link", {
    id: text("id").primaryKey(),
    cashAppId: text("cash_app_id").notNull().references(() => arCashApp.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id").notNull(),
    linkAmount: numeric("link_amount").notNull(),
});

export const arPtp = pgTable("ar_ptp", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
    promisedDate: date("promised_date").notNull(),
    amount: numeric("amount").notNull(),
    reason: text("reason"),
    status: text("status").notNull(),                   // 'open','kept','broken','cancelled'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: text("decided_by"),
});

export const arDispute = pgTable("ar_dispute", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
    reasonCode: text("reason_code").notNull(),          // 'PRICING','SERVICE','GOODS','ADMIN'
    detail: text("detail"),
    status: text("status").notNull(),                   // 'open','resolved','written_off'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: text("resolved_by"),
});

export const arDunningLog = pgTable("ar_dunning_log", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    invoiceId: text("invoice_id"),
    policyCode: text("policy_code"),
    bucket: text("bucket").notNull(),
    stepIdx: integer("step_idx").notNull(),
    channel: text("channel").notNull(),
    templateId: text("template_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").notNull(),                   // 'sent','skipped','error'
    error: text("error"),
});

export const arAgeSnapshot = pgTable("ar_age_snapshot", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    asOfDate: date("as_of_date").notNull(),
    bucket: text("bucket").notNull(),
    customerId: text("customer_id").notNull(),
    openAmt: numeric("open_amt").notNull(),
});

export const cfReceiptSignal = pgTable("cf_receipt_signal", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    weekStart: date("week_start").notNull(),
    ccy: text("ccy").notNull(),
    amount: numeric("amount").notNull(),
    source: text("source").notNull(),                   // 'AUTO_MATCH','PTP','MANUAL'
    refId: text("ref_id"),                              // cash_app id / ptp id
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- AR Credit Management & Collections Workbench (M24.1) -------------------------

export const arCreditPolicy = pgTable("ar_credit_policy", {
    companyId: text("company_id").notNull(),
    policyCode: text("policy_code").notNull(),          // 'DEFAULT','ENTERPRISE'
    segment: text("segment"),                           // match customer segment
    maxLimit: numeric("max_limit").notNull(),           // credit limit in base/present ccy
    dsoTarget: integer("dso_target").notNull().default(45),
    graceDays: integer("grace_days").notNull().default(5), // days beyond due before hold
    ptpTolerance: integer("ptp_tolerance").notNull().default(2),
    riskWeight: numeric("risk_weight").notNull().default("1.0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.policyCode] })
}));

export const arCustomerCredit = pgTable("ar_customer_credit", {
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    policyCode: text("policy_code").notNull(),
    creditLimit: numeric("credit_limit").notNull(),     // override
    riskScore: numeric("risk_score"),                   // external score 0..1 (higher worse)
    onHold: boolean("on_hold").notNull().default(false),
    holdReason: text("hold_reason"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.customerId] })
}));

export const arCreditHoldLog = pgTable("ar_credit_hold_log", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    event: text("event").notNull(),                     // 'HOLD','RELEASE'
    reason: text("reason"),
    snapshot: jsonb("snapshot"),                        // exposure, dso, risk when event triggered
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const arCollectionsNote = pgTable("ar_collections_note", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    invoiceId: text("invoice_id"),
    kind: text("kind").notNull(),                       // 'CALL','EMAIL','MEETING','NOTE'
    body: text("body").notNull(),
    nextActionDate: date("next_action_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const arCollectionsKpi = pgTable("ar_collections_kpi", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    asOfDate: date("as_of_date").notNull(),
    customerId: text("customer_id"),
    dso: numeric("dso"),
    disputesOpen: integer("disputes_open"),
    ptpOpen: integer("ptp_open"),
    exposure: numeric("exposure"),                      // open AR + promised
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- AR Portal & Pay-Now (M24.2) ------------------------------------------

export const arPortalSession = pgTable("ar_portal_session", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    token: text("token").notNull(),                    // opaque, random
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    meta: jsonb("meta"),
});

export const arCheckoutIntent = pgTable("ar_checkout_intent", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    presentCcy: text("present_ccy").notNull(),
    amount: numeric("amount").notNull(),                // intended total
    invoices: jsonb("invoices").notNull(),              // [{invoice_id, amount}]
    surcharge: numeric("surcharge").notNull().default("0"), // if applied
    gateway: text("gateway").notNull(),                 // 'STRIPE','ADYEN','PAYPAL','BANK'
    status: text("status").notNull(),                   // 'created','authorized','captured','failed','expired','voided','refunded'
    clientSecret: text("client_secret"),                // gateway client secret if any
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const arCheckoutTxn = pgTable("ar_checkout_txn", {
    id: text("id").primaryKey(),
    intentId: text("intent_id").notNull().references(() => arCheckoutIntent.id, { onDelete: "cascade" }),
    gateway: text("gateway").notNull(),
    extRef: text("ext_ref"),                           // gateway payment id
    status: text("status").notNull(),                  // 'authorized','captured','failed','refunded','voided'
    amount: numeric("amount").notNull(),
    feeAmount: numeric("fee_amount"),                  // gateway fee if provided
    ccy: text("ccy").notNull(),
    payload: jsonb("payload"),                        // webhook echo
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const arSavedMethod = pgTable("ar_saved_method", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    gateway: text("gateway").notNull(),
    tokenRef: text("token_ref").notNull(),             // network token / pm id (no PAN)
    brand: text("brand"),                             // 'visa','mastercard','ach'
    last4: text("last4"),
    expMonth: integer("exp_month"),
    expYear: integer("exp_year"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const arSurchargePolicy = pgTable("ar_surcharge_policy", {
    companyId: text("company_id").primaryKey(),
    enabled: boolean("enabled").notNull().default(false),
    pct: numeric("pct").notNull().default("0"),         // e.g., 0.015 = 1.5%
    minFee: numeric("min_fee").notNull().default("0"),
    capFee: numeric("cap_fee"),                       // optional cap
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const arReceiptEmail = pgTable("ar_receipt_email", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    intentId: text("intent_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    toAddr: text("to_addr").notNull(),
    status: text("status").notNull(),                 // 'sent','error'
    error: text("error"),
});

export const arGatewayWebhookDlq = pgTable("ar_gateway_webhook_dlq", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    gateway: text("gateway").notNull(),
    payload: jsonb("payload").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    retryAt: timestamp("retry_at", { withTimezone: true }),
});

// --- AR Customer Statements & Portal Ledger (M24.3) -------------------------

export const arFinanceChargePolicy = pgTable("ar_finance_charge_policy", {
    companyId: text("company_id").primaryKey(),
    enabled: boolean("enabled").notNull().default(false),
    annualPct: numeric("annual_pct").notNull().default("0"), // APR, e.g., 0.18 = 18%
    minFee: numeric("min_fee").notNull().default("0"),
    graceDays: integer("grace_days").notNull().default(0), // days past due before accrual
    compMethod: text("comp_method").notNull().default("simple"), // 'simple','daily'
    presentCcy: text("present_ccy"), // if finance charge presented in this currency
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const arStatementRun = pgTable("ar_statement_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    asOfDate: date("as_of_date").notNull(),
    policyCode: text("policy_code"), // dunning/segment policy snapshot if used
    presentCcy: text("present_ccy").notNull(), // statement currency
    status: text("status").notNull().default("draft"), // 'draft','finalized','emailed','error'
    totalsJson: jsonb("totals_json"), // summary metrics
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const arStatementLine = pgTable("ar_statement_line", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull().references(() => arStatementRun.id, { onDelete: "cascade" }),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    docType: text("doc_type").notNull(), // 'INVOICE','CREDIT_MEMO','PAYMENT','ADJ','FINANCE_CHARGE','DISPUTE_HOLD'
    docId: text("doc_id"), // invoice id, cash_app id, etc.
    docDate: date("doc_date").notNull(),
    dueDate: date("due_date"),
    ref: text("ref"),
    memo: text("memo"),
    debit: numeric("debit").notNull().default("0"), // + increases balance
    credit: numeric("credit").notNull().default("0"), // - reduces balance
    balance: numeric("balance").notNull(), // running customer balance in present ccy
    bucket: text("bucket").notNull(), // CURRENT/1-30/31-60/61-90/90+
    currency: text("currency").notNull(),
    sortKey: text("sort_key"), // for stable rendering
});

export const arStatementArtifact = pgTable("ar_statement_artifact", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull().references(() => arStatementRun.id, { onDelete: "cascade" }),
    customerId: text("customer_id").notNull(),
    kind: text("kind").notNull(), // 'PDF','CSV'
    filename: text("filename").notNull(),
    sha256: text("sha256").notNull(),
    bytes: integer("bytes").notNull(),
    storageUri: text("storage_uri").notNull(), // e.g., s3://... or file://...
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const arStatementEmail = pgTable("ar_statement_email", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull().references(() => arStatementRun.id, { onDelete: "cascade" }),
    customerId: text("customer_id").notNull(),
    toAddr: text("to_addr").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    status: text("status").notNull().default("queued"), // 'queued','sent','error'
    error: text("error"),
});

export const arPortalLedgerToken = pgTable("ar_portal_ledger_token", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

// --- AR Invoice (for portal integration) ---------------------------------

export const arInvoice = pgTable("ar_invoice", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    customerId: text("customer_id").notNull(),
    invoiceNo: text("invoice_no").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date").notNull(),
    grossAmount: numeric("gross_amount").notNull(),
    paidAmount: numeric("paid_amount").notNull().default("0"),
    ccy: text("ccy").notNull(),
    status: text("status").notNull(),                   // 'OPEN','PAID','CANCELLED','VOID'
    portalLink: text("portal_link"),                    // cached in emails
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});