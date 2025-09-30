import { pgTable, text, char, timestamp, numeric, pgEnum, primaryKey } from "drizzle-orm/pg-core";
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

export const journal = pgTable("journal", {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => company.id).notNull(),
    postingDate: timestamp("posting_date", { withTimezone: true }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    sourceDoctype: text("source_doctype").notNull(),
    sourceId: text("source_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
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
