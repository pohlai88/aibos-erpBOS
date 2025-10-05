// M16.3: Asset Impairment Schema
// Drizzle schema for asset impairment tracking

import { pgTable, text, date, numeric, timestamp } from "drizzle-orm/pg-core";

export const assetImpairment = pgTable("asset_impairment", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    planKind: text("plan_kind").notNull(),  // 'capex'|'intangible'
    planId: text("plan_id").notNull(),
    date: date("date").notNull(),
    amount: numeric("amount").notNull(),
    memo: text("memo"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});
