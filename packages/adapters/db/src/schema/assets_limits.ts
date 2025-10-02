// M16.3: Assets Limits Schema
// Drizzle schema for import and bulk posting limits

import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const assetsLimits = pgTable("assets_limits", {
    companyId: text("company_id").primaryKey(),
    importMaxRows: integer("import_max_rows").notNull().default(10000),
    bulkPostMaxRows: integer("bulk_post_max_rows").notNull().default(5000),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
