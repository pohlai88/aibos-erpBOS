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
