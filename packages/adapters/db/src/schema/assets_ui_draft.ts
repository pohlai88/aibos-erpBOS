// M16.3: UI Drafts Schema
// Drizzle schema for preview cache for UI dry-run operations

import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const assetsUiDraft = pgTable("assets_ui_draft", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    kind: text("kind").notNull(),          // 'depr'|'amort'
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    payload: jsonb("payload").notNull(),   // dry-run summary blob
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
