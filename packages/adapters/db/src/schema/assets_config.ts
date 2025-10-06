// M16.3/M16.4: Assets Configuration Schema
// Drizzle schema for assets configuration and FX policy

import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const assetsConfig = pgTable('assets_config', {
  companyId: text('company_id').primaryKey(),
  prorationEnabled: boolean('proration_enabled').notNull().default(false),
  prorationBasis: text('proration_basis').notNull().default('days_in_month'),
  fxPresentationPolicy: text('fx_presentation_policy')
    .notNull()
    .default('post_month'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
