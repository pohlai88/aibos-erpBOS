CREATE TABLE "amort_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"currency" text NOT NULL,
	"present_ccy" text NOT NULL,
	"amount" numeric NOT NULL,
	"booked_flag" boolean DEFAULT false NOT NULL,
	"booked_journal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_class_ref" (
	"code" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"method" text NOT NULL,
	"default_life_m" integer NOT NULL,
	"residual_pct" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_impairment" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"plan_kind" text NOT NULL,
	"plan_id" text NOT NULL,
	"date" date NOT NULL,
	"amount" numeric NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_posting_map" (
	"company_id" text NOT NULL,
	"asset_class" text NOT NULL,
	"depr_expense_account" text NOT NULL,
	"accum_depr_account" text NOT NULL,
	CONSTRAINT "asset_posting_map_company_id_asset_class_pk" PRIMARY KEY("company_id","asset_class")
);
--> statement-breakpoint
CREATE TABLE "assets_config" (
	"company_id" text PRIMARY KEY NOT NULL,
	"proration_enabled" boolean DEFAULT false NOT NULL,
	"proration_basis" text DEFAULT 'days_in_month' NOT NULL,
	"fx_presentation_policy" text DEFAULT 'post_month' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets_limits" (
	"company_id" text PRIMARY KEY NOT NULL,
	"import_max_rows" integer DEFAULT 10000 NOT NULL,
	"bulk_post_max_rows" integer DEFAULT 5000 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets_ui_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"locked" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_alert_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"account_code" text,
	"cost_center" text,
	"project" text,
	"period_scope" text NOT NULL,
	"threshold_pct" numeric(5, 2) NOT NULL,
	"comparator" text NOT NULL,
	"delivery" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_approval" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"version_id" text NOT NULL,
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_import" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_hash" text NOT NULL,
	"mapping_json" jsonb NOT NULL,
	"delimiter" text DEFAULT ',' NOT NULL,
	"rows_total" integer DEFAULT 0 NOT NULL,
	"rows_valid" integer DEFAULT 0 NOT NULL,
	"rows_invalid" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_report" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_line" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"company_id" text NOT NULL,
	"period_month" char(7) NOT NULL,
	"account_code" text NOT NULL,
	"cost_center_id" text,
	"project_id" text,
	"amount_base" numeric(20, 6) NOT NULL,
	"import_id" text,
	"version_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_version" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"year" integer NOT NULL,
	"is_baseline" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capex_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"asset_class" text NOT NULL,
	"description" text NOT NULL,
	"capex_amount" numeric NOT NULL,
	"currency" text NOT NULL,
	"present_ccy" text NOT NULL,
	"in_service" date NOT NULL,
	"life_m" integer,
	"method" text,
	"cost_center" text,
	"project" text,
	"source_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_alert_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"threshold_num" numeric NOT NULL,
	"filter_cc" text,
	"filter_project" text,
	"delivery" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_alert_schedule" (
	"company_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"hour_local" integer DEFAULT 8 NOT NULL,
	"minute_local" integer DEFAULT 0 NOT NULL,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"scenario_code" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_forecast_version" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"year" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"profile_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_line" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"version_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"currency" text NOT NULL,
	"present_ccy" text NOT NULL,
	"cash_in" numeric DEFAULT '0' NOT NULL,
	"cash_out" numeric DEFAULT '0' NOT NULL,
	"net_change" numeric DEFAULT '0' NOT NULL,
	"cost_center" text,
	"project" text,
	"source_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "depr_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"currency" text NOT NULL,
	"present_ccy" text NOT NULL,
	"amount" numeric NOT NULL,
	"booked_flag" boolean DEFAULT false NOT NULL,
	"booked_journal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dim_cost_center" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"path" text,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dim_project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"formula_json" jsonb NOT NULL,
	"seasonality_json" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_line" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"version_id" text NOT NULL,
	"account_code" text NOT NULL,
	"cost_center_code" text,
	"project_code" text,
	"month" integer NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_version" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"year" integer NOT NULL,
	"driver_profile_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_account_map" (
	"company_id" text NOT NULL,
	"gl_account" text NOT NULL,
	"unreal_gain_account" text NOT NULL,
	"unreal_loss_account" text NOT NULL,
	CONSTRAINT "fx_account_map_company_id_gl_account_pk" PRIMARY KEY("company_id","gl_account")
);
--> statement-breakpoint
CREATE TABLE "fx_admin_rates" (
	"company_id" text NOT NULL,
	"as_of_date" date NOT NULL,
	"src_ccy" text NOT NULL,
	"dst_ccy" text NOT NULL,
	"rate" numeric NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "fx_admin_rates_company_id_as_of_date_src_ccy_dst_ccy_pk" PRIMARY KEY("company_id","as_of_date","src_ccy","dst_ccy")
);
--> statement-breakpoint
CREATE TABLE "fx_reval_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"gl_account" text NOT NULL,
	"currency" text NOT NULL,
	"balance_base" numeric NOT NULL,
	"balance_src" numeric NOT NULL,
	"rate_old" numeric NOT NULL,
	"rate_new" numeric NOT NULL,
	"delta_base" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_reval_lock" (
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"gl_account" text NOT NULL,
	"currency" text NOT NULL,
	CONSTRAINT "fx_reval_lock_company_id_year_month_gl_account_currency_pk" PRIMARY KEY("company_id","year","month","gl_account","currency")
);
--> statement-breakpoint
CREATE TABLE "fx_reval_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"plan_kind" text NOT NULL,
	"plan_id" text NOT NULL,
	"policy" text NOT NULL,
	"year" integer,
	"month" integer,
	"rate" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intangible_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"class" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text NOT NULL,
	"present_ccy" text NOT NULL,
	"in_service" date NOT NULL,
	"life_m" integer NOT NULL,
	"cost_center" text,
	"project" text,
	"source_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intangible_posting_map" (
	"company_id" text NOT NULL,
	"class" text NOT NULL,
	"amort_expense_account" text NOT NULL,
	"accum_amort_account" text NOT NULL,
	CONSTRAINT "intangible_posting_map_company_id_class_pk" PRIMARY KEY("company_id","class")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"date" date NOT NULL,
	"memo" text,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"journal_id" text NOT NULL,
	"account_id" text NOT NULL,
	"debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "periods_company_id_year_month_pk" PRIMARY KEY("company_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "wc_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"dso_days" numeric NOT NULL,
	"dpo_days" numeric NOT NULL,
	"dio_days" numeric NOT NULL,
	"tax_rate_pct" numeric DEFAULT '24' NOT NULL,
	"interest_apr" numeric DEFAULT '6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloc_account_map" (
	"company_id" text NOT NULL,
	"src_account" text NOT NULL,
	"target_account" text NOT NULL,
	CONSTRAINT "alloc_account_map_company_id_src_account_pk" PRIMARY KEY("company_id","src_account")
);
--> statement-breakpoint
CREATE TABLE "alloc_driver_value" (
	"company_id" text NOT NULL,
	"driver_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"cost_center" text,
	"project" text,
	"value" numeric NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "alloc_driver_value_company_id_driver_code_year_month_cost_center_project_pk" PRIMARY KEY("company_id","driver_code","year","month","cost_center","project")
);
--> statement-breakpoint
CREATE TABLE "alloc_import_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"filename" text,
	"rows_ok" integer NOT NULL,
	"rows_err" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloc_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"rule_id" text NOT NULL,
	"src_account" text,
	"src_cc" text,
	"target_cc" text NOT NULL,
	"amount_base" numeric NOT NULL,
	"driver_code" text,
	"driver_value" numeric,
	"method" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "alloc_lock" (
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"rule_id" text NOT NULL,
	CONSTRAINT "alloc_lock_company_id_year_month_rule_id_pk" PRIMARY KEY("company_id","year","month","rule_id")
);
--> statement-breakpoint
CREATE TABLE "alloc_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"method" text NOT NULL,
	"driver_code" text,
	"rate_per_unit" numeric,
	"src_account" text,
	"src_cc_like" text,
	"src_project" text,
	"eff_from" date,
	"eff_to" date,
	"order_no" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloc_rule_target" (
	"rule_id" text NOT NULL,
	"target_cc" text NOT NULL,
	"percent" numeric NOT NULL,
	CONSTRAINT "alloc_rule_target_rule_id_target_cc_pk" PRIMARY KEY("rule_id","target_cc")
);
--> statement-breakpoint
CREATE TABLE "alloc_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_carry_forward" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"from_year" integer NOT NULL,
	"from_month" integer NOT NULL,
	"into_year" integer NOT NULL,
	"into_month" integer NOT NULL,
	"source_ref" text NOT NULL,
	"box_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"reason" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_export_profile" (
	"company_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"version" text NOT NULL,
	"format" text NOT NULL,
	"is_default" text DEFAULT 'false' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_partner" (
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"frequency" text NOT NULL,
	"base_ccy" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_return_adjustment" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"box_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_return_box_map" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"version" text NOT NULL,
	"box_id" text NOT NULL,
	"tax_code" text,
	"direction" text,
	"rate_name" text,
	"account_like" text,
	"cc_like" text,
	"project_like" text,
	"priority" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_return_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"box_id" text NOT NULL,
	"source_ref" text,
	"amount" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_return_export" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"format" text NOT NULL,
	"filename" text NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_return_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"box_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "tax_return_lock" (
	"company_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_return_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"version" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"period_key" text NOT NULL,
	"mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_return_template" (
	"company_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"version" text NOT NULL,
	"box_id" text NOT NULL,
	"box_label" text NOT NULL,
	"sign" text NOT NULL,
	"ordinal" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounting_period" DROP CONSTRAINT "accounting_period_id_pk";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "require_cost_center" text DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "require_project" text DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_line" ADD COLUMN "cost_center_id" text;--> statement-breakpoint
ALTER TABLE "journal_line" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_alert_rule" ADD CONSTRAINT "budget_alert_rule_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_approval" ADD CONSTRAINT "budget_approval_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_approval" ADD CONSTRAINT "budget_approval_version_id_budget_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."budget_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line" ADD CONSTRAINT "budget_line_budget_id_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line" ADD CONSTRAINT "budget_line_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line" ADD CONSTRAINT "budget_line_cost_center_id_dim_cost_center_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."dim_cost_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_line" ADD CONSTRAINT "budget_line_project_id_dim_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dim_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_version" ADD CONSTRAINT "budget_version_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_alert_rule" ADD CONSTRAINT "cash_alert_rule_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_forecast_version" ADD CONSTRAINT "cash_forecast_version_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_forecast_version" ADD CONSTRAINT "cash_forecast_version_profile_id_wc_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."wc_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_line" ADD CONSTRAINT "cash_line_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_line" ADD CONSTRAINT "cash_line_version_id_cash_forecast_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."cash_forecast_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_profile" ADD CONSTRAINT "driver_profile_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_line" ADD CONSTRAINT "forecast_line_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_line" ADD CONSTRAINT "forecast_line_version_id_forecast_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."forecast_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_version" ADD CONSTRAINT "forecast_version_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_version" ADD CONSTRAINT "forecast_version_driver_profile_id_driver_profile_id_fk" FOREIGN KEY ("driver_profile_id") REFERENCES "public"."driver_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fx_admin_rates" ADD CONSTRAINT "fx_admin_rates_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fx_reval_line" ADD CONSTRAINT "fx_reval_line_run_id_fx_reval_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."fx_reval_run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_id_journal_entries_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periods" ADD CONSTRAINT "periods_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wc_profile" ADD CONSTRAINT "wc_profile_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_cost_center_id_dim_cost_center_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."dim_cost_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_project_id_dim_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dim_project"("id") ON DELETE no action ON UPDATE no action;