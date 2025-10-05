import { pgTable, index, text, timestamp, foreignKey, unique, char, numeric, date, uniqueIndex, integer, boolean, check, jsonb, serial, bigint, primaryKey, pgMaterializedView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const outbox = pgTable("outbox", {
	id: text().primaryKey().notNull(),
	topic: text().notNull(),
	payload: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_outbox_time").using("btree", table.createdAt.desc().nullsFirst().op("text_ops"), table.id.asc().nullsLast().op("text_ops")),
	index("idx_outbox_topic_time").using("btree", table.topic.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const journal = pgTable("journal", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	postingDate: timestamp("posting_date", { withTimezone: true, mode: 'string' }).notNull(),
	currency: char({ length: 3 }).notNull(),
	sourceDoctype: text("source_doctype").notNull(),
	sourceId: text("source_id").notNull(),
	idempotencyKey: text("idempotency_key").notNull(),
	isReversal: text("is_reversal").default('false').notNull(),
	reversesJournalId: text("reverses_journal_id"),
	autoReverseOn: timestamp("auto_reverse_on", { withTimezone: true, mode: 'string' }),
	baseCurrency: text("base_currency"),
	rateUsed: numeric("rate_used", { precision: 20, scale:  10 }),
}, (table) => [
	index("idx_journal_company_date").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.postingDate.desc().nullsFirst().op("text_ops"), table.id.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "journal_company_id_company_id_fk"
		}),
	unique("journal_idempotency_key_unique").on(table.idempotencyKey),
]);

export const item = pgTable("item", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	name: text().notNull(),
	uom: text().notNull(),
	taxGroupId: text("tax_group_id"),
}, (table) => [
	unique("item_code_unique").on(table.code),
]);

export const accountingPeriod = pgTable("accounting_period", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }).notNull(),
	status: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "accounting_period_company_id_company_id_fk"
		}),
]);

export const fxRate = pgTable("fx_rate", {
	id: text().primaryKey().notNull(),
	date: date().notNull(),
	fromCcy: text("from_ccy").notNull(),
	toCcy: text("to_ccy").notNull(),
	rate: numeric({ precision: 20, scale:  10 }).notNull(),
	source: text().default('manual'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_fx_date_pair").using("btree", table.date.desc().nullsFirst().op("date_ops"), table.fromCcy.asc().nullsLast().op("date_ops"), table.toCcy.asc().nullsLast().op("date_ops")),
]);

export const journalLine = pgTable("journal_line", {
	id: text().primaryKey().notNull(),
	journalId: text("journal_id").notNull(),
	accountCode: text("account_code").notNull(),
	dc: char({ length: 1 }).notNull(),
	amount: numeric({ precision: 20, scale:  6 }).notNull(),
	currency: char({ length: 3 }).notNull(),
	partyType: text("party_type"),
	partyId: text("party_id"),
	baseAmount: numeric("base_amount", { precision: 20, scale:  6 }),
	baseCurrency: text("base_currency"),
	txnAmount: numeric("txn_amount", { precision: 20, scale:  6 }),
	txnCurrency: text("txn_currency"),
	costCenterId: text("cost_center_id"),
	projectId: text("project_id"),
}, (table) => [
	index("idx_jl_cost_center").using("btree", table.costCenterId.asc().nullsLast().op("text_ops")),
	index("idx_jl_journal").using("btree", table.journalId.asc().nullsLast().op("text_ops")),
	index("idx_jl_party").using("btree", table.partyType.asc().nullsLast().op("text_ops"), table.partyId.asc().nullsLast().op("text_ops")),
	index("idx_jl_project").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.costCenterId],
			foreignColumns: [dimCostCenter.id],
			name: "journal_line_cost_center_id_dim_cost_center_id_fk"
		}),
	foreignKey({
			columns: [table.costCenterId],
			foreignColumns: [dimCostCenter.id],
			name: "journal_line_cost_center_id_fkey"
		}),
	foreignKey({
			columns: [table.journalId],
			foreignColumns: [journal.id],
			name: "journal_line_journal_id_journal_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [dimProject.id],
			name: "journal_line_project_id_dim_project_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [dimProject.id],
			name: "journal_line_project_id_fkey"
		}),
]);

export const glDimensionRoutes = pgTable("gl_dimension_routes", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	accountCode: text("account_code").notNull(),
	costCenterId: text("cost_center_id"),
	projectId: text("project_id"),
	priority: integer().default(100).notNull(),
	effectiveFrom: date("effective_from").default(sql`CURRENT_DATE`).notNull(),
	effectiveTo: date("effective_to"),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("ix_gl_dimension_routes_account").using("btree", table.accountCode.asc().nullsLast().op("text_ops")),
	index("ix_gl_dimension_routes_company").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("ix_gl_dimension_routes_priority").using("btree", table.priority.asc().nullsLast().op("int4_ops")),
	uniqueIndex("uq_gl_dimension_routes_active").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.accountCode.asc().nullsLast().op("text_ops")).where(sql`(active = true)`),
	foreignKey({
			columns: [table.costCenterId],
			foreignColumns: [dimCostCenter.id],
			name: "gl_dimension_routes_cost_center_id_fkey"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [dimProject.id],
			name: "gl_dimension_routes_project_id_fkey"
		}),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	normalBalance: char("normal_balance", { length: 1 }).notNull(),
	parentCode: text("parent_code"),
	defaultTaxCodeId: text("default_tax_code_id"),
	requireCostCenter: boolean("require_cost_center").default(false).notNull(),
	requireProject: boolean("require_project").default(false).notNull(),
	class: text(),
	cashEquivalent: boolean("cash_equivalent"),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "account_company_id_company_id_fk"
		}),
	check("account_class_check", sql`class = ANY (ARRAY['ASSET'::text, 'LIAB'::text, 'EQUITY'::text, 'REVENUE'::text, 'EXPENSE'::text])`),
]);

export const appUser = pgTable("app_user", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("app_user_email_unique").on(table.email),
]);

export const stockLedger = pgTable("stock_ledger", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	itemId: text("item_id").notNull(),
	moveId: text("move_id").notNull(),
	kind: text().notNull(),
	qty: numeric({ precision: 20, scale:  6 }).notNull(),
	unitCost: numeric("unit_cost", { precision: 20, scale:  6 }).notNull(),
	totalCost: numeric("total_cost", { precision: 20, scale:  6 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "stock_ledger_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [item.id],
			name: "stock_ledger_item_id_item_id_fk"
		}),
]);

export const taxCode = pgTable("tax_code", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	kind: text().notNull(),
	rate: numeric({ precision: 9, scale:  6 }).default('0').notNull(),
	rounding: text().default('half_up').notNull(),
	precision: integer().default(2).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("tax_code_kind_check", sql`kind = ANY (ARRAY['output'::text, 'input'::text, 'both'::text])`),
]);

export const taxGroup = pgTable("tax_group", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
});

export const company = pgTable("company", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	name: text().notNull(),
	currency: char({ length: 3 }).notNull(),
	baseCurrency: text("base_currency").default('MYR').notNull(),
	defaultOperatingCc: text("default_operating_cc"),
}, (table) => [
	foreignKey({
			columns: [table.defaultOperatingCc],
			foreignColumns: [dimCostCenter.id],
			name: "company_default_operating_cc_fkey"
		}),
	unique("company_code_unique").on(table.code),
]);

export const dimCostCenter = pgTable("dim_cost_center", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	parentId: text("parent_id"),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	code: text(),
	// TODO: failed to parse database type 'ltree'
	path: unknown("path"),
}, (table) => [
	index("dim_cost_center_path_gist").using("gist", table.path.asc().nullsLast().op("gist_ltree_ops")),
	index("idx_dim_cc_active").using("btree", table.active.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "dim_cost_center_parent_id_fkey"
		}),
]);

export const budgetLine = pgTable("budget_line", {
	id: text().primaryKey().notNull(),
	budgetId: text("budget_id").notNull(),
	companyId: text("company_id").notNull(),
	periodMonth: char("period_month", { length: 7 }).notNull(),
	accountCode: text("account_code").notNull(),
	costCenterId: text("cost_center_id"),
	projectId: text("project_id"),
	amountBase: numeric("amount_base", { precision: 20, scale:  6 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	importId: text("import_id"),
	versionId: text("version_id"),
}, (table) => [
	index("budget_line_account_idx").using("btree", table.accountCode.asc().nullsLast().op("text_ops")),
	index("budget_line_cc_idx").using("btree", table.costCenterId.asc().nullsLast().op("text_ops")),
	index("budget_line_company_period_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.periodMonth.asc().nullsLast().op("bpchar_ops")),
	index("budget_line_import_id_idx").using("btree", table.importId.asc().nullsLast().op("text_ops")),
	index("budget_line_project_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("budget_line_version_idx").using("btree", table.versionId.asc().nullsLast().op("text_ops"), table.companyId.asc().nullsLast().op("text_ops")),
	index("ix_bl_account").using("btree", table.accountCode.asc().nullsLast().op("text_ops")),
	index("ix_bl_cc").using("btree", table.costCenterId.asc().nullsLast().op("text_ops")),
	index("ix_bl_company_period").using("btree", table.companyId.asc().nullsLast().op("bpchar_ops"), table.periodMonth.asc().nullsLast().op("bpchar_ops")),
	index("ix_bl_project").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_budget_line_axis").using("btree", sql`budget_id`, sql`period_month`, sql`account_code`, sql`COALESCE(cost_center_id, ''::text)`, sql`COALESCE(project_id, ''::text)`),
	foreignKey({
			columns: [table.budgetId],
			foreignColumns: [budget.id],
			name: "budget_line_budget_id_budget_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.budgetId],
			foreignColumns: [budget.id],
			name: "budget_line_budget_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "budget_line_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.costCenterId],
			foreignColumns: [dimCostCenter.id],
			name: "budget_line_cost_center_id_dim_cost_center_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [dimProject.id],
			name: "budget_line_project_id_dim_project_id_fk"
		}),
	foreignKey({
			columns: [table.importId],
			foreignColumns: [budgetImport.id],
			name: "fk_budget_line_import"
		}).onDelete("set null"),
]);

export const payment = pgTable("payment", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	kind: text().notNull(),
	partyType: text("party_type").notNull(),
	partyId: text("party_id").notNull(),
	docDate: timestamp("doc_date", { withTimezone: true, mode: 'string' }).notNull(),
	currency: char({ length: 3 }).notNull(),
	amount: numeric({ precision: 20, scale:  2 }).notNull(),
	journalId: text("journal_id"),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "payment_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "payment_company_id_fkey"
		}),
]);

