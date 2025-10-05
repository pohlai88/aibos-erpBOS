import { pgTable, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const taxPartner = pgTable("tax_partner", {
  companyId: text("company_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(), // 'M'|'Q'|'Y'
  baseCcy: text("base_ccy").notNull(),
});

export const taxReturnTemplate = pgTable("tax_return_template", {
  companyId: text("company_id").notNull(),
  partnerCode: text("partner_code").notNull(),
  version: text("version").notNull(),
  boxId: text("box_id").notNull(),
  boxLabel: text("box_label").notNull(),
  sign: text("sign").notNull(),
  ordinal: integer("ordinal").notNull(),
});

export const taxReturnBoxMap = pgTable("tax_return_box_map", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  partnerCode: text("partner_code").notNull(),
  version: text("version").notNull(),
  boxId: text("box_id").notNull(),
  taxCode: text("tax_code"),
  direction: text("direction"),
  rateName: text("rate_name"),
  accountLike: text("account_like"),
  ccLike: text("cc_like"),
  projectLike: text("project_like"),
  priority: integer("priority").notNull(),
});

export const taxReturnRun = pgTable("tax_return_run", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  partnerCode: text("partner_code").notNull(),
  version: text("version").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  periodKey: text("period_key").notNull(),
  mode: text("mode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

export const taxReturnLine = pgTable("tax_return_line", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  boxId: text("box_id").notNull(),
  amount: numeric("amount").notNull(),
  note: text("note"),
});

export const taxReturnDetail = pgTable("tax_return_detail", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  boxId: text("box_id").notNull(),
  sourceRef: text("source_ref"),
  amount: numeric("amount").notNull(),
});

export const taxReturnLock = pgTable("tax_return_lock", {
  companyId: text("company_id").notNull(),
  partnerCode: text("partner_code").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
});

export const taxReturnAdjustment = pgTable("tax_return_adjustment", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  partnerCode: text("partner_code").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  boxId: text("box_id").notNull(),
  amount: numeric("amount").notNull(),
  memo: text("memo"),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

export const taxReturnExport = pgTable("tax_return_export", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  format: text("format").notNull(),
  filename: text("filename").notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});

export const taxExportProfile = pgTable("tax_export_profile", {
  companyId: text("company_id").notNull(),
  partnerCode: text("partner_code").notNull(),
  version: text("version").notNull(),
  format: text("format").notNull(),
  isDefault: text("is_default").notNull().default("false"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull(),
});

export const taxCarryForward = pgTable("tax_carry_forward", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  partnerCode: text("partner_code").notNull(),
  fromYear: integer("from_year").notNull(),
  fromMonth: integer("from_month").notNull(),
  intoYear: integer("into_year").notNull(),
  intoMonth: integer("into_month").notNull(),
  sourceRef: text("source_ref").notNull(),
  boxId: text("box_id").notNull(),
  amount: numeric("amount").notNull(),
  reason: text("reason"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});