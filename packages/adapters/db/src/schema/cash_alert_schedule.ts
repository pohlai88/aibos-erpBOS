import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const cashAlertSchedule = pgTable("cash_alert_schedule", {
    companyId: text("company_id").primaryKey(),
    enabled: boolean("enabled").notNull().default(true),
    hourLocal: integer("hour_local").notNull().default(8),
    minuteLocal: integer("minute_local").notNull().default(0),
    timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
    scenarioCode: text("scenario_code").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});