export const paymentAllocation = pgTable("payment_allocation", {
	id: text().primaryKey().notNull(),
	paymentId: text("payment_id").notNull(),
	applyDoctype: text("apply_doctype").notNull(),
	applyId: text("apply_id").notNull(),
	amount: numeric({ precision: 20, scale:  2 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payment.id],
			name: "payment_allocation_payment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payment.id],
			name: "payment_allocation_payment_id_payment_id_fk"
		}).onDelete("cascade"),
]);

export const taxRule = pgTable("tax_rule", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	taxCodeId: text("tax_code_id").notNull(),
	effectiveFrom: date("effective_from").notNull(),
	effectiveTo: date("effective_to"),
	overrideRate: numeric("override_rate", { precision: 9, scale:  6 }),
	jurisdiction: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tax_rule_company").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.effectiveFrom.desc().nullsFirst().op("date_ops")),
	foreignKey({
			columns: [table.taxCodeId],
			foreignColumns: [taxCode.id],
			name: "tax_rule_tax_code_id_fkey"
		}),
]);

export const dimProject = pgTable("dim_project", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_dim_project_active").using("btree", table.active.asc().nullsLast().op("bool_ops")),
]);

export const apiKey = pgTable("api_key", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	companyId: text("company_id").notNull(),
	name: text().notNull(),
	hash: text().notNull(),
	enabled: text().default('true').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	scopes: jsonb().default([]),
	prefix: text().default('ak'),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	rotatedAt: timestamp("rotated_at", { withTimezone: true, mode: 'string' }),
	createdByKeyId: text("created_by_key_id"),
}, (table) => [
	index("idx_api_key_last_used").using("btree", table.lastUsedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_api_key_user_company").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.companyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "api_key_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [appUser.id],
			name: "api_key_user_id_app_user_id_fk"
		}),
]);

export const webhook = pgTable("webhook", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	url: text().notNull(),
	secret: text().notNull(),
	topics: text().array().notNull(),
	enabled: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	disabledAt: timestamp("disabled_at", { withTimezone: true, mode: 'string' }),
	rotatedAt: timestamp("rotated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_webhook_company").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
]);

export const webhookAttempt = pgTable("webhook_attempt", {
	id: text().primaryKey().notNull(),
	webhookId: text("webhook_id").notNull(),
	eventId: text("event_id").notNull(),
	topic: text().notNull(),
	payload: jsonb().notNull(),
	status: text().notNull(),
	tryCount: integer("try_count").default(0).notNull(),
	nextTryAt: timestamp("next_try_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastError: text("last_error"),
	responseStatus: integer("response_status"),
	responseMs: integer("response_ms"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_attempt_next").using("btree", table.nextTryAt.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_attempt_webhook").using("btree", table.webhookId.asc().nullsLast().op("text_ops")),
]);

export const budget = pgTable("budget", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	name: text().notNull(),
	currency: text().notNull(),
	locked: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ix_budget_company").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "budget_company_id_company_id_fk"
		}),
]);

export const budgetImport = pgTable("budget_import", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	sourceName: text("source_name").notNull(),
	sourceHash: text("source_hash").notNull(),
	mappingJson: jsonb("mapping_json").notNull(),
	delimiter: text().default(',').notNull(),
	rowsTotal: integer("rows_total").default(0).notNull(),
	rowsValid: integer("rows_valid").default(0).notNull(),
	rowsInvalid: integer("rows_invalid").default(0).notNull(),
	status: text().default('pending').notNull(),
	errorReport: jsonb("error_report"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdByKey: text("created_by_key").notNull(),
}, (table) => [
	index("budget_import_company_hash_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.sourceHash.asc().nullsLast().op("text_ops")),
	uniqueIndex("budget_import_company_hash_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.sourceHash.asc().nullsLast().op("text_ops")),
	index("budget_import_company_status").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("budget_import_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("budget_line_import_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("budget_line_import_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
]);

export const journalEntries = pgTable("journal_entries", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	date: date().notNull(),
	memo: text(),
	tags: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "journal_entries_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "journal_entries_company_id_fkey"
		}),
]);

export const journalLines = pgTable("journal_lines", {
	id: text().primaryKey().notNull(),
	journalId: text("journal_id").notNull(),
	accountId: text("account_id").notNull(),
	debit: numeric().default('0').notNull(),
	credit: numeric().default('0').notNull(),
	description: text(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [account.id],
			name: "journal_lines_account_id_account_id_fk"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [account.id],
			name: "journal_lines_account_id_fkey"
		}),
	foreignKey({
			columns: [table.journalId],
			foreignColumns: [journalEntries.id],
			name: "journal_lines_journal_id_fkey"
		}),
	foreignKey({
			columns: [table.journalId],
			foreignColumns: [journalEntries.id],
			name: "journal_lines_journal_id_journal_entries_id_fk"
		}),
]);

export const allocRule = pgTable("alloc_rule", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	name: text().notNull(),
	active: boolean().default(true).notNull(),
	method: text().notNull(),
	driverCode: text("driver_code"),
	ratePerUnit: numeric("rate_per_unit"),
	srcAccount: text("src_account"),
	srcCcLike: text("src_cc_like"),
	srcProject: text("src_project"),
	effFrom: date("eff_from"),
	effTo: date("eff_to"),
	orderNo: integer("order_no").default(1).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("alloc_rule_active_order_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.active.asc().nullsLast().op("int4_ops"), table.orderNo.asc().nullsLast().op("bool_ops")),
	uniqueIndex("alloc_rule_company_code_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	check("alloc_rule_method_check", sql`method = ANY (ARRAY['PERCENT'::text, 'RATE_PER_UNIT'::text, 'DRIVER_SHARE'::text])`),
]);

export const allocRun = pgTable("alloc_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	mode: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("alloc_run_mode_check", sql`mode = ANY (ARRAY['dry_run'::text, 'commit'::text])`),
	check("alloc_run_month_check", sql`(month >= 1) AND (month <= 12)`),
]);

export const allocLine = pgTable("alloc_line", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	ruleId: text("rule_id").notNull(),
	srcAccount: text("src_account"),
	srcCc: text("src_cc"),
	targetCc: text("target_cc").notNull(),
	amountBase: numeric("amount_base").notNull(),
	driverCode: text("driver_code"),
	driverValue: numeric("driver_value"),
	method: text().notNull(),
	note: text(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [allocRun.id],
			name: "alloc_line_run_id_fkey"
		}).onDelete("cascade"),
]);

export const allocImportAudit = pgTable("alloc_import_audit", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	kind: text().notNull(),
	filename: text(),
	rowsOk: integer("rows_ok").notNull(),
	rowsErr: integer("rows_err").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("alloc_import_audit_kind_check", sql`kind = ANY (ARRAY['RULES'::text, 'DRIVERS'::text])`),
]);

export const fxRevalRun = pgTable("fx_reval_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	mode: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("fx_reval_run_mode_check", sql`mode = ANY (ARRAY['dry_run'::text, 'commit'::text])`),
	check("fx_reval_run_month_check", sql`(month >= 1) AND (month <= 12)`),
]);

export const fxRevalLine = pgTable("fx_reval_line", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	glAccount: text("gl_account").notNull(),
	currency: text().notNull(),
	balanceBase: numeric("balance_base").notNull(),
	balanceSrc: numeric("balance_src").notNull(),
	rateOld: numeric("rate_old").notNull(),
	rateNew: numeric("rate_new").notNull(),
	deltaBase: numeric("delta_base").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [fxRevalRun.id],
			name: "fx_reval_line_run_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [fxRevalRun.id],
			name: "fx_reval_line_run_id_fx_reval_run_id_fk"
		}),
]);

export const taxReturnBoxMap = pgTable("tax_return_box_map", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	partnerCode: text("partner_code").notNull(),
	version: text().notNull(),
	boxId: text("box_id").notNull(),
	taxCode: text("tax_code"),
	direction: text(),
	rateName: text("rate_name"),
	accountLike: text("account_like"),
	ccLike: text("cc_like"),
	projectLike: text("project_like"),
	priority: integer().default(1).notNull(),
}, (table) => [
	index("tax_box_map_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.partnerCode.asc().nullsLast().op("int4_ops"), table.version.asc().nullsLast().op("text_ops"), table.boxId.asc().nullsLast().op("int4_ops"), table.priority.asc().nullsLast().op("text_ops")),
]);

export const taxReturnRun = pgTable("tax_return_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	partnerCode: text("partner_code").notNull(),
	version: text().notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	periodKey: text("period_key").notNull(),
	mode: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("tax_run_period_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.partnerCode.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("int4_ops")),
	check("tax_return_run_mode_check", sql`mode = ANY (ARRAY['dry_run'::text, 'commit'::text])`),
	check("tax_return_run_month_check", sql`(month >= 1) AND (month <= 12)`),
]);

export const taxReturnLine = pgTable("tax_return_line", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	boxId: text("box_id").notNull(),
	amount: numeric().notNull(),
	note: text(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [taxReturnRun.id],
			name: "tax_return_line_run_id_fkey"
		}).onDelete("cascade"),
]);

export const taxReturnDetail = pgTable("tax_return_detail", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	boxId: text("box_id").notNull(),
	sourceRef: text("source_ref"),
	amount: numeric().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [taxReturnRun.id],
			name: "tax_return_detail_run_id_fkey"
		}).onDelete("cascade"),
]);

export const taxReturnAdjustment = pgTable("tax_return_adjustment", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	partnerCode: text("partner_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	boxId: text("box_id").notNull(),
	amount: numeric().notNull(),
	memo: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
});

export const taxReturnExport = pgTable("tax_return_export", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	format: text().notNull(),
	filename: text().notNull(),
	payload: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [taxReturnRun.id],
			name: "tax_return_export_run_id_fkey"
		}).onDelete("cascade"),
]);

export const taxCarryForward = pgTable("tax_carry_forward", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	partnerCode: text("partner_code").notNull(),
	fromYear: integer("from_year").notNull(),
	fromMonth: integer("from_month").notNull(),
	intoYear: integer("into_year").notNull(),
	intoMonth: integer("into_month").notNull(),
	sourceRef: text("source_ref").notNull(),
	boxId: text("box_id").notNull(),
	amount: numeric().notNull(),
	reason: text(),
	status: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	uniqueIndex("tax_carry_forward_uk").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.partnerCode.asc().nullsLast().op("int4_ops"), table.fromYear.asc().nullsLast().op("int4_ops"), table.fromMonth.asc().nullsLast().op("int4_ops"), table.sourceRef.asc().nullsLast().op("int4_ops")),
	check("tax_carry_forward_status_check", sql`status = ANY (ARRAY['proposed'::text, 'accepted'::text, 'rejected'::text, 'applied'::text])`),
]);

export const consolCtaPolicy = pgTable("consol_cta_policy", {
	companyId: text("company_id").primaryKey().notNull(),
	ctaAccount: text("cta_account").notNull(),
	reAccount: text("re_account").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
});

export const consolNciMap = pgTable("consol_nci_map", {
	companyId: text("company_id").primaryKey().notNull(),
	nciEquityAccount: text("nci_equity_account").notNull(),
	nciNiAccount: text("nci_ni_account").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
});

export const consolLedgerOption = pgTable("consol_ledger_option", {
	companyId: text("company_id").primaryKey().notNull(),
	enabled: boolean().default(false).notNull(),
	ledgerEntity: text("ledger_entity"),
	summaryAccount: text("summary_account"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
});

export const icMatchProposal = pgTable("ic_match_proposal", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	score: numeric().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const icMatchProposalLine = pgTable("ic_match_proposal_line", {
	id: text().primaryKey().notNull(),
	proposalId: text("proposal_id").notNull(),
	icLinkId: text("ic_link_id").notNull(),
	hint: text(),
}, (table) => [
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [icMatchProposal.id],
			name: "ic_match_proposal_line_proposal_id_fkey"
		}).onDelete("cascade"),
]);

export const icWorkbenchDecision = pgTable("ic_workbench_decision", {
	id: text().primaryKey().notNull(),
	proposalId: text("proposal_id").notNull(),
	decidedBy: text("decided_by").notNull(),
	decision: text().notNull(),
	reason: text(),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [icMatchProposal.id],
			name: "ic_workbench_decision_proposal_id_fkey"
		}).onDelete("cascade"),
	check("ic_workbench_decision_decision_check", sql`decision = ANY (ARRAY['accept'::text, 'reject'::text, 'split'::text])`),
]);

export const cfDriverWeek = pgTable("cf_driver_week", {
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	isoWeek: integer("iso_week").notNull(),
	driverCode: text("driver_code").notNull(),
	costCenter: text("cost_center"),
	project: text(),
	amount: numeric().notNull(),
	scenario: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("cf_driver_week_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops"), table.isoWeek.asc().nullsLast().op("int4_ops"), table.driverCode.asc().nullsLast().op("int4_ops")),
	check("cf_driver_week_iso_week_check", sql`(iso_week >= 1) AND (iso_week <= 53)`),
]);

export const cfAdjustWeek = pgTable("cf_adjust_week", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	isoWeek: integer("iso_week").notNull(),
	bucket: text().notNull(),
	memo: text(),
	amount: numeric().notNull(),
	scenario: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("cf_adjust_week_bucket_check", sql`bucket = ANY (ARRAY['RECEIPTS'::text, 'PAYMENTS'::text])`),
]);

export const bankTxnImport = pgTable("bank_txn_import", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	acctCode: text("acct_code").notNull(),
	txnDate: date("txn_date").notNull(),
	amount: numeric().notNull(),
	memo: text(),
	source: text(),
	importedAt: timestamp("imported_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	uniqHash: text("uniq_hash").notNull(),
}, (table) => [
	index("bank_txn_import_date_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.acctCode.asc().nullsLast().op("text_ops"), table.txnDate.asc().nullsLast().op("text_ops")),
	uniqueIndex("bank_txn_import_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.acctCode.asc().nullsLast().op("text_ops"), table.uniqHash.asc().nullsLast().op("text_ops")),
]);

export const cfRun = pgTable("cf_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	scope: text().notNull(),
	year: integer().notNull(),
	month: integer(),
	startDate: date("start_date"),
	mode: text().notNull(),
	presentCcy: text("present_ccy"),
	scenario: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("cf_run_mode_check", sql`mode = ANY (ARRAY['dry_run'::text, 'commit'::text])`),
	check("cf_run_scope_check", sql`scope = ANY (ARRAY['INDIRECT'::text, 'DIRECT13'::text])`),
]);

export const cfLine = pgTable("cf_line", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	label: text().notNull(),
	period: text().notNull(),
	amount: numeric().notNull(),
	note: text(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [cfRun.id],
			name: "cf_line_run_id_fkey"
		}).onDelete("cascade"),
]);

export const apPayLine = pgTable("ap_pay_line", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	invoiceId: text("invoice_id").notNull(),
	dueDate: date("due_date").notNull(),
	grossAmount: numeric("gross_amount").notNull(),
	discAmount: numeric("disc_amount").default('0').notNull(),
	payAmount: numeric("pay_amount").notNull(),
	invCcy: text("inv_ccy").notNull(),
	payCcy: text("pay_ccy").notNull(),
	fxRate: numeric("fx_rate"),
	bankRef: text("bank_ref"),
	status: text().notNull(),
	note: text(),
}, (table) => [
	index("ap_line_supplier_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.supplierId.asc().nullsLast().op("text_ops")),
	uniqueIndex("ap_pay_line_uk").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.invoiceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [apPayRun.id],
			name: "ap_pay_line_run_id_fkey"
		}).onDelete("cascade"),
	check("ap_pay_line_status_check", sql`status = ANY (ARRAY['selected'::text, 'held'::text, 'paid'::text, 'failed'::text])`),
]);

export const apVendorToken = pgTable("ap_vendor_token", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const apPayExport = pgTable("ap_pay_export", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	format: text().notNull(),
	filename: text().notNull(),
	payload: text().notNull(),
	checksum: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [apPayRun.id],
			name: "ap_pay_export_run_id_fkey"
		}).onDelete("cascade"),
]);

export const apRemittance = pgTable("ap_remittance", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	address: text(),
	status: text().notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	response: text(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [apPayRun.id],
			name: "ap_remittance_run_id_fkey"
		}).onDelete("cascade"),
	check("ap_remittance_status_check", sql`status = ANY (ARRAY['queued'::text, 'sent'::text, 'failed'::text])`),
]);

export const bankFileImport = pgTable("bank_file_import", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	kind: text().notNull(),
	filename: text().notNull(),
	payload: text().notNull(),
	importedAt: timestamp("imported_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	uniqHash: text("uniq_hash").notNull(),
}, (table) => [
	uniqueIndex("bank_file_import_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.uniqHash.asc().nullsLast().op("text_ops")),
	check("bank_file_import_kind_check", sql`kind = ANY (ARRAY['CAMT053'::text, 'CSV'::text])`),
]);

export const bankTxnMap = pgTable("bank_txn_map", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	bankDate: date("bank_date").notNull(),
	amount: numeric().notNull(),
	ccy: text().notNull(),
	counterparty: text(),
	memo: text(),
	matchedRunId: text("matched_run_id"),
	matchedLineId: text("matched_line_id"),
	status: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("bank_txn_map_status_check", sql`status = ANY (ARRAY['unmatched'::text, 'matched'::text, 'partial'::text])`),
]);

export const apPaymentPost = pgTable("ap_payment_post", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	feeAmount: numeric("fee_amount").default('0').notNull(),
	feeAccount: text("fee_account"),
	realizedFx: numeric("realized_fx").default('0').notNull(),
	realizedFxAccount: text("realized_fx_account"),
	postedAt: timestamp("posted_at", { withTimezone: true, mode: 'string' }),
	journalId: text("journal_id"),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [apPayRun.id],
			name: "ap_payment_post_run_id_fkey"
		}).onDelete("cascade"),
]);

export const apPayRun = pgTable("ap_pay_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	status: text().notNull(),
	ccy: text().notNull(),
	presentCcy: text("present_ccy"),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	approvedBy: text("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: 'string' }),
	failedReason: text("failed_reason"),
}, (table) => [
	index("ap_run_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	check("ap_pay_run_status_check", sql`status = ANY (ARRAY['draft'::text, 'approved'::text, 'exported'::text, 'executed'::text, 'failed'::text, 'cancelled'::text])`),
]);

export const apRunApproval = pgTable("ap_run_approval", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	step: text().notNull(),
	actor: text().notNull(),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	decision: text().notNull(),
	reason: text(),
}, (table) => [
	index("ap_run_approval_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.step.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [apPayRun.id],
			name: "ap_run_approval_run_id_fkey"
		}).onDelete("cascade"),
	check("ap_run_approval_decision_check", sql`decision = ANY (ARRAY['approve'::text, 'reject'::text])`),
	check("ap_run_approval_step_check", sql`step = ANY (ARRAY['review'::text, 'approve'::text, 'approve2'::text, 'execute'::text])`),
]);

export const sanctionDenylist = pgTable("sanction_denylist", {
	companyId: text("company_id").notNull(),
	nameNorm: text("name_norm").notNull(),
	country: text(),
	source: text(),
	listedAt: timestamp("listed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("sanction_denylist_pk").using("btree", sql`company_id`, sql`name_norm`, sql`COALESCE(country, ''::text)`),
]);

export const sanctionScreenRun = pgTable("sanction_screen_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	runId: text("run_id"),
	supplierId: text("supplier_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
});

export const sanctionHit = pgTable("sanction_hit", {
	id: text().primaryKey().notNull(),
	screenId: text("screen_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	nameNorm: text("name_norm").notNull(),
	matchScore: numeric("match_score").notNull(),
	source: text().notNull(),
	status: text().notNull(),
	decidedBy: text("decided_by"),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }),
	reason: text(),
}, (table) => [
	index("sanction_hit_supplier_idx").using("btree", table.supplierId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.screenId],
			foreignColumns: [sanctionScreenRun.id],
			name: "sanction_hit_screen_id_fkey"
		}).onDelete("cascade"),
	check("sanction_hit_status_check", sql`status = ANY (ARRAY['potential'::text, 'cleared'::text, 'blocked'::text])`),
]);

export const bankInboxAudit = pgTable("bank_inbox_audit", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	bankCode: text("bank_code").notNull(),
	channel: text().notNull(),
	filename: text().notNull(),
	uniqHash: text("uniq_hash").notNull(),
	storedAt: timestamp("stored_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("bank_inbox_audit_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.bankCode.asc().nullsLast().op("text_ops"), table.uniqHash.asc().nullsLast().op("text_ops")),
	check("bank_inbox_audit_channel_check", sql`channel = ANY (ARRAY['pain002'::text, 'camt054'::text])`),
]);

