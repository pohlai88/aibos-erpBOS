import { pgTable, text, integer, numeric, boolean, timestamp, date, primaryKey, jsonb } from "drizzle-orm/pg-core";

// --- AP Payment System (M23) -------------------------------------------------
export const apSupplierBank = pgTable("ap_supplier_bank", {
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    method: text("method").notNull(),
    bankName: text("bank_name"),
    iban: text("iban"),
    bic: text("bic"),
    acctNo: text("acct_no"),
    acctCcy: text("acct_ccy").notNull(),
    country: text("country"),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.supplierId] })
}));

export const apPaymentPref = pgTable("ap_payment_pref", {
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    payTerms: text("pay_terms"),
    payDayRule: text("pay_day_rule"),
    minAmount: numeric("min_amount"),
    holdPay: boolean("hold_pay").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.supplierId] })
}));

export const apPayRun = pgTable("ap_pay_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    status: text("status").notNull(),
    ccy: text("ccy").notNull(),
    presentCcy: text("present_ccy"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    // M23.2: Bank connectivity state machine fields
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    failedReason: text("failed_reason"),
});

export const apPayLine = pgTable("ap_pay_line", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
    dueDate: date("due_date").notNull(),
    grossAmount: numeric("gross_amount").notNull(),
    discAmount: numeric("disc_amount").notNull().default("0"),
    payAmount: numeric("pay_amount").notNull(),
    invCcy: text("inv_ccy").notNull(),
    payCcy: text("pay_ccy").notNull(),
    fxRate: numeric("fx_rate"),
    bankRef: text("bank_ref"),
    status: text("status").notNull(),
    note: text("note"),
});

export const apPayExport = pgTable("ap_pay_export", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    format: text("format").notNull(),
    filename: text("filename").notNull(),
    payload: text("payload").notNull(),
    checksum: text("checksum").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apRemittance = pgTable("ap_remittance", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    address: text("address"),
    status: text("status").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    response: text("response"),
});

export const bankFileImport = pgTable("bank_file_import", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    kind: text("kind").notNull(),
    filename: text("filename").notNull(),
    payload: text("payload").notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
    uniqHash: text("uniq_hash").notNull(),
});

export const bankTxnMap = pgTable("bank_txn_map", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    bankDate: date("bank_date").notNull(),
    amount: numeric("amount").notNull(),
    ccy: text("ccy").notNull(),
    counterparty: text("counterparty"),
    memo: text("memo"),
    matchedRunId: text("matched_run_id"),
    matchedLineId: text("matched_line_id"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apPaymentPost = pgTable("ap_payment_post", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    feeAmount: numeric("fee_amount").notNull().default("0"),
    feeAccount: text("fee_account"),
    realizedFx: numeric("realized_fx").notNull().default("0"),
    realizedFxAccount: text("realized_fx_account"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    journalId: text("journal_id"),
});

export const apPayLock = pgTable("ap_pay_lock", {
    companyId: text("company_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.invoiceId] })
}));

export const apVendorToken = pgTable("ap_vendor_token", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apFileProfile = pgTable("ap_file_profile", {
    companyId: text("company_id").notNull(),
    bankCode: text("bank_code").notNull(),
    format: text("format").notNull(),
    profile: jsonb("profile").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.bankCode] })
}));

// --- M23.1 Dual-Control & KYC Tables ----------------------------------------
export const apApprovalPolicy = pgTable("ap_approval_policy", {
    companyId: text("company_id").notNull(),
    policyCode: text("policy_code").notNull(),
    minAmount: numeric("min_amount").notNull().default("0"),
    maxAmount: numeric("max_amount"),
    currency: text("currency"),
    requireReviewer: boolean("require_reviewer").notNull().default(true),
    requireApprover: boolean("require_approver").notNull().default(true),
    requireDualApprover: boolean("require_dual_approver").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.policyCode] })
}));

export const apSupplierPolicy = pgTable("ap_supplier_policy", {
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    policyCode: text("policy_code").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.supplierId] })
}));

export const apRunApproval = pgTable("ap_run_approval", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    step: text("step").notNull(),
    actor: text("actor").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
    decision: text("decision").notNull(),
    reason: text("reason"),
});

export const apPayeeKyc = pgTable("ap_payee_kyc", {
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    residency: text("residency"),
    taxForm: text("tax_form"),
    taxId: text("tax_id"),
    docType: text("doc_type"),
    docRef: text("doc_ref"),
    docExpires: date("doc_expires"),
    riskLevel: text("risk_level"),
    onHold: boolean("on_hold").notNull().default(false),
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.supplierId] })
}));

export const sanctionDenylist = pgTable("sanction_denylist", {
    companyId: text("company_id").notNull(),
    nameNorm: text("name_norm").notNull(),
    country: text("country"),
    source: text("source"),
    listedAt: timestamp("listed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sanctionScreenRun = pgTable("sanction_screen_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    runId: text("run_id"),
    supplierId: text("supplier_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const sanctionHit = pgTable("sanction_hit", {
    id: text("id").primaryKey(),
    screenId: text("screen_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    nameNorm: text("name_norm").notNull(),
    matchScore: numeric("match_score").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull(),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    reason: text("reason"),
});

export const apSupplierLimit = pgTable("ap_supplier_limit", {
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    dayCap: numeric("day_cap"),
    runCap: numeric("run_cap"),
    yearCap: numeric("year_cap"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.supplierId] })
}));

