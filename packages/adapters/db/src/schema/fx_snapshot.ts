// M16.4: FX Snapshot Schema
// Drizzle schema for FX rate snapshots for audit compliance

import { pgTable, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const fxSnapshot = pgTable("fx_snapshot", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    planKind: text("plan_kind").notNull(),
    planId: text("plan_id").notNull(),
    policy: text("policy").notNull(),
    year: integer("year"),
    month: integer("month"),
    rate: numeric("rate").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