export const bankJobLog = pgTable("bank_job_log", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	bankCode: text("bank_code").notNull(),
	kind: text().notNull(),
	detail: text().notNull(),
	payload: text(),
	success: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("bank_job_log_kind_idx").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.kind.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	check("bank_job_log_kind_check", sql`kind = ANY (ARRAY['DISPATCH'::text, 'FETCH'::text])`),
]);

export const bankAck = pgTable("bank_ack", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	bankCode: text("bank_code").notNull(),
	ackKind: text("ack_kind").notNull(),
	filename: text().notNull(),
	payload: text().notNull(),
	uniqHash: text("uniq_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("bank_ack_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.bankCode.asc().nullsLast().op("text_ops"), table.uniqHash.asc().nullsLast().op("text_ops")),
	check("bank_ack_ack_kind_check", sql`ack_kind = ANY (ARRAY['pain002'::text, 'camt054'::text])`),
]);

export const bankAckMap = pgTable("bank_ack_map", {
	id: text().primaryKey().notNull(),
	ackId: text("ack_id").notNull(),
	runId: text("run_id"),
	lineId: text("line_id"),
	status: text().notNull(),
	reasonCode: text("reason_code"),
	reasonLabel: text("reason_label"),
}, (table) => [
	index("bank_ack_map_run_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ackId],
			foreignColumns: [bankAck.id],
			name: "bank_ack_map_ack_id_fkey"
		}).onDelete("cascade"),
	check("bank_ack_map_status_check", sql`status = ANY (ARRAY['ack'::text, 'exec_ok'::text, 'exec_fail'::text, 'partial'::text])`),
]);

export const secretRef = pgTable("secret_ref", {
	name: text().primaryKey().notNull(),
	note: text(),
});

export const bankOutbox = pgTable("bank_outbox", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	runId: text("run_id").notNull(),
	bankCode: text("bank_code").notNull(),
	filename: text().notNull(),
	payload: text().notNull(),
	checksum: text().notNull(),
	status: text().notNull(),
	attempts: integer().default(0).notNull(),
	lastError: text("last_error"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	businessKey: text("business_key"),
}, (table) => [
	uniqueIndex("bank_outbox_idem_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.businessKey.asc().nullsLast().op("text_ops")).where(sql`(business_key IS NOT NULL)`),
	index("bank_outbox_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.bankCode.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	check("bank_outbox_status_check", sql`status = ANY (ARRAY['queued'::text, 'sent'::text, 'error'::text, 'ignored'::text])`),
]);

export const icElimRun = pgTable("ic_elim_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	mode: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("ic_elim_run_mode_check", sql`mode = ANY (ARRAY['dry_run'::text, 'commit'::text])`),
]);

export const icElimLine = pgTable("ic_elim_line", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	entityCode: text("entity_code").notNull(),
	cpCode: text("cp_code").notNull(),
	amountBase: numeric("amount_base").notNull(),
	note: text(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [icElimRun.id],
			name: "ic_elim_line_run_id_fkey"
		}).onDelete("cascade"),
]);

export const icMatch = pgTable("ic_match", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	tolerance: numeric().default('0.01').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
});

export const icMatchLine = pgTable("ic_match_line", {
	id: text().primaryKey().notNull(),
	matchId: text("match_id").notNull(),
	icLinkId: text("ic_link_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.icLinkId],
			foreignColumns: [icLink.id],
			name: "ic_match_line_ic_link_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [icMatch.id],
			name: "ic_match_line_match_id_fkey"
		}).onDelete("cascade"),
]);

export const icLink = pgTable("ic_link", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	entityCode: text("entity_code").notNull(),
	coEntityCp: text("co_entity_cp").notNull(),
	sourceType: text("source_type").notNull(),
	sourceId: text("source_id").notNull(),
	extRef: text("ext_ref"),
	amountBase: numeric("amount_base").notNull(),
	postedAt: timestamp("posted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ic_link_entity_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.entityCode.asc().nullsLast().op("text_ops"), table.coEntityCp.asc().nullsLast().op("text_ops")),
]);

export const consolRun = pgTable("consol_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	mode: text().notNull(),
	presentCcy: text("present_ccy").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("consol_run_mode_check", sql`mode = ANY (ARRAY['dry_run'::text, 'commit'::text])`),
]);

export const consolSummary = pgTable("consol_summary", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	component: text().notNull(),
	label: text().notNull(),
	amount: numeric().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [consolRun.id],
			name: "consol_summary_run_id_fkey"
		}).onDelete("cascade"),
]);

export const assetsUiDraft = pgTable("assets_ui_draft", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	kind: text().notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	payload: jsonb().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("assets_ui_draft_company_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.kind.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("int4_ops")),
	index("assets_ui_draft_exp").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("assets_ui_draft_unique").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.kind.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("int4_ops")),
	check("check_draft_kind", sql`kind = ANY (ARRAY['depr'::text, 'amort'::text])`),
	check("check_draft_month", sql`(month >= 1) AND (month <= 12)`),
	check("check_draft_year", sql`(year >= 1900) AND (year <= 2100)`),
]);

export const assetClassRef = pgTable("asset_class_ref", {
	code: text().primaryKey().notNull(),
	label: text().notNull(),
	method: text().notNull(),
	defaultLifeM: integer("default_life_m").notNull(),
	residualPct: numeric("residual_pct").default('0').notNull(),
});

export const amortSchedule = pgTable("amort_schedule", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	planId: text("plan_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	currency: text().notNull(),
	presentCcy: text("present_ccy").notNull(),
	amount: numeric().notNull(),
	bookedFlag: boolean("booked_flag").default(false).notNull(),
	bookedJournalId: text("booked_journal_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	postedTs: timestamp("posted_ts", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("amort_schedule_booked_idx").using("btree", table.bookedFlag.asc().nullsLast().op("bool_ops")),
	index("amort_schedule_company_period_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("text_ops")),
	index("amort_schedule_journal_idx").using("btree", table.bookedJournalId.asc().nullsLast().op("text_ops")),
	index("amort_schedule_plan_idx").using("btree", table.planId.asc().nullsLast().op("text_ops")),
	index("amort_schedule_posted_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.postedTs.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("amort_schedule_unique").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.planId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("text_ops")),
]);

export const assetsConfig = pgTable("assets_config", {
	companyId: text("company_id").primaryKey().notNull(),
	prorationEnabled: boolean("proration_enabled").default(false).notNull(),
	prorationBasis: text("proration_basis").default('days_in_month').notNull(),
	fxPresentationPolicy: text("fx_presentation_policy").default('post_month').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("check_fx_policy", sql`fx_presentation_policy = ANY (ARRAY['post_month'::text, 'in_service'::text])`),
	check("check_proration_basis", sql`proration_basis = ANY (ARRAY['days_in_month'::text, 'half_month'::text])`),
]);

export const assetsLimits = pgTable("assets_limits", {
	companyId: text("company_id").primaryKey().notNull(),
	importMaxRows: integer("import_max_rows").default(10000).notNull(),
	bulkPostMaxRows: integer("bulk_post_max_rows").default(5000).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("check_bulk_post_max_rows", sql`(bulk_post_max_rows > 0) AND (bulk_post_max_rows <= 50000)`),
	check("check_import_max_rows", sql`(import_max_rows > 0) AND (import_max_rows <= 100000)`),
]);

export const budgetApproval = pgTable("budget_approval", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	versionId: text("version_id").notNull(),
	action: text().notNull(),
	actor: text().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("budget_approval_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("budget_approval_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("budget_approval_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("budget_approval_version_idx").using("btree", table.versionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "budget_approval_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.versionId],
			foreignColumns: [budgetVersion.id],
			name: "budget_approval_version_id_budget_version_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.versionId],
			foreignColumns: [budgetVersion.id],
			name: "fk_budget_approval_version"
		}).onDelete("cascade"),
]);

export const budgetAlertRule = pgTable("budget_alert_rule", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	name: text().notNull(),
	accountCode: text("account_code"),
	costCenter: text("cost_center"),
	project: text(),
	periodScope: text("period_scope").notNull(),
	thresholdPct: numeric("threshold_pct", { precision: 5, scale:  2 }).notNull(),
	comparator: text().notNull(),
	delivery: jsonb().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("budget_alert_rule_account_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.accountCode.asc().nullsLast().op("text_ops")),
	index("budget_alert_rule_active_idx").using("btree", table.companyId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	index("budget_alert_rule_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("budget_alert_rule_scope_idx").using("btree", table.periodScope.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "budget_alert_rule_company_id_company_id_fk"
		}),
	check("chk_budget_alert_comparator", sql`comparator = ANY (ARRAY['gt'::text, 'lt'::text, 'gte'::text, 'lte'::text, 'abs_gt'::text, 'abs_gte'::text])`),
	check("chk_budget_alert_period_scope", sql`period_scope = ANY (ARRAY['month'::text, 'qtr'::text, 'ytd'::text])`),
	check("chk_budget_alert_threshold", sql`(threshold_pct > (0)::numeric) AND (threshold_pct <= (1000)::numeric)`),
]);

export const assetImpairment = pgTable("asset_impairment", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	planKind: text("plan_kind").notNull(),
	planId: text("plan_id").notNull(),
	date: date().notNull(),
	amount: numeric().notNull(),
	memo: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("asset_impairment_company_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("asset_impairment_plan_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.planKind.asc().nullsLast().op("text_ops"), table.planId.asc().nullsLast().op("text_ops")),
	check("check_plan_kind", sql`plan_kind = ANY (ARRAY['capex'::text, 'intangible'::text])`),
]);

export const cashAlertRule = pgTable("cash_alert_rule", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	name: text().notNull(),
	type: text().notNull(),
	thresholdNum: numeric("threshold_num").notNull(),
	filterCc: text("filter_cc"),
	filterProject: text("filter_project"),
	delivery: jsonb().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("cash_alert_rule_active_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops"), table.type.asc().nullsLast().op("bool_ops")),
	index("cash_alert_rule_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "cash_alert_rule_company_id_company_id_fk"
		}),
]);

export const capexPlan = pgTable("capex_plan", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	assetClass: text("asset_class").notNull(),
	description: text().notNull(),
	capexAmount: numeric("capex_amount").notNull(),
	currency: text().notNull(),
	presentCcy: text("present_ccy").notNull(),
	inService: date("in_service").notNull(),
	lifeM: integer("life_m"),
	method: text(),
	costCenter: text("cost_center"),
	project: text(),
	sourceHash: text("source_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("capex_plan_asset_class_idx").using("btree", table.assetClass.asc().nullsLast().op("text_ops")),
	index("capex_plan_company_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.inService.asc().nullsLast().op("date_ops")),
	index("capex_plan_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("capex_plan_source_hash_idx").using("btree", table.sourceHash.asc().nullsLast().op("text_ops")),
]);

export const cashForecastVersion = pgTable("cash_forecast_version", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	label: text().notNull(),
	year: integer().notNull(),
	status: text().default('draft').notNull(),
	profileId: text("profile_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	uniqueIndex("cash_version_company_code_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	index("cash_version_company_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops"), table.updatedAt.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "cash_forecast_version_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [wcProfile.id],
			name: "cash_forecast_version_profile_id_wc_profile_id_fk"
		}),
]);

export const cashAlertSchedule = pgTable("cash_alert_schedule", {
	companyId: text("company_id").primaryKey().notNull(),
	enabled: boolean().default(true).notNull(),
	hourLocal: integer("hour_local").default(8).notNull(),
	minuteLocal: integer("minute_local").default(0).notNull(),
	timezone: text().default('Asia/Ho_Chi_Minh').notNull(),
	scenarioCode: text("scenario_code").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("cash_alert_schedule_enabled_idx").using("btree", table.enabled.asc().nullsLast().op("bool_ops")),
	index("cash_alert_schedule_timezone_idx").using("btree", table.timezone.asc().nullsLast().op("text_ops")),
]);

export const cashLine = pgTable("cash_line", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	versionId: text("version_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	currency: text().notNull(),
	presentCcy: text("present_ccy").notNull(),
	cashIn: numeric("cash_in").default('0').notNull(),
	cashOut: numeric("cash_out").default('0').notNull(),
	netChange: numeric("net_change").default('0').notNull(),
	costCenter: text("cost_center"),
	project: text(),
	sourceHash: text("source_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cash_line_cc_proj_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.costCenter.asc().nullsLast().op("text_ops"), table.project.asc().nullsLast().op("text_ops")),
	index("cash_line_company_period_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("int4_ops")),
	index("cash_line_evaluation_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.versionId.asc().nullsLast().op("text_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("text_ops"), table.netChange.asc().nullsLast().op("int4_ops"), table.costCenter.asc().nullsLast().op("text_ops"), table.project.asc().nullsLast().op("int4_ops"), table.currency.asc().nullsLast().op("text_ops"), table.presentCcy.asc().nullsLast().op("text_ops")),
	index("cash_line_version_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.versionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "cash_line_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.versionId],
			foreignColumns: [cashForecastVersion.id],
			name: "cash_line_version_id_cash_forecast_version_id_fk"
		}).onDelete("cascade"),
]);

export const driverProfile = pgTable("driver_profile", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	name: text().notNull(),
	description: text(),
	formulaJson: jsonb("formula_json").notNull(),
	seasonalityJson: jsonb("seasonality_json").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("driver_profile_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	uniqueIndex("driver_profile_company_name_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "driver_profile_company_id_company_id_fk"
		}),
]);

export const forecastLine = pgTable("forecast_line", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	versionId: text("version_id").notNull(),
	accountCode: text("account_code").notNull(),
	costCenterCode: text("cost_center_code"),
	projectCode: text("project_code"),
	month: integer().notNull(),
	amount: numeric({ precision: 20, scale:  2 }).notNull(),
	currency: char({ length: 3 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("forecast_line_account_idx").using("btree", table.accountCode.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("text_ops")),
	index("forecast_line_company_month_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("int4_ops")),
	index("forecast_line_version_idx").using("btree", table.versionId.asc().nullsLast().op("text_ops"), table.companyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "forecast_line_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.versionId],
			foreignColumns: [forecastVersion.id],
			name: "forecast_line_version_id_forecast_version_id_fk"
		}).onDelete("cascade"),
]);

export const forecastVersion = pgTable("forecast_version", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	label: text().notNull(),
	year: integer().notNull(),
	driverProfileId: text("driver_profile_id"),
	status: text().default('draft').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	uniqueIndex("forecast_version_company_code_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	index("forecast_version_company_year_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "forecast_version_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.driverProfileId],
			foreignColumns: [driverProfile.id],
			name: "forecast_version_driver_profile_id_driver_profile_id_fk"
		}),
]);

export const deprSchedule = pgTable("depr_schedule", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	planId: text("plan_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	currency: text().notNull(),
	presentCcy: text("present_ccy").notNull(),
	amount: numeric().notNull(),
	bookedFlag: boolean("booked_flag").default(false).notNull(),
	bookedJournalId: text("booked_journal_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	postedTs: timestamp("posted_ts", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("depr_schedule_booked_idx").using("btree", table.bookedFlag.asc().nullsLast().op("bool_ops")),
	index("depr_schedule_company_period_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("text_ops")),
	index("depr_schedule_journal_idx").using("btree", table.bookedJournalId.asc().nullsLast().op("text_ops")),
	index("depr_schedule_plan_idx").using("btree", table.planId.asc().nullsLast().op("text_ops")),
	index("depr_schedule_posted_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.postedTs.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("depr_schedule_unique").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.planId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("text_ops")),
]);

export const fxSnapshot = pgTable("fx_snapshot", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	planKind: text("plan_kind").notNull(),
	planId: text("plan_id").notNull(),
	policy: text().notNull(),
	year: integer(),
	month: integer(),
	rate: numeric().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fx_snapshot_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.planKind.asc().nullsLast().op("text_ops"), table.planId.asc().nullsLast().op("text_ops")),
	index("fx_snapshot_policy_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.policy.asc().nullsLast().op("text_ops")),
	uniqueIndex("fx_unique_once").using("btree", sql`company_id`, sql`plan_kind`, sql`plan_id`, sql`COALESCE(year, 0)`, sql`COALESCE(month, 0)`, sql`policy`),
	check("check_fx_plan_kind", sql`plan_kind = ANY (ARRAY['capex'::text, 'intangible'::text])`),
	check("check_fx_policy", sql`policy = ANY (ARRAY['post_month'::text, 'in_service'::text])`),
]);

export const budgetVersion = pgTable("budget_version", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	label: text().notNull(),
	year: integer().notNull(),
	isBaseline: boolean("is_baseline").default(false).notNull(),
	status: text().default('draft').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("budget_version_baseline_idx").using("btree", table.companyId.asc().nullsLast().op("bool_ops"), table.isBaseline.asc().nullsLast().op("text_ops")),
	uniqueIndex("budget_version_company_code_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	index("budget_version_company_year_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.year.asc().nullsLast().op("text_ops")),
	index("budget_version_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "budget_version_company_id_company_id_fk"
		}),
]);

export const intangiblePlan = pgTable("intangible_plan", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	class: text().notNull(),
	description: text().notNull(),
	amount: numeric().notNull(),
	currency: text().notNull(),
	presentCcy: text("present_ccy").notNull(),
	inService: date("in_service").notNull(),
	lifeM: integer("life_m").notNull(),
	costCenter: text("cost_center"),
	project: text(),
	sourceHash: text("source_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("intangible_plan_class_idx").using("btree", table.class.asc().nullsLast().op("text_ops")),
	index("intangible_plan_company_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.inService.asc().nullsLast().op("date_ops")),
	index("intangible_plan_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("intangible_plan_source_hash_idx").using("btree", table.sourceHash.asc().nullsLast().op("text_ops")),
]);

export const wcProfile = pgTable("wc_profile", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	name: text().notNull(),
	dsoDays: numeric("dso_days").notNull(),
	dpoDays: numeric("dpo_days").notNull(),
	dioDays: numeric("dio_days").notNull(),
	taxRatePct: numeric("tax_rate_pct").default('24').notNull(),
	interestApr: numeric("interest_apr").default('6').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	uniqueIndex("wc_profile_company_name_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "wc_profile_company_id_company_id_fk"
		}),
]);

export const systemLog = pgTable("system_log", {
	id: serial().primaryKey().notNull(),
	eventType: text("event_type").notNull(),
	message: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("system_log_event_type_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
]);

export const cashAlertIdempotency = pgTable("cash_alert_idempotency", {
	key: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	period: text().notNull(),
	scenarioCode: text("scenario_code").notNull(),
	breachesCount: integer("breaches_count").default(0).notNull(),
	dispatchedAt: timestamp("dispatched_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("cash_alert_idempotency_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("cash_alert_idempotency_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("cash_alert_idempotency_period_idx").using("btree", table.period.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "fk_cash_alert_idempotency_company"
		}).onDelete("cascade"),
]);

export const cfImportAudit = pgTable("cf_import_audit", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	kind: text().notNull(),
	filename: text(),
	rowsOk: integer("rows_ok").notNull(),
	rowsErr: integer("rows_err").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("cf_import_audit_kind_check", sql`kind = ANY (ARRAY['BANK_TXN'::text, 'DRIVER'::text])`),
]);

export const apInvoice = pgTable("ap_invoice", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	invoiceNo: text("invoice_no").notNull(),
	invoiceDate: date("invoice_date").notNull(),
	dueDate: date("due_date").notNull(),
	grossAmount: numeric("gross_amount").notNull(),
	discAmount: numeric("disc_amount").default('0').notNull(),
	ccy: text().notNull(),
	status: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	discountPct: numeric("discount_pct"),
	discountDays: integer("discount_days"),
	netDays: integer("net_days"),
	discountDueDate: date("discount_due_date"),
	termsText: text("terms_text"),
}, (table) => [
	index("ap_inv_company_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("ap_inv_discount_due_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.discountDueDate.asc().nullsLast().op("text_ops")).where(sql`((discount_due_date IS NOT NULL) AND (status = 'OPEN'::text))`),
	index("ap_inv_due_date_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.dueDate.asc().nullsLast().op("date_ops")).where(sql`(status = 'OPEN'::text)`),
	index("ap_inv_supplier_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.supplierId.asc().nullsLast().op("text_ops")),
	index("ap_inv_terms_idx").using("btree", table.companyId.asc().nullsLast().op("numeric_ops"), table.discountPct.asc().nullsLast().op("numeric_ops"), table.discountDueDate.asc().nullsLast().op("text_ops")).where(sql`((discount_pct IS NOT NULL) AND (status = 'OPEN'::text))`),
	check("ap_invoice_status_check", sql`status = ANY (ARRAY['OPEN'::text, 'PAID'::text, 'CANCELLED'::text, 'VOID'::text])`),
]);

export const apDiscountPolicy = pgTable("ap_discount_policy", {
	companyId: text("company_id").primaryKey().notNull(),
	hurdleApy: numeric("hurdle_apy").notNull(),
	minSavingsAmt: numeric("min_savings_amt").default('0').notNull(),
	minSavingsPct: numeric("min_savings_pct").default('0').notNull(),
	liquidityBuffer: numeric("liquidity_buffer").default('0').notNull(),
	postingMode: text("posting_mode").notNull(),
	postingAccount: text("posting_account"),
	maxTenorDays: integer("max_tenor_days").default(30).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	check("ap_discount_policy_posting_mode_check", sql`posting_mode = ANY (ARRAY['REDUCE_EXPENSE'::text, 'OTHER_INCOME'::text])`),
]);

export const commTemplate = pgTable("comm_template", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	kind: text().notNull(),
	subject: text().notNull(),
	body: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	check("comm_template_kind_check", sql`kind = ANY (ARRAY['AR_DUNNING'::text, 'AR_REMIND'::text, 'AR_PTP'::text])`),
]);

export const apDiscountRun = pgTable("ap_discount_run", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	presentCcy: text("present_ccy"),
	status: text().notNull(),
	windowFrom: date("window_from").notNull(),
	windowTo: date("window_to").notNull(),
	cashCap: numeric("cash_cap"),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("ap_discount_run_status_check", sql`status = ANY (ARRAY['dry_run'::text, 'committed'::text])`),
]);

export const apDiscountLine = pgTable("ap_discount_line", {
	id: text().primaryKey().notNull(),
	runId: text("run_id").notNull(),
	invoiceId: text("invoice_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	invCcy: text("inv_ccy").notNull(),
	payCcy: text("pay_ccy").notNull(),
	baseAmount: numeric("base_amount").notNull(),
	discountAmt: numeric("discount_amt").notNull(),
	earlyPayAmt: numeric("early_pay_amt").notNull(),
	apr: numeric().notNull(),
	payByDate: date("pay_by_date").notNull(),
	selected: boolean().default(false).notNull(),
}, (table) => [
	index("ap_discount_line_apr_idx").using("btree", table.runId.asc().nullsLast().op("numeric_ops"), table.selected.desc().nullsFirst().op("bool_ops"), table.apr.desc().nullsFirst().op("bool_ops")),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [apDiscountRun.id],
			name: "ap_discount_line_run_id_fkey"
		}).onDelete("cascade"),
]);

export const apDiscountOffer = pgTable("ap_discount_offer", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	invoiceId: text("invoice_id").notNull(),
	offerPct: numeric("offer_pct").notNull(),
	payByDate: date("pay_by_date").notNull(),
	status: text().notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }),
	decidedBy: text("decided_by"),
}, (table) => [
	uniqueIndex("ap_discount_offer_inv_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.invoiceId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")).where(sql`(status = ANY (ARRAY['proposed'::text, 'accepted'::text]))`),
	index("ap_discount_offer_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("date_ops"), table.payByDate.asc().nullsLast().op("date_ops")),
	check("ap_discount_offer_status_check", sql`status = ANY (ARRAY['proposed'::text, 'accepted'::text, 'declined'::text, 'expired'::text])`),
]);

export const apDiscountPost = pgTable("ap_discount_post", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	runId: text("run_id").notNull(),
	totalSavings: numeric("total_savings").notNull(),
	journalId: text("journal_id"),
	postedAt: timestamp("posted_at", { withTimezone: true, mode: 'string' }),
	postedBy: text("posted_by"),
});

export const apTermsImport = pgTable("ap_terms_import", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	filename: text(),
	rowsOk: integer("rows_ok").notNull(),
	rowsErr: integer("rows_err").notNull(),
	payload: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
});

export const arRemittanceImport = pgTable("ar_remittance_import", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	source: text().notNull(),
	filename: text(),
	uniqHash: text("uniq_hash").notNull(),
	rowsOk: integer("rows_ok").default(0).notNull(),
	rowsErr: integer("rows_err").default(0).notNull(),
	payload: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	uniqueIndex("ar_remit_import_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.uniqHash.asc().nullsLast().op("text_ops")),
	check("ar_remittance_import_source_check", sql`source = ANY (ARRAY['CAMT054'::text, 'CSV'::text, 'EMAIL'::text])`),
]);

export const arCashApp = pgTable("ar_cash_app", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	receiptDate: date("receipt_date").notNull(),
	ccy: text().notNull(),
	amount: numeric().notNull(),
	customerId: text("customer_id"),
	reference: text(),
	confidence: numeric().notNull(),
	status: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("ar_cash_app_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	check("ar_cash_app_status_check", sql`status = ANY (ARRAY['matched'::text, 'partial'::text, 'unmatched'::text, 'rejected'::text])`),
]);

export const arCashAppLink = pgTable("ar_cash_app_link", {
	id: text().primaryKey().notNull(),
	cashAppId: text("cash_app_id").notNull(),
	invoiceId: text("invoice_id").notNull(),
	linkAmount: numeric("link_amount").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cashAppId],
			foreignColumns: [arCashApp.id],
			name: "ar_cash_app_link_cash_app_id_fkey"
		}).onDelete("cascade"),
]);

export const arPtp = pgTable("ar_ptp", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	customerId: text("customer_id").notNull(),
	invoiceId: text("invoice_id").notNull(),
	promisedDate: date("promised_date").notNull(),
	amount: numeric().notNull(),
	reason: text(),
	status: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }),
	decidedBy: text("decided_by"),
}, (table) => [
	index("ar_ptp_status_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.status.asc().nullsLast().op("date_ops"), table.promisedDate.asc().nullsLast().op("date_ops")),
	check("ar_ptp_status_check", sql`status = ANY (ARRAY['open'::text, 'kept'::text, 'broken'::text, 'cancelled'::text])`),
]);

export const arDispute = pgTable("ar_dispute", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	customerId: text("customer_id").notNull(),
	invoiceId: text("invoice_id").notNull(),
	reasonCode: text("reason_code").notNull(),
	detail: text(),
	status: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	resolvedBy: text("resolved_by"),
}, (table) => [
	index("ar_dispute_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	check("ar_dispute_status_check", sql`status = ANY (ARRAY['open'::text, 'resolved'::text, 'written_off'::text])`),
]);

export const arDunningLog = pgTable("ar_dunning_log", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	customerId: text("customer_id").notNull(),
	invoiceId: text("invoice_id"),
	policyCode: text("policy_code"),
	bucket: text().notNull(),
	stepIdx: integer("step_idx").notNull(),
	channel: text().notNull(),
	templateId: text("template_id").notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	status: text().notNull(),
	error: text(),
}, (table) => [
	index("ar_dunning_log_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.customerId.asc().nullsLast().op("text_ops"), table.bucket.asc().nullsLast().op("timestamptz_ops"), table.sentAt.asc().nullsLast().op("timestamptz_ops")),
	check("ar_dunning_log_status_check", sql`status = ANY (ARRAY['sent'::text, 'skipped'::text, 'error'::text])`),
]);

export const arAgeSnapshot = pgTable("ar_age_snapshot", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	asOfDate: date("as_of_date").notNull(),
	bucket: text().notNull(),
	customerId: text("customer_id").notNull(),
	openAmt: numeric("open_amt").notNull(),
}, (table) => [
	index("ar_age_snap_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.asOfDate.asc().nullsLast().op("date_ops"), table.bucket.asc().nullsLast().op("text_ops")),
]);

export const cfReceiptSignal = pgTable("cf_receipt_signal", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	weekStart: date("week_start").notNull(),
	ccy: text().notNull(),
	amount: numeric().notNull(),
	source: text().notNull(),
	refId: text("ref_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cf_receipt_signal_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.weekStart.asc().nullsLast().op("date_ops"), table.source.asc().nullsLast().op("text_ops")),
	check("cf_receipt_signal_source_check", sql`source = ANY (ARRAY['AUTO_MATCH'::text, 'PTP'::text, 'MANUAL'::text])`),
]);

export const arCreditHoldLog = pgTable("ar_credit_hold_log", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	customerId: text("customer_id").notNull(),
	event: text().notNull(),
	reason: text(),
	snapshot: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	check("ar_credit_hold_log_event_check", sql`event = ANY (ARRAY['HOLD'::text, 'RELEASE'::text])`),
]);

export const arCollectionsNote = pgTable("ar_collections_note", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	customerId: text("customer_id").notNull(),
	invoiceId: text("invoice_id"),
	kind: text().notNull(),
	body: text().notNull(),
	nextActionDate: date("next_action_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("ar_notes_next_action_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.nextActionDate.asc().nullsLast().op("date_ops")),
	check("ar_collections_note_kind_check", sql`kind = ANY (ARRAY['CALL'::text, 'EMAIL'::text, 'MEETING'::text, 'NOTE'::text])`),
]);

export const arCollectionsKpi = pgTable("ar_collections_kpi", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	asOfDate: date("as_of_date").notNull(),
	customerId: text("customer_id"),
	dso: numeric(),
	disputesOpen: integer("disputes_open"),
	ptpOpen: integer("ptp_open"),
	exposure: numeric(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ar_col_kpi_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.asOfDate.asc().nullsLast().op("date_ops")),
]);

export const arInvoice = pgTable("ar_invoice", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	customerId: text("customer_id").notNull(),
	invoiceNo: text("invoice_no").notNull(),
	invoiceDate: date("invoice_date").notNull(),
	dueDate: date("due_date").notNull(),
	amount: numeric().notNull(),
	ccy: text().notNull(),
	status: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
}, (table) => [
	index("ar_inv_company_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("ar_inv_customer_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.customerId.asc().nullsLast().op("text_ops")),
	index("ar_inv_due_date_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.dueDate.asc().nullsLast().op("text_ops")).where(sql`(status = 'open'::text)`),
	check("ar_invoice_status_check", sql`status = ANY (ARRAY['open'::text, 'paid'::text, 'cancelled'::text, 'void'::text])`),
]);

export const drizzleMigrations = pgTable("__drizzle_migrations", {
	id: serial().primaryKey().notNull(),
	hash: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
});

export const apPayLock = pgTable("ap_pay_lock", {
	companyId: text("company_id").notNull(),
	invoiceId: text("invoice_id").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.invoiceId], name: "ap_pay_lock_pkey"}),
]);

export const membership = pgTable("membership", {
	userId: text("user_id").notNull(),
	companyId: text("company_id").notNull(),
	role: text().default('admin').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "membership_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [appUser.id],
			name: "membership_user_id_app_user_id_fk"
		}),
	primaryKey({ columns: [table.userId, table.companyId], name: "membership_user_id_company_id_pk"}),
]);

export const allocAccountMap = pgTable("alloc_account_map", {
	companyId: text("company_id").notNull(),
	srcAccount: text("src_account").notNull(),
	targetAccount: text("target_account").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.srcAccount], name: "alloc_account_map_pkey"}),
]);

export const allocRuleTarget = pgTable("alloc_rule_target", {
	ruleId: text("rule_id").notNull(),
	targetCc: text("target_cc").notNull(),
	percent: numeric().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ruleId],
			foreignColumns: [allocRule.id],
			name: "alloc_rule_target_rule_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.ruleId, table.targetCc], name: "alloc_rule_target_pkey"}),
]);

export const cfLock = pgTable("cf_lock", {
	companyId: text("company_id").notNull(),
	scope: text().notNull(),
	key: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.scope, table.key], name: "cf_lock_pkey"}),
]);

export const apSupplierPolicy = pgTable("ap_supplier_policy", {
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	policyCode: text("policy_code").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.supplierId], name: "ap_supplier_policy_pkey"}),
]);

export const apRunGate = pgTable("ap_run_gate", {
	companyId: text("company_id").notNull(),
	runId: text("run_id").notNull(),
	gate: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.runId, table.gate], name: "ap_run_gate_pkey"}),
	check("ap_run_gate_gate_check", sql`gate = ANY (ARRAY['reviewed'::text, 'approved'::text, 'approved2'::text, 'screened'::text, 'executed'::text])`),
]);

export const consolAccountMap = pgTable("consol_account_map", {
	companyId: text("company_id").notNull(),
	purpose: text().notNull(),
	account: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.purpose], name: "consol_account_map_pkey"}),
]);

export const taxAccountMap = pgTable("tax_account_map", {
	companyId: text("company_id").notNull(),
	taxCodeId: text("tax_code_id").notNull(),
	outputAccountCode: text("output_account_code"),
	inputAccountCode: text("input_account_code"),
}, (table) => [
	foreignKey({
			columns: [table.taxCodeId],
			foreignColumns: [taxCode.id],
			name: "tax_account_map_tax_code_id_fkey"
		}),
	primaryKey({ columns: [table.companyId, table.taxCodeId], name: "tax_account_map_pkey"}),
]);

export const allocLock = pgTable("alloc_lock", {
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	ruleId: text("rule_id").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.year, table.month, table.ruleId], name: "alloc_lock_pkey"}),
]);

export const fxAccountMap = pgTable("fx_account_map", {
	companyId: text("company_id").notNull(),
	glAccount: text("gl_account").notNull(),
	unrealGainAccount: text("unreal_gain_account").notNull(),
	unrealLossAccount: text("unreal_loss_account").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.glAccount], name: "fx_account_map_pkey"}),
]);

export const taxReturnLock = pgTable("tax_return_lock", {
	companyId: text("company_id").notNull(),
	partnerCode: text("partner_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.partnerCode, table.year, table.month], name: "tax_return_lock_pkey"}),
]);

export const bankAccount = pgTable("bank_account", {
	companyId: text("company_id").notNull(),
	acctCode: text("acct_code").notNull(),
	name: text().notNull(),
	ccy: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.acctCode], name: "bank_account_pkey"}),
]);

export const bankBalanceDay = pgTable("bank_balance_day", {
	companyId: text("company_id").notNull(),
	acctCode: text("acct_code").notNull(),
	asOfDate: date("as_of_date").notNull(),
	balance: numeric().notNull(),
}, (table) => [
	index("bank_balance_day_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.asOfDate.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.acctCode, table.asOfDate], name: "bank_balance_day_pkey"}),
]);

export const coGroup = pgTable("co_group", {
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	name: text().notNull(),
	presentationCcy: text("presentation_ccy").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.groupCode], name: "co_group_pkey"}),
]);

export const icElimLock = pgTable("ic_elim_lock", {
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.groupCode, table.year, table.month], name: "ic_elim_lock_pkey"}),
]);

export const consolLock = pgTable("consol_lock", {
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.groupCode, table.year, table.month], name: "consol_lock_pkey"}),
]);

export const assetPostingMap = pgTable("asset_posting_map", {
	companyId: text("company_id").notNull(),
	assetClass: text("asset_class").notNull(),
	deprExpenseAccount: text("depr_expense_account").notNull(),
	accumDeprAccount: text("accum_depr_account").notNull(),
}, (table) => [
	index("asset_posting_map_accum_account_idx").using("btree", table.accumDeprAccount.asc().nullsLast().op("text_ops")),
	index("asset_posting_map_asset_class_idx").using("btree", table.assetClass.asc().nullsLast().op("text_ops")),
	index("asset_posting_map_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("asset_posting_map_expense_account_idx").using("btree", table.deprExpenseAccount.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.assetClass], name: "asset_posting_map_company_id_asset_class_pk"}),
]);

export const intangiblePostingMap = pgTable("intangible_posting_map", {
	companyId: text("company_id").notNull(),
	class: text().notNull(),
	amortExpenseAccount: text("amort_expense_account").notNull(),
	accumAmortAccount: text("accum_amort_account").notNull(),
}, (table) => [
	index("intangible_posting_map_accum_account_idx").using("btree", table.accumAmortAccount.asc().nullsLast().op("text_ops")),
	index("intangible_posting_map_class_idx").using("btree", table.class.asc().nullsLast().op("text_ops")),
	index("intangible_posting_map_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("intangible_posting_map_expense_account_idx").using("btree", table.amortExpenseAccount.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.class], name: "intangible_posting_map_company_id_class_pk"}),
]);

export const fxRevalLock = pgTable("fx_reval_lock", {
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	glAccount: text("gl_account").notNull(),
	currency: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.year, table.month, table.glAccount, table.currency], name: "fx_reval_lock_pkey"}),
]);

export const taxPartner = pgTable("tax_partner", {
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	name: text().notNull(),
	frequency: text().notNull(),
	baseCcy: text("base_ccy").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.code], name: "tax_partner_pkey"}),
	check("tax_partner_frequency_check", sql`frequency = ANY (ARRAY['M'::text, 'Q'::text, 'Y'::text])`),
]);

export const consolRatePolicy = pgTable("consol_rate_policy", {
	companyId: text("company_id").notNull(),
	class: text().notNull(),
	method: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.class], name: "consol_rate_policy_pkey"}),
	check("consol_rate_policy_class_check", sql`class = ANY (ARRAY['ASSET'::text, 'LIAB'::text, 'EQUITY'::text, 'REVENUE'::text, 'EXPENSE'::text])`),
	check("consol_rate_policy_method_check", sql`method = ANY (ARRAY['CLOSING'::text, 'AVERAGE'::text, 'HISTORICAL'::text])`),
]);

export const icElimRuleLock = pgTable("ic_elim_rule_lock", {
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	ruleCode: text("rule_code").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.groupCode, table.year, table.month, table.ruleCode], name: "ic_elim_rule_lock_pkey"}),
]);

export const bankFetchCursor = pgTable("bank_fetch_cursor", {
	companyId: text("company_id").notNull(),
	bankCode: text("bank_code").notNull(),
	channel: text().notNull(),
	cursor: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.bankCode, table.channel], name: "bank_fetch_cursor_pkey"}),
	check("bank_fetch_cursor_channel_check", sql`channel = ANY (ARRAY['pain002'::text, 'camt054'::text])`),
]);

export const bankReasonNorm = pgTable("bank_reason_norm", {
	bankCode: text("bank_code").notNull(),
	code: text().notNull(),
	normStatus: text("norm_status").notNull(),
	normLabel: text("norm_label").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.bankCode, table.code], name: "bank_reason_norm_pkey"}),
	check("bank_reason_norm_norm_status_check", sql`norm_status = ANY (ARRAY['ack'::text, 'exec_ok'::text, 'exec_fail'::text, 'partial'::text])`),
]);

export const coEntity = pgTable("co_entity", {
	companyId: text("company_id").notNull(),
	entityCode: text("entity_code").notNull(),
	name: text().notNull(),
	baseCcy: text("base_ccy").notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.entityCode], name: "co_entity_pkey"}),
]);

export const itemCosts = pgTable("item_costs", {
	companyId: text("company_id").notNull(),
	itemId: text("item_id").notNull(),
	onHandQty: numeric("on_hand_qty", { precision: 20, scale:  6 }).notNull(),
	movingAvgCost: numeric("moving_avg_cost", { precision: 20, scale:  6 }).notNull(),
	totalValue: numeric("total_value", { precision: 20, scale:  6 }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [company.id],
			name: "item_costs_company_id_company_id_fk"
		}),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [item.id],
			name: "item_costs_item_id_item_id_fk"
		}),
	primaryKey({ columns: [table.companyId, table.itemId], name: "item_costs_pk"}),
]);

export const periods = pgTable("periods", {
	companyId: text("company_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	state: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("periods_nonopen_idx").using("btree", table.companyId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("text_ops")).where(sql`(state <> 'open'::text)`),
	primaryKey({ columns: [table.companyId, table.year, table.month], name: "periods_pkey"}),
	check("periods_month_check", sql`(month >= 1) AND (month <= 12)`),
	check("periods_state_check", sql`state = ANY (ARRAY['open'::text, 'pending_close'::text, 'closed'::text])`),
]);

export const consolRateOverride = pgTable("consol_rate_override", {
	companyId: text("company_id").notNull(),
	account: text().notNull(),
	method: text().notNull(),
	note: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.account], name: "consol_rate_override_pkey"}),
	check("consol_rate_override_method_check", sql`method = ANY (ARRAY['CLOSING'::text, 'AVERAGE'::text, 'HISTORICAL'::text])`),
]);

export const apFileProfile = pgTable("ap_file_profile", {
	companyId: text("company_id").notNull(),
	bankCode: text("bank_code").notNull(),
	format: text().notNull(),
	profile: jsonb().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.bankCode], name: "ap_file_profile_pkey"}),
]);

export const sanctionAdapterProfile = pgTable("sanction_adapter_profile", {
	companyId: text("company_id").notNull(),
	adapter: text().notNull(),
	config: jsonb().notNull(),
	active: boolean().default(true).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.adapter], name: "sanction_adapter_profile_pkey"}),
]);

export const fxAdminRates = pgTable("fx_admin_rates", {
	companyId: text("company_id").notNull(),
	asOfDate: date("as_of_date").notNull(),
	srcCcy: text("src_ccy").notNull(),
	dstCcy: text("dst_ccy").notNull(),
	rate: numeric().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	uniqueIndex("fx_admin_rates_uk").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.asOfDate.asc().nullsLast().op("date_ops"), table.srcCcy.asc().nullsLast().op("date_ops"), table.dstCcy.asc().nullsLast().op("date_ops")),
	primaryKey({ columns: [table.companyId, table.asOfDate, table.srcCcy, table.dstCcy], name: "fx_admin_rates_pkey"}),
]);

