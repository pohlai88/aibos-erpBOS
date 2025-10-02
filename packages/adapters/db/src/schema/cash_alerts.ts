import { pgTable, text, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

export const cashAlertRule = pgTable("cash_alert_rule", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),            // "min_cash" | "max_burn" | "runway_months"
  thresholdNum: numeric("threshold_num").notNull(),
  filterCc: text("filter_cc"),
  filterProject: text("filter_project"),
  delivery: jsonb("delivery").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});