export const apRunGate = pgTable("ap_run_gate", {
    companyId: text("company_id").notNull(),
    runId: text("run_id").notNull(),
    gate: text("gate").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.runId, table.gate] })
}));

export const sanctionAdapterProfile = pgTable("sanction_adapter_profile", {
    companyId: text("company_id").notNull(),
    adapter: text("adapter").notNull(),
    config: jsonb("config").notNull(),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.adapter] })
}));

// --- M23.2 Bank Connectivity & Acknowledgments ---------------------------------
export const bankConnProfile = pgTable("bank_conn_profile", {
    companyId: text("company_id").notNull(),
    bankCode: text("bank_code").notNull(),
    kind: text("kind").notNull(),
    config: jsonb("config").notNull(),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.bankCode] })
}));

export const bankFetchCursor = pgTable("bank_fetch_cursor", {
    companyId: text("company_id").notNull(),
    bankCode: text("bank_code").notNull(),
    channel: text("channel").notNull(),
    cursor: text("cursor"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.bankCode, table.channel] })
}));

export const bankOutbox = pgTable("bank_outbox", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    runId: text("run_id").notNull(),
    bankCode: text("bank_code").notNull(),
    filename: text("filename").notNull(),
    payload: text("payload").notNull(),
    checksum: text("checksum").notNull(),
    status: text("status").notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const bankJobLog = pgTable("bank_job_log", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    bankCode: text("bank_code").notNull(),
    kind: text("kind").notNull(),
    detail: text("detail").notNull(),
    payload: text("payload"),
    success: boolean("success").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bankAck = pgTable("bank_ack", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    bankCode: text("bank_code").notNull(),
    ackKind: text("ack_kind").notNull(),
    filename: text("filename").notNull(),
    payload: text("payload").notNull(),
    uniqHash: text("uniq_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bankAckMap = pgTable("bank_ack_map", {
    id: text("id").primaryKey(),
    ackId: text("ack_id").notNull(),
    runId: text("run_id"),
    lineId: text("line_id"),
    status: text("status").notNull(),
    reasonCode: text("reason_code"),
    reasonLabel: text("reason_label"),
});

export const bankReasonNorm = pgTable("bank_reason_norm", {
    bankCode: text("bank_code").notNull(),
    code: text("code").notNull(),
    normStatus: text("norm_status").notNull(),
    normLabel: text("norm_label").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.bankCode, table.code] })
}));

export const bankInboxAudit = pgTable("bank_inbox_audit", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    bankCode: text("bank_code").notNull(),
    channel: text("channel").notNull(),
    filename: text("filename").notNull(),
    uniqHash: text("uniq_hash").notNull(),
    storedAt: timestamp("stored_at", { withTimezone: true }).notNull().defaultNow(),
});

export const secretRef = pgTable("secret_ref", {
    name: text("name").primaryKey(),
    note: text("note"),
});

// --- M23.3 Early-Payment Discounts & Dynamic Discounting ----------------------

export const apInvoice = pgTable("ap_invoice", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    invoiceNo: text("invoice_no").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date").notNull(),
    grossAmount: numeric("gross_amount").notNull(),
    discAmount: numeric("disc_amount").notNull().default("0"),
    ccy: text("ccy").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    // M23.3: Early payment discount terms
    discountPct: numeric("discount_pct"),
    discountDays: integer("discount_days"),
    netDays: integer("net_days"),
    discountDueDate: date("discount_due_date"),
    termsText: text("terms_text"),
});

export const apDiscountPolicy = pgTable("ap_discount_policy", {
    companyId: text("company_id").primaryKey(),
    hurdleApy: numeric("hurdle_apy").notNull(),
    minSavingsAmt: numeric("min_savings_amt").notNull().default("0"),
    minSavingsPct: numeric("min_savings_pct").notNull().default("0"),
    liquidityBuffer: numeric("liquidity_buffer").notNull().default("0"),
    postingMode: text("posting_mode").notNull(),
    postingAccount: text("posting_account"),
    maxTenorDays: integer("max_tenor_days").notNull().default(30),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const apDiscountRun = pgTable("ap_discount_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    presentCcy: text("present_ccy"),
    status: text("status").notNull(),
    windowFrom: date("window_from").notNull(),
    windowTo: date("window_to").notNull(),
    cashCap: numeric("cash_cap"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apDiscountLine = pgTable("ap_discount_line", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    invCcy: text("inv_ccy").notNull(),
    payCcy: text("pay_ccy").notNull(),
    baseAmount: numeric("base_amount").notNull(),
    discountAmt: numeric("discount_amt").notNull(),
    earlyPayAmt: numeric("early_pay_amt").notNull(),
    apr: numeric("apr").notNull(),
    payByDate: date("pay_by_date").notNull(),
    selected: boolean("selected").notNull().default(false),
});

export const apDiscountOffer = pgTable("ap_discount_offer", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    supplierId: text("supplier_id").notNull(),
    invoiceId: text("invoice_id").notNull(),
    offerPct: numeric("offer_pct").notNull(),
    payByDate: date("pay_by_date").notNull(),
    status: text("status").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: text("decided_by"),
});

export const apDiscountPost = pgTable("ap_discount_post", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    runId: text("run_id").notNull(),
    totalSavings: numeric("total_savings").notNull(),
    journalId: text("journal_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: text("posted_by"),
});

export const apTermsImport = pgTable("ap_terms_import", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    filename: text("filename"),
    rowsOk: integer("rows_ok").notNull(),
    rowsErr: integer("rows_err").notNull(),
    payload: text("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});