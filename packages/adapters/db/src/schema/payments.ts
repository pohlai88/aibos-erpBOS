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
