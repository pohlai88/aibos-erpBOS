import { pgTable, text, char, timestamp, numeric, pgEnum, primaryKey, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const company = pgTable("company", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),            // Asset/Liability/Equity/Income/Expense
    normalBalance: char("normal_balance", { length: 1 }).notNull(), // D/C
    parentCode: text("parent_code"),
});

export const accountingPeriod = pgTable("accounting_period", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    code: text("code").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
}, (t) => ({
    uniq: primaryKey({ columns: [t.id] })
}));

export const journal = pgTable("journal", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    postingDate: timestamp("posting_date", { withTimezone: true }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    sourceDoctype: text("source_doctype").notNull(),
    sourceId: text("source_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    isReversal: text("is_reversal").default("false").notNull(),
    reversesJournalId: text("reverses_journal_id"),
    autoReverseOn: timestamp("auto_reverse_on", { withTimezone: true })
});

export const journalLine = pgTable("journal_line", {
    id: text("id").primaryKey(),
    journalId: text("journal_id").references(() => journal.id, { onDelete: "cascade" }).notNull(),
    accountCode: text("account_code").notNull(),
    dc: char("dc", { length: 1 }).notNull(),
    amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    partyType: text("party_type"),
    partyId: text("party_id"),
});

export const outbox = pgTable("outbox", {
    id: text("id").primaryKey(),
    topic: text("topic").notNull(),
    payload: text("payload").notNull(), // JSON string
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const item = pgTable("item", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    uom: text("uom").notNull()
});

export const stockLedger = pgTable("stock_ledger", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    itemId: text("item_id").references(() => item.id).notNull(),
    moveId: text("move_id").notNull(),     // idempotency key for the move
    kind: text("kind").notNull(),          // 'in' | 'out'
    qty: numeric("qty", { precision: 20, scale: 6 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 20, scale: 6 }).notNull(),  // MYR per unit
    totalCost: numeric("total_cost", { precision: 20, scale: 6 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const itemCosts = pgTable("item_costs", {
    companyId: text("company_id").references(() => company.id).notNull(),
    itemId: text("item_id").references(() => item.id).notNull(),
    onHandQty: numeric("on_hand_qty", { precision: 20, scale: 6 }).notNull(),
    movingAvgCost: numeric("moving_avg_cost", { precision: 20, scale: 6 }).notNull(),
    totalValue: numeric("total_value", { precision: 20, scale: 6 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, t => ({
    pk: primaryKey({ columns: [t.companyId, t.itemId] })
}));

export const payment = pgTable("payment", {
    id: text("id").primaryKey(),                // payment id (idempotency)
    companyId: text("company_id").references(() => company.id).notNull(),
    kind: text("kind").notNull(),               // 'AR' | 'AP'
    partyType: text("party_type").notNull(),    // 'Customer' | 'Supplier'
    partyId: text("party_id").notNull(),
    docDate: timestamp("doc_date", { withTimezone: true }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    journalId: text("journal_id")               // populated once posted
});

export const paymentAllocation = pgTable("payment_allocation", {
    id: text("id").primaryKey(),
    paymentId: text("payment_id").references(() => payment.id, { onDelete: "cascade" }).notNull(),
    applyDoctype: text("apply_doctype").notNull(), // 'SalesInvoice' | 'PurchaseInvoice'
    applyId: text("apply_id").notNull(),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull()
});

// --- Auth & Multi-Company --------------------------------------------------
export const appUser = pgTable("app_user", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const membership = pgTable("membership", {
    userId: text("user_id").references(() => appUser.id).notNull(),
    companyId: text("company_id").references(() => company.id).notNull(),
    role: text("role").notNull().default("admin") // 'admin' | 'member'
}, t => ({
    pk: primaryKey({ columns: [t.userId, t.companyId] })
}));

export const apiKey = pgTable("api_key", {
    id: text("id").primaryKey(),              // public id (prefix 'ak_...')
    userId: text("user_id").references(() => appUser.id).notNull(),
    companyId: text("company_id").references(() => company.id).notNull(),
    name: text("name").notNull(),
    hash: text("hash").notNull(),             // SHA256 of secret
    enabled: text("enabled").notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