export const taxReturnTemplate = pgTable("tax_return_template", {
	companyId: text("company_id").notNull(),
	partnerCode: text("partner_code").notNull(),
	version: text().notNull(),
	boxId: text("box_id").notNull(),
	boxLabel: text("box_label").notNull(),
	sign: text().notNull(),
	ordinal: integer().notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.partnerCode, table.version, table.boxId], name: "tax_return_template_pkey"}),
	check("tax_return_template_sign_check", sql`sign = ANY (ARRAY['+'::text, '-'::text])`),
]);

export const taxExportProfile = pgTable("tax_export_profile", {
	companyId: text("company_id").notNull(),
	partnerCode: text("partner_code").notNull(),
	version: text().notNull(),
	format: text().notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	uniqueIndex("tax_export_profile_default_uk").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.partnerCode.asc().nullsLast().op("text_ops"), table.version.asc().nullsLast().op("text_ops")).where(sql`(is_default = true)`),
	primaryKey({ columns: [table.companyId, table.partnerCode, table.version, table.format], name: "tax_export_profile_pkey"}),
]);

export const cfScenario = pgTable("cf_scenario", {
	companyId: text("company_id").notNull(),
	code: text().notNull(),
	name: text().notNull(),
	kind: text().notNull(),
	active: boolean().default(true).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.code], name: "cf_scenario_pkey"}),
	check("cf_scenario_kind_check", sql`kind = ANY (ARRAY['BASE'::text, 'BUDGET'::text, 'FORECAST'::text, 'MANUAL'::text])`),
]);

export const apSupplierLimit = pgTable("ap_supplier_limit", {
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	dayCap: numeric("day_cap"),
	runCap: numeric("run_cap"),
	yearCap: numeric("year_cap"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("ap_supplier_limit_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.supplierId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.supplierId], name: "ap_supplier_limit_pkey"}),
]);

export const bankConnProfile = pgTable("bank_conn_profile", {
	companyId: text("company_id").notNull(),
	bankCode: text("bank_code").notNull(),
	kind: text().notNull(),
	config: jsonb().notNull(),
	active: boolean().default(true).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.bankCode], name: "bank_conn_profile_pkey"}),
	check("bank_conn_profile_kind_check", sql`kind = ANY (ARRAY['SFTP'::text, 'API'::text])`),
]);

export const coOwnership = pgTable("co_ownership", {
	companyId: text("company_id").notNull(),
	groupCode: text("group_code").notNull(),
	parentCode: text("parent_code").notNull(),
	childCode: text("child_code").notNull(),
	pct: numeric().notNull(),
	effFrom: date("eff_from").notNull(),
	effTo: date("eff_to"),
}, (table) => [
	index("co_ownership_eff_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.groupCode.asc().nullsLast().op("text_ops"), table.parentCode.asc().nullsLast().op("text_ops"), table.childCode.asc().nullsLast().op("date_ops"), table.effFrom.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.groupCode, table.parentCode, table.childCode, table.effFrom], name: "co_ownership_pkey"}),
]);

export const icElimMap = pgTable("ic_elim_map", {
	companyId: text("company_id").notNull(),
	ruleCode: text("rule_code").notNull(),
	srcAccountLike: text("src_account_like"),
	cpAccountLike: text("cp_account_like"),
	note: text(),
	active: boolean().default(true).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.ruleCode], name: "ic_elim_map_pkey"}),
]);

export const cfMap = pgTable("cf_map", {
	companyId: text("company_id").notNull(),
	mapCode: text("map_code").notNull(),
	accountLike: text("account_like").notNull(),
	cfSection: text("cf_section").notNull(),
	sign: text().notNull(),
	note: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("cf_map_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.mapCode.asc().nullsLast().op("text_ops"), table.cfSection.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.mapCode, table.accountLike], name: "cf_map_pkey"}),
	check("cf_map_sign_check", sql`sign = ANY (ARRAY['+'::text, '-'::text])`),
]);

export const apPaymentPref = pgTable("ap_payment_pref", {
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	payTerms: text("pay_terms"),
	payDayRule: text("pay_day_rule"),
	minAmount: numeric("min_amount"),
	holdPay: boolean("hold_pay").default(false).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.supplierId], name: "ap_payment_pref_pkey"}),
]);

export const allocDriverValue = pgTable("alloc_driver_value", {
	companyId: text("company_id").notNull(),
	driverCode: text("driver_code").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	costCenter: text("cost_center").notNull(),
	project: text().notNull(),
	value: numeric().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("alloc_driver_value_find_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.driverCode.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.driverCode, table.year, table.month, table.costCenter, table.project], name: "alloc_driver_value_pkey"}),
	check("alloc_driver_value_month_check", sql`(month >= 1) AND (month <= 12)`),
]);

export const arCustomerCredit = pgTable("ar_customer_credit", {
	companyId: text("company_id").notNull(),
	customerId: text("customer_id").notNull(),
	policyCode: text("policy_code").notNull(),
	creditLimit: numeric("credit_limit").notNull(),
	riskScore: numeric("risk_score"),
	onHold: boolean("on_hold").default(false).notNull(),
	holdReason: text("hold_reason"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("ar_cust_credit_hold_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.onHold.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.companyId, table.customerId], name: "ar_customer_credit_pkey"}),
]);

export const apApprovalPolicy = pgTable("ap_approval_policy", {
	companyId: text("company_id").notNull(),
	policyCode: text("policy_code").notNull(),
	minAmount: numeric("min_amount").default('0').notNull(),
	maxAmount: numeric("max_amount"),
	currency: text(),
	requireReviewer: boolean("require_reviewer").default(true).notNull(),
	requireApprover: boolean("require_approver").default(true).notNull(),
	requireDualApprover: boolean("require_dual_approver").default(false).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.policyCode], name: "ap_approval_policy_pkey"}),
]);

export const arCreditPolicy = pgTable("ar_credit_policy", {
	companyId: text("company_id").notNull(),
	policyCode: text("policy_code").notNull(),
	segment: text(),
	maxLimit: numeric("max_limit").notNull(),
	dsoTarget: integer("dso_target").default(45).notNull(),
	graceDays: integer("grace_days").default(5).notNull(),
	ptpTolerance: integer("ptp_tolerance").default(2).notNull(),
	riskWeight: numeric("risk_weight").default('1.0').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.policyCode], name: "ar_credit_policy_pkey"}),
]);

export const arDunningPolicy = pgTable("ar_dunning_policy", {
	companyId: text("company_id").notNull(),
	policyCode: text("policy_code").notNull(),
	segment: text(),
	fromBucket: text("from_bucket").notNull(),
	stepIdx: integer("step_idx").notNull(),
	waitDays: integer("wait_days").notNull(),
	channel: text().notNull(),
	templateId: text("template_id").notNull(),
	throttleDays: integer("throttle_days").default(3).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.policyCode, table.fromBucket, table.stepIdx], name: "ar_dunning_policy_pkey"}),
	check("ar_dunning_policy_channel_check", sql`channel = ANY (ARRAY['EMAIL'::text, 'WEBHOOK'::text])`),
]);

export const apSupplierBank = pgTable("ap_supplier_bank", {
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	method: text().notNull(),
	bankName: text("bank_name"),
	iban: text(),
	bic: text(),
	acctNo: text("acct_no"),
	acctCcy: text("acct_ccy").notNull(),
	country: text(),
	active: boolean().default(true).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	primaryKey({ columns: [table.companyId, table.supplierId], name: "ap_supplier_bank_pkey"}),
	check("ap_supplier_bank_method_check", sql`method = ANY (ARRAY['ACH'::text, 'SEPA'::text, 'TT'::text, 'MANUAL'::text])`),
]);

export const apPayeeKyc = pgTable("ap_payee_kyc", {
	companyId: text("company_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	residency: text(),
	taxForm: text("tax_form"),
	taxId: text("tax_id"),
	docType: text("doc_type"),
	docRef: text("doc_ref"),
	docExpires: date("doc_expires"),
	riskLevel: text("risk_level"),
	onHold: boolean("on_hold").default(false).notNull(),
	notes: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by").notNull(),
}, (table) => [
	index("ap_payee_kyc_expiry_idx").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.docExpires.asc().nullsLast().op("date_ops")),
	primaryKey({ columns: [table.companyId, table.supplierId], name: "ap_payee_kyc_pkey"}),
	check("ap_payee_kyc_risk_level_check", sql`risk_level = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text])`),
]);
export const cashBalanceSnapshot = pgMaterializedView("cash_balance_snapshot", {	companyId: text("company_id"),
	versionId: text("version_id"),
	year: integer(),
	month: integer(),
	currency: text(),
	presentCcy: text("present_ccy"),
	costCenter: text("cost_center"),
	project: text(),
	netChange: numeric("net_change"),
	cumulativeBalance: numeric("cumulative_balance"),
	avgBurnRate3M: numeric("avg_burn_rate_3m"),
	monthlyBurn: numeric("monthly_burn"),
	runwayMonths: numeric("runway_months"),
}).as(sql`SELECT cash_line.company_id, cash_line.version_id, cash_line.year, cash_line.month, cash_line.currency, cash_line.present_ccy, cash_line.cost_center, cash_line.project, cash_line.net_change, sum(cash_line.net_change) OVER (PARTITION BY cash_line.company_id, cash_line.version_id, cash_line.cost_center, cash_line.project ORDER BY cash_line.year, cash_line.month ROWS UNBOUNDED PRECEDING) AS cumulative_balance, avg( CASE WHEN cash_line.net_change < 0::numeric THEN - cash_line.net_change ELSE 0::numeric END) OVER (PARTITION BY cash_line.company_id, cash_line.version_id, cash_line.cost_center, cash_line.project ORDER BY cash_line.year, cash_line.month ROWS 2 PRECEDING) AS avg_burn_rate_3m, CASE WHEN cash_line.net_change < 0::numeric THEN - cash_line.net_change ELSE 0::numeric END AS monthly_burn, CASE WHEN cash_line.net_change < 0::numeric THEN sum(cash_line.net_change) OVER (PARTITION BY cash_line.company_id, cash_line.version_id, cash_line.cost_center, cash_line.project ORDER BY cash_line.year, cash_line.month ROWS UNBOUNDED PRECEDING) / NULLIF(- cash_line.net_change, 0::numeric) ELSE NULL::numeric END AS runway_months FROM cash_line WHERE cash_line.net_change IS NOT NULL`);