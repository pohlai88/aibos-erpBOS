CREATE TYPE "public"."attest_campaign_state" AS ENUM('DRAFT', 'ISSUED', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."attest_frequency" AS ENUM('QUARTERLY', 'ANNUAL', 'ADHOC');--> statement-breakpoint
CREATE TYPE "public"."attest_sla_state" AS ENUM('OK', 'DUE_SOON', 'LATE', 'ESCALATED');--> statement-breakpoint
CREATE TYPE "public"."attest_task_state" AS ENUM('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED', 'APPROVED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."attest_template_status" AS ENUM('ACTIVE', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."audit_grant_scope" AS ENUM('ATTEST_PACK', 'CTRL_RUN', 'EVIDENCE', 'REPORT', 'EXTRACT');--> statement-breakpoint
CREATE TYPE "public"."close_item_kind" AS ENUM('TASK', 'AUTO_CTRL', 'SOX_TEST', 'DEFICIENCY', 'FLUX', 'CERT');--> statement-breakpoint
CREATE TYPE "public"."it_connector" AS ENUM('SCIM', 'SAML', 'OIDC', 'SQL', 'CSV', 'API');--> statement-breakpoint
CREATE TYPE "public"."it_entitlement_kind" AS ENUM('ROLE', 'GROUP', 'PRIV', 'SCHEMA', 'TABLE', 'ACTION');--> statement-breakpoint
CREATE TYPE "public"."it_grant_source" AS ENUM('HR', 'JOINER', 'TICKET', 'EMERGENCY', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."it_snapshot_scope" AS ENUM('USERS', 'ROLES', 'GRANTS', 'SOD', 'BREAKGLASS');--> statement-breakpoint
CREATE TYPE "public"."it_sod_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."it_sod_violation_status" AS ENUM('OPEN', 'WAIVED', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."it_system_kind" AS ENUM('ERP', 'DB', 'CLOUD', 'BI', 'APP');--> statement-breakpoint
CREATE TYPE "public"."it_user_status" AS ENUM('ACTIVE', 'DISABLED', 'LOCKED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."uar_campaign_status" AS ENUM('DRAFT', 'OPEN', 'ESCALATED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."uar_item_state" AS ENUM('PENDING', 'CERTIFIED', 'REVOKE', 'EXCEPTION');--> statement-breakpoint
CREATE TABLE "ap_approval_policy" (
	"company_id" text NOT NULL,
	"policy_code" text NOT NULL,
	"min_amount" numeric DEFAULT '0' NOT NULL,
	"max_amount" numeric,
	"currency" text,
	"require_reviewer" boolean DEFAULT true NOT NULL,
	"require_approver" boolean DEFAULT true NOT NULL,
	"require_dual_approver" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ap_approval_policy_company_id_policy_code_pk" PRIMARY KEY("company_id","policy_code")
);
--> statement-breakpoint
CREATE TABLE "ap_discount_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"inv_ccy" text NOT NULL,
	"pay_ccy" text NOT NULL,
	"base_amount" numeric NOT NULL,
	"discount_amt" numeric NOT NULL,
	"early_pay_amt" numeric NOT NULL,
	"apr" numeric NOT NULL,
	"pay_by_date" date NOT NULL,
	"selected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ap_discount_offer" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"offer_pct" numeric NOT NULL,
	"pay_by_date" date NOT NULL,
	"status" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" text
);
--> statement-breakpoint
CREATE TABLE "ap_discount_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"hurdle_apy" numeric NOT NULL,
	"min_savings_amt" numeric DEFAULT '0' NOT NULL,
	"min_savings_pct" numeric DEFAULT '0' NOT NULL,
	"liquidity_buffer" numeric DEFAULT '0' NOT NULL,
	"posting_mode" text NOT NULL,
	"posting_account" text,
	"max_tenor_days" integer DEFAULT 30 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ap_discount_post" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text NOT NULL,
	"total_savings" numeric NOT NULL,
	"journal_id" text,
	"posted_at" timestamp with time zone,
	"posted_by" text
);
--> statement-breakpoint
CREATE TABLE "ap_discount_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"present_ccy" text,
	"status" text NOT NULL,
	"window_from" date NOT NULL,
	"window_to" date NOT NULL,
	"cash_cap" numeric,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ap_file_profile" (
	"company_id" text NOT NULL,
	"bank_code" text NOT NULL,
	"format" text NOT NULL,
	"profile" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ap_file_profile_company_id_bank_code_pk" PRIMARY KEY("company_id","bank_code")
);
--> statement-breakpoint
CREATE TABLE "ap_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"invoice_no" text NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"gross_amount" numeric NOT NULL,
	"disc_amount" numeric DEFAULT '0' NOT NULL,
	"ccy" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"discount_pct" numeric,
	"discount_days" integer,
	"net_days" integer,
	"discount_due_date" date,
	"terms_text" text
);
--> statement-breakpoint
CREATE TABLE "ap_pay_export" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"format" text NOT NULL,
	"filename" text NOT NULL,
	"payload" text NOT NULL,
	"checksum" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ap_pay_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"due_date" date NOT NULL,
	"gross_amount" numeric NOT NULL,
	"disc_amount" numeric DEFAULT '0' NOT NULL,
	"pay_amount" numeric NOT NULL,
	"inv_ccy" text NOT NULL,
	"pay_ccy" text NOT NULL,
	"fx_rate" numeric,
	"bank_ref" text,
	"status" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "ap_pay_lock" (
	"company_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	CONSTRAINT "ap_pay_lock_company_id_invoice_id_pk" PRIMARY KEY("company_id","invoice_id")
);
--> statement-breakpoint
CREATE TABLE "ap_pay_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"status" text NOT NULL,
	"ccy" text NOT NULL,
	"present_ccy" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"failed_reason" text
);
--> statement-breakpoint
CREATE TABLE "ap_payee_kyc" (
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"residency" text,
	"tax_form" text,
	"tax_id" text,
	"doc_type" text,
	"doc_ref" text,
	"doc_expires" date,
	"risk_level" text,
	"on_hold" boolean DEFAULT false NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ap_payee_kyc_company_id_supplier_id_pk" PRIMARY KEY("company_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "ap_payment_post" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"fee_amount" numeric DEFAULT '0' NOT NULL,
	"fee_account" text,
	"realized_fx" numeric DEFAULT '0' NOT NULL,
	"realized_fx_account" text,
	"posted_at" timestamp with time zone,
	"journal_id" text
);
--> statement-breakpoint
CREATE TABLE "ap_payment_pref" (
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"pay_terms" text,
	"pay_day_rule" text,
	"min_amount" numeric,
	"hold_pay" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ap_payment_pref_company_id_supplier_id_pk" PRIMARY KEY("company_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "ap_remittance" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"address" text,
	"status" text NOT NULL,
	"sent_at" timestamp with time zone,
	"response" text
);
--> statement-breakpoint
CREATE TABLE "ap_run_approval" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"step" text NOT NULL,
	"actor" text NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decision" text NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "ap_run_gate" (
	"company_id" text NOT NULL,
	"run_id" text NOT NULL,
	"gate" text NOT NULL,
	CONSTRAINT "ap_run_gate_company_id_run_id_gate_pk" PRIMARY KEY("company_id","run_id","gate")
);
--> statement-breakpoint
CREATE TABLE "ap_supplier_bank" (
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"method" text NOT NULL,
	"bank_name" text,
	"iban" text,
	"bic" text,
	"acct_no" text,
	"acct_ccy" text NOT NULL,
	"country" text,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ap_supplier_bank_company_id_supplier_id_pk" PRIMARY KEY("company_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "ap_supplier_limit" (
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"day_cap" numeric,
	"run_cap" numeric,
	"year_cap" numeric,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ap_supplier_limit_company_id_supplier_id_pk" PRIMARY KEY("company_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "ap_supplier_policy" (
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"policy_code" text NOT NULL,
	CONSTRAINT "ap_supplier_policy_company_id_supplier_id_pk" PRIMARY KEY("company_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "ap_terms_import" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"filename" text,
	"rows_ok" integer NOT NULL,
	"rows_err" integer NOT NULL,
	"payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ap_vendor_token" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_age_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"as_of_date" date NOT NULL,
	"bucket" text NOT NULL,
	"customer_id" text NOT NULL,
	"open_amt" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_cash_app" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"receipt_date" date NOT NULL,
	"ccy" text NOT NULL,
	"amount" numeric NOT NULL,
	"customer_id" text,
	"reference" text,
	"confidence" numeric NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_cash_app_link" (
	"id" text PRIMARY KEY NOT NULL,
	"cash_app_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"link_amount" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_checkout_intent" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"present_ccy" text NOT NULL,
	"amount" numeric NOT NULL,
	"invoices" jsonb NOT NULL,
	"surcharge" numeric DEFAULT '0' NOT NULL,
	"gateway" text NOT NULL,
	"status" text NOT NULL,
	"client_secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_checkout_txn" (
	"id" text PRIMARY KEY NOT NULL,
	"intent_id" text NOT NULL,
	"gateway" text NOT NULL,
	"ext_ref" text,
	"status" text NOT NULL,
	"amount" numeric NOT NULL,
	"fee_amount" numeric,
	"ccy" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_collections_kpi" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"as_of_date" date NOT NULL,
	"customer_id" text,
	"dso" numeric,
	"disputes_open" integer,
	"ptp_open" integer,
	"exposure" numeric,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_collections_note" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_id" text,
	"kind" text NOT NULL,
	"body" text NOT NULL,
	"next_action_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_credit_hold_log" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"event" text NOT NULL,
	"reason" text,
	"snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_credit_policy" (
	"company_id" text NOT NULL,
	"policy_code" text NOT NULL,
	"segment" text,
	"max_limit" numeric NOT NULL,
	"dso_target" integer DEFAULT 45 NOT NULL,
	"grace_days" integer DEFAULT 5 NOT NULL,
	"ptp_tolerance" integer DEFAULT 2 NOT NULL,
	"risk_weight" numeric DEFAULT '1.0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ar_credit_policy_company_id_policy_code_pk" PRIMARY KEY("company_id","policy_code")
);
--> statement-breakpoint
CREATE TABLE "ar_customer_credit" (
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"policy_code" text NOT NULL,
	"credit_limit" numeric NOT NULL,
	"risk_score" numeric,
	"on_hold" boolean DEFAULT false NOT NULL,
	"hold_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ar_customer_credit_company_id_customer_id_pk" PRIMARY KEY("company_id","customer_id")
);
--> statement-breakpoint
CREATE TABLE "ar_dispute" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"reason_code" text NOT NULL,
	"detail" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text
);
--> statement-breakpoint
CREATE TABLE "ar_dunning_log" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_id" text,
	"policy_code" text,
	"bucket" text NOT NULL,
	"step_idx" integer NOT NULL,
	"channel" text NOT NULL,
	"template_id" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "ar_dunning_policy" (
	"company_id" text NOT NULL,
	"policy_code" text NOT NULL,
	"segment" text,
	"from_bucket" text NOT NULL,
	"step_idx" integer NOT NULL,
	"wait_days" integer NOT NULL,
	"channel" text NOT NULL,
	"template_id" text NOT NULL,
	"throttle_days" integer DEFAULT 3 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ar_dunning_policy_company_id_policy_code_from_bucket_step_idx_pk" PRIMARY KEY("company_id","policy_code","from_bucket","step_idx")
);
--> statement-breakpoint
CREATE TABLE "ar_finance_charge_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"annual_pct" numeric DEFAULT '0' NOT NULL,
	"min_fee" numeric DEFAULT '0' NOT NULL,
	"grace_days" integer DEFAULT 0 NOT NULL,
	"comp_method" text DEFAULT 'simple' NOT NULL,
	"present_ccy" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_gateway_webhook_dlq" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"gateway" text NOT NULL,
	"payload" jsonb NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retry_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ar_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_no" text NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"gross_amount" numeric NOT NULL,
	"paid_amount" numeric DEFAULT '0' NOT NULL,
	"ccy" text NOT NULL,
	"status" text NOT NULL,
	"portal_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_portal_ledger_token" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_portal_session" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "ar_ptp" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"promised_date" date NOT NULL,
	"amount" numeric NOT NULL,
	"reason" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" text
);
--> statement-breakpoint
CREATE TABLE "ar_receipt_email" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"intent_id" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"to_addr" text NOT NULL,
	"status" text NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "ar_remittance_import" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"source" text NOT NULL,
	"filename" text,
	"uniq_hash" text NOT NULL,
	"rows_ok" integer DEFAULT 0 NOT NULL,
	"rows_err" integer DEFAULT 0 NOT NULL,
	"payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_saved_method" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"gateway" text NOT NULL,
	"token_ref" text NOT NULL,
	"brand" text,
	"last4" text,
	"exp_month" integer,
	"exp_year" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_statement_artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"kind" text NOT NULL,
	"filename" text NOT NULL,
	"sha256" text NOT NULL,
	"bytes" integer NOT NULL,
	"storage_uri" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_statement_email" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"to_addr" text NOT NULL,
	"sent_at" timestamp with time zone,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "ar_statement_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"doc_type" text NOT NULL,
	"doc_id" text,
	"doc_date" date NOT NULL,
	"due_date" date,
	"ref" text,
	"memo" text,
	"debit" numeric DEFAULT '0' NOT NULL,
	"credit" numeric DEFAULT '0' NOT NULL,
	"balance" numeric NOT NULL,
	"bucket" text NOT NULL,
	"currency" text NOT NULL,
	"sort_key" text
);
--> statement-breakpoint
CREATE TABLE "ar_statement_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"as_of_date" date NOT NULL,
	"policy_code" text,
	"present_ccy" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"totals_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_surcharge_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"pct" numeric DEFAULT '0' NOT NULL,
	"min_fee" numeric DEFAULT '0' NOT NULL,
	"cap_fee" numeric,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attest_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"scope_key" text NOT NULL,
	"assignee_id" uuid NOT NULL,
	"approver_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attest_campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"period" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"state" text DEFAULT 'DRAFT' NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attest_evidence_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"evd_record_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attest_pack" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"manifest" jsonb NOT NULL,
	"sha256" text NOT NULL,
	"signer_id" uuid NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attest_pack_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "attest_program" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"freq" text NOT NULL,
	"scope" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attest_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"exceptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attest_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"assignee_id" uuid NOT NULL,
	"scope_key" text NOT NULL,
	"state" "attest_task_state" DEFAULT 'OPEN' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approver_id" uuid,
	"sla_state" text DEFAULT 'OK' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attest_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"schema" jsonb NOT NULL,
	"requires_evidence" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_access_log" (
	"id" bigint PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"auditor_id" uuid NOT NULL,
	"session_id" uuid,
	"scope" "audit_grant_scope" NOT NULL,
	"object_id" text NOT NULL,
	"action" text NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_auditor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_dl_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grant_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"auditor_id" uuid NOT NULL,
	"scope" "audit_grant_scope" NOT NULL,
	"object_id" text NOT NULL,
	"can_download" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"auditor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"state" text DEFAULT 'OPEN' NOT NULL,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_request_msg" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"author_kind" text NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"evd_record_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"auditor_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"ip" text,
	"ua" text,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_watermark_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"text_template" text DEFAULT 'CONFIDENTIAL • {company} • {auditor_email} • {ts}' NOT NULL,
	"diagonal" boolean DEFAULT true NOT NULL,
	"opacity" numeric DEFAULT '0.15' NOT NULL,
	"font_size" numeric DEFAULT '24' NOT NULL,
	"font_color" text DEFAULT '#FF0000' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_ack" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bank_code" text NOT NULL,
	"ack_kind" text NOT NULL,
	"filename" text NOT NULL,
	"payload" text NOT NULL,
	"uniq_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_ack_map" (
	"id" text PRIMARY KEY NOT NULL,
	"ack_id" text NOT NULL,
	"run_id" text,
	"line_id" text,
	"status" text NOT NULL,
	"reason_code" text,
	"reason_label" text
);
--> statement-breakpoint
CREATE TABLE "bank_conn_profile" (
	"company_id" text NOT NULL,
	"bank_code" text NOT NULL,
	"kind" text NOT NULL,
	"config" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "bank_conn_profile_company_id_bank_code_pk" PRIMARY KEY("company_id","bank_code")
);
--> statement-breakpoint
CREATE TABLE "bank_fetch_cursor" (
	"company_id" text NOT NULL,
	"bank_code" text NOT NULL,
	"channel" text NOT NULL,
	"cursor" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_fetch_cursor_company_id_bank_code_channel_pk" PRIMARY KEY("company_id","bank_code","channel")
);
--> statement-breakpoint
CREATE TABLE "bank_file_import" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"filename" text NOT NULL,
	"payload" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uniq_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_inbox_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bank_code" text NOT NULL,
	"channel" text NOT NULL,
	"filename" text NOT NULL,
	"uniq_hash" text NOT NULL,
	"stored_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_job_log" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bank_code" text NOT NULL,
	"kind" text NOT NULL,
	"detail" text NOT NULL,
	"payload" text,
	"success" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text NOT NULL,
	"bank_code" text NOT NULL,
	"filename" text NOT NULL,
	"payload" text NOT NULL,
	"checksum" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bank_reason_norm" (
	"bank_code" text NOT NULL,
	"code" text NOT NULL,
	"norm_status" text NOT NULL,
	"norm_label" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_reason_norm_bank_code_code_pk" PRIMARY KEY("bank_code","code")
);
--> statement-breakpoint
CREATE TABLE "bank_txn_map" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bank_date" date NOT NULL,
	"amount" numeric NOT NULL,
	"ccy" text NOT NULL,
	"counterparty" text,
	"memo" text,
	"matched_run_id" text,
	"matched_line_id" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cert_signoff" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text NOT NULL,
	"level" text NOT NULL,
	"signer_role" text NOT NULL,
	"signer_name" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"statement_id" text NOT NULL,
	"statement_text" text NOT NULL,
	"snapshot_uri" text,
	"checksum" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cert_statement" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"text" text NOT NULL,
	"level" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cf_receipt_signal" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"week_start" date NOT NULL,
	"ccy" text NOT NULL,
	"amount" numeric NOT NULL,
	"source" text NOT NULL,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_dep" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"task_id" text NOT NULL,
	"depends_on_task_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "close_dep_unique" UNIQUE("task_id","depends_on_task_id")
);
--> statement-breakpoint
CREATE TABLE "close_ebinder" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"binder_name" text NOT NULL,
	"binder_type" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"manifest_ids" text[] DEFAULT '{}' NOT NULL,
	"total_manifests" integer DEFAULT 0 NOT NULL,
	"total_evidence_items" integer DEFAULT 0 NOT NULL,
	"total_size_bytes" bigint DEFAULT 0 NOT NULL,
	"binder_hash" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_by" text NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_downloaded_at" timestamp with time zone,
	"status" text DEFAULT 'GENERATED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"task_id" text NOT NULL,
	"kind" text NOT NULL,
	"uri_or_note" text NOT NULL,
	"added_by" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"period" text NOT NULL,
	"kind" "close_item_kind" NOT NULL,
	"ref_id" text NOT NULL,
	"title" text NOT NULL,
	"process" text NOT NULL,
	"owner_id" uuid,
	"due_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"severity" text DEFAULT 'NORMAL' NOT NULL,
	"aging_days" integer DEFAULT 0 NOT NULL,
	"sla_state" text DEFAULT 'OK' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_item_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb,
	"actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_item_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"mentions" uuid[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_item_evd_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"evd_record_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_kpi" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"metric" text NOT NULL,
	"value" numeric NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_lock" (
	"company_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"locked_by" text NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "close_lock_pk" UNIQUE("company_id","entity_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "close_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"materiality_abs" numeric DEFAULT '10000' NOT NULL,
	"materiality_pct" numeric DEFAULT '0.02' NOT NULL,
	"sla_default_hours" integer DEFAULT 72 NOT NULL,
	"reminder_cadence_mins" integer DEFAULT 60 NOT NULL,
	"tz" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"started_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"owner" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "close_run_unique" UNIQUE("company_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "close_sla_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"tz" text DEFAULT 'UTC' NOT NULL,
	"cutoff_day" smallint DEFAULT 5 NOT NULL,
	"grace_hours" smallint DEFAULT 24 NOT NULL,
	"escal1_hours" smallint DEFAULT 24 NOT NULL,
	"escal2_hours" smallint DEFAULT 48 NOT NULL,
	"escal_to_lvl1" uuid,
	"escal_to_lvl2" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_task" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"owner" text NOT NULL,
	"sla_due_at" timestamp with time zone,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"priority" integer DEFAULT 0,
	"tags" text[],
	"evidence_required" boolean DEFAULT false NOT NULL,
	"approver" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "close_task_unique" UNIQUE("run_id","code")
);
--> statement-breakpoint
CREATE TABLE "co_entity" (
	"company_id" text NOT NULL,
	"entity_code" text NOT NULL,
	"name" text NOT NULL,
	"base_ccy" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "co_entity_company_id_entity_code_pk" PRIMARY KEY("company_id","entity_code")
);
--> statement-breakpoint
CREATE TABLE "co_group" (
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"name" text NOT NULL,
	"presentation_ccy" text NOT NULL,
	CONSTRAINT "co_group_company_id_group_code_pk" PRIMARY KEY("company_id","group_code")
);
--> statement-breakpoint
CREATE TABLE "co_ownership" (
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"parent_code" text NOT NULL,
	"child_code" text NOT NULL,
	"pct" numeric NOT NULL,
	"eff_from" date NOT NULL,
	"eff_to" date,
	CONSTRAINT "co_ownership_company_id_group_code_parent_code_child_code_eff_from_pk" PRIMARY KEY("company_id","group_code","parent_code","child_code","eff_from")
);
--> statement-breakpoint
CREATE TABLE "comm_template" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consol_account_map" (
	"company_id" text NOT NULL,
	"purpose" text NOT NULL,
	"account" text NOT NULL,
	CONSTRAINT "consol_account_map_company_id_purpose_pk" PRIMARY KEY("company_id","purpose")
);
--> statement-breakpoint
CREATE TABLE "consol_cta_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"cta_account" text NOT NULL,
	"re_account" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consol_ledger_option" (
	"company_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"ledger_entity" text,
	"summary_account" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consol_lock" (
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	CONSTRAINT "consol_lock_company_id_group_code_year_month_pk" PRIMARY KEY("company_id","group_code","year","month")
);
--> statement-breakpoint
CREATE TABLE "consol_nci_map" (
	"company_id" text PRIMARY KEY NOT NULL,
	"nci_equity_account" text NOT NULL,
	"nci_ni_account" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consol_rate_override" (
	"company_id" text NOT NULL,
	"account" text NOT NULL,
	"method" text NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "consol_rate_override_company_id_account_pk" PRIMARY KEY("company_id","account")
);
--> statement-breakpoint
CREATE TABLE "consol_rate_policy" (
	"company_id" text NOT NULL,
	"class" text NOT NULL,
	"method" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "consol_rate_policy_company_id_class_pk" PRIMARY KEY("company_id","class")
);
--> statement-breakpoint
CREATE TABLE "consol_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"mode" text NOT NULL,
	"present_ccy" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consol_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"component" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"control_id" text NOT NULL,
	"run_id" text,
	"task_id" text,
	"entity_id" text,
	"owner" text NOT NULL,
	"approver" text NOT NULL,
	"sla_due_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_control" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"purpose" text NOT NULL,
	"domain" text NOT NULL,
	"frequency" text NOT NULL,
	"severity" text NOT NULL,
	"auto_kind" text NOT NULL,
	"auto_config" jsonb,
	"evidence_required" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"ctrl_run_id" text NOT NULL,
	"kind" text NOT NULL,
	"uri_or_note" text NOT NULL,
	"checksum" text,
	"added_by" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_evidence_attestation" (
	"id" text PRIMARY KEY NOT NULL,
	"manifest_id" text NOT NULL,
	"attestor_name" text NOT NULL,
	"attestor_role" text NOT NULL,
	"attestation_type" text NOT NULL,
	"digital_signature" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_evidence_item" (
	"id" text PRIMARY KEY NOT NULL,
	"manifest_id" text NOT NULL,
	"item_name" text NOT NULL,
	"item_type" text NOT NULL,
	"file_path" text,
	"content_hash" text NOT NULL,
	"size_bytes" bigint DEFAULT 0 NOT NULL,
	"mime_type" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"redacted" boolean DEFAULT false NOT NULL,
	"redaction_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_evidence_manifest" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"control_id" text NOT NULL,
	"run_id" text,
	"task_id" text,
	"bundle_name" text NOT NULL,
	"bundle_type" text NOT NULL,
	"manifest_hash" text NOT NULL,
	"content_hash" text NOT NULL,
	"size_bytes" bigint DEFAULT 0 NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"sealed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_exception" (
	"id" text PRIMARY KEY NOT NULL,
	"ctrl_run_id" text NOT NULL,
	"code" text NOT NULL,
	"message" text NOT NULL,
	"item_ref" text,
	"material" boolean DEFAULT false NOT NULL,
	"remediation_state" text DEFAULT 'OPEN' NOT NULL,
	"assignee" text,
	"due_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_result" (
	"id" text PRIMARY KEY NOT NULL,
	"ctrl_run_id" text NOT NULL,
	"status" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"exceptions_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctrl_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"control_id" text NOT NULL,
	"assignment_id" text,
	"run_id" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_attestation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"binder_id" uuid NOT NULL,
	"signer_id" text NOT NULL,
	"signer_role" text NOT NULL,
	"payload" jsonb NOT NULL,
	"sha256_hex" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_binder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"scope_kind" text NOT NULL,
	"scope_id" text NOT NULL,
	"manifest_id" uuid NOT NULL,
	"format" text NOT NULL,
	"storage_uri" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256_hex" text NOT NULL,
	"built_by" text NOT NULL,
	"built_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"record_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"ref_id" text NOT NULL,
	"added_by" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_manifest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"scope_kind" text NOT NULL,
	"scope_id" text NOT NULL,
	"filters" jsonb NOT NULL,
	"object_count" integer NOT NULL,
	"total_bytes" bigint NOT NULL,
	"sha256_hex" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_manifest_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manifest_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"object_sha256" text NOT NULL,
	"object_bytes" bigint NOT NULL,
	"title" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_object" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"sha256_hex" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"mime" text NOT NULL,
	"storage_uri" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"object_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"tags" text[] DEFAULT '{}',
	"pii_level" text DEFAULT 'NONE' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evd_redaction_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"rule" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flux_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"line_id" text NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flux_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"account_code" text NOT NULL,
	"dim_key" text,
	"base_amount" numeric DEFAULT '0' NOT NULL,
	"cmp_amount" numeric DEFAULT '0' NOT NULL,
	"delta" numeric DEFAULT '0' NOT NULL,
	"delta_pct" numeric DEFAULT '0' NOT NULL,
	"requires_comment" boolean DEFAULT false NOT NULL,
	"material" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flux_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"scope" text NOT NULL,
	"dim" text NOT NULL,
	"threshold_abs" numeric,
	"threshold_pct" numeric,
	"require_comment" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flux_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"base_year" integer NOT NULL,
	"base_month" integer NOT NULL,
	"cmp_year" integer NOT NULL,
	"cmp_month" integer NOT NULL,
	"present_ccy" text NOT NULL,
	"status" text DEFAULT 'RUNNING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ic_elim_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"entity_code" text NOT NULL,
	"cp_code" text NOT NULL,
	"amount_base" numeric NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "ic_elim_lock" (
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	CONSTRAINT "ic_elim_lock_company_id_group_code_year_month_pk" PRIMARY KEY("company_id","group_code","year","month")
);
--> statement-breakpoint
CREATE TABLE "ic_elim_map" (
	"company_id" text NOT NULL,
	"rule_code" text NOT NULL,
	"src_account_like" text,
	"cp_account_like" text,
	"note" text,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "ic_elim_map_company_id_rule_code_pk" PRIMARY KEY("company_id","rule_code")
);
--> statement-breakpoint
CREATE TABLE "ic_elim_rule_lock" (
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"rule_code" text NOT NULL,
	CONSTRAINT "ic_elim_rule_lock_company_id_group_code_year_month_rule_code_pk" PRIMARY KEY("company_id","group_code","year","month","rule_code")
);
--> statement-breakpoint
CREATE TABLE "ic_elim_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ic_link" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"entity_code" text NOT NULL,
	"co_entity_cp" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"ext_ref" text,
	"amount_base" numeric NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ic_match" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"tolerance" numeric DEFAULT '0.01' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ic_match_line" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"ic_link_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ic_match_proposal" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"group_code" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"score" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ic_match_proposal_line" (
	"id" text PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"ic_link_id" text NOT NULL,
	"hint" text
);
--> statement-breakpoint
CREATE TABLE "ic_workbench_decision" (
	"id" text PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"decided_by" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_anomaly" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"kind" text NOT NULL,
	"signal" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" numeric NOT NULL,
	"severity" text NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_bench_baseline" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"entity_group" text NOT NULL,
	"metric" text NOT NULL,
	"granularity" text NOT NULL,
	"value" numeric NOT NULL,
	"p50" numeric NOT NULL,
	"p75" numeric NOT NULL,
	"p90" numeric NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_bench_target" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"metric" text NOT NULL,
	"target" numeric NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_fact_cert" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"level" text NOT NULL,
	"signer_role" text NOT NULL,
	"signed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_fact_close" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"entity_id" text,
	"run_id" text,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"days_to_close" numeric NOT NULL,
	"on_time_rate" numeric NOT NULL,
	"late_tasks" integer DEFAULT 0 NOT NULL,
	"exceptions_open" integer DEFAULT 0 NOT NULL,
	"exceptions_material" integer DEFAULT 0 NOT NULL,
	"certs_done" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_fact_ctrl" (
	"id" text PRIMARY KEY NOT NULL,
	"ctrl_run_id" text NOT NULL,
	"control_code" text NOT NULL,
	"status" text NOT NULL,
	"severity" text NOT NULL,
	"exceptions_count" integer DEFAULT 0 NOT NULL,
	"waived" integer DEFAULT 0 NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"material_fail" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_fact_flux" (
	"id" text PRIMARY KEY NOT NULL,
	"flux_run_id" text NOT NULL,
	"scope" text NOT NULL,
	"present_ccy" text NOT NULL,
	"material" integer DEFAULT 0 NOT NULL,
	"comment_missing" integer DEFAULT 0 NOT NULL,
	"top_delta_abs" numeric DEFAULT '0' NOT NULL,
	"top_delta_pct" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_fact_task" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"task_id" text NOT NULL,
	"code" text NOT NULL,
	"owner" text NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"sla_due_at" timestamp with time zone,
	"status" text NOT NULL,
	"age_hours" numeric DEFAULT '0' NOT NULL,
	"breached" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ins_reco" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"reco_code" text NOT NULL,
	"title" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"impact_estimate" numeric DEFAULT '0' NOT NULL,
	"effort" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acted_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_breakglass" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"system_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ticket" text NOT NULL,
	"reason" text NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" text
);
--> statement-breakpoint
CREATE TABLE "it_connector_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"system_id" uuid NOT NULL,
	"connector" "it_connector" NOT NULL,
	"settings" jsonb NOT NULL,
	"secret_ref" uuid,
	"schedule_cron" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_entitlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"system_id" uuid NOT NULL,
	"kind" "it_entitlement_kind" NOT NULL,
	"code" text NOT NULL,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "it_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"system_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"source" "it_grant_source" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"system_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"critical" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scope" "it_snapshot_scope" NOT NULL,
	"sha256" text NOT NULL,
	"evd_record_id" uuid
);
--> statement-breakpoint
CREATE TABLE "it_sod_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"severity" "it_sod_severity" NOT NULL,
	"logic" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_sod_violation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"rule_id" uuid NOT NULL,
	"system_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "it_sod_violation_status" DEFAULT 'OPEN' NOT NULL,
	"note" text,
	"explanation" jsonb
);
--> statement-breakpoint
CREATE TABLE "it_system" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"kind" "it_system_kind" NOT NULL,
	"owner_user_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"system_id" uuid NOT NULL,
	"ext_id" text NOT NULL,
	"email" text,
	"display_name" text,
	"status" "it_user_status" NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mdna_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"template_id" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'EDITING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mdna_publish" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"draft_id" text NOT NULL,
	"html_uri" text NOT NULL,
	"checksum" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mdna_template" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"sections" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_billing_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"present_ccy" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"stats" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_contract" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"book_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"terms" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_credit_apply" (
	"id" text PRIMARY KEY NOT NULL,
	"memo_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_credit_memo" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"present_ccy" text NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"present_ccy" text NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"subtotal" numeric DEFAULT '0' NOT NULL,
	"tax_total" numeric DEFAULT '0' NOT NULL,
	"total" numeric DEFAULT '0' NOT NULL,
	"fx_present_rate" numeric,
	"portal_link" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_invoice_artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"kind" text NOT NULL,
	"filename" text NOT NULL,
	"sha256" text NOT NULL,
	"bytes" integer NOT NULL,
	"storage_uri" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_invoice_email" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"to_addr" text NOT NULL,
	"sent_at" timestamp with time zone,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "rb_invoice_line" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"product_id" text,
	"description" text NOT NULL,
	"qty" numeric DEFAULT '1' NOT NULL,
	"unit" text,
	"unit_price" numeric NOT NULL,
	"line_subtotal" numeric NOT NULL,
	"tax_code" text,
	"tax_amount" numeric DEFAULT '0' NOT NULL,
	"line_total" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_post_lock" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_price" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"product_id" text NOT NULL,
	"book_id" text NOT NULL,
	"model" text NOT NULL,
	"unit_amount" numeric,
	"unit" text,
	"interval" text,
	"interval_count" integer DEFAULT 1,
	"min_qty" numeric DEFAULT '0',
	"max_qty" numeric,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "rb_price_book" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"currency" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_product" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"gl_rev_acct" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"contract_id" text NOT NULL,
	"product_id" text NOT NULL,
	"price_id" text NOT NULL,
	"qty" numeric DEFAULT '1' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"bill_anchor" date NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"proration" text DEFAULT 'DAILY' NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "rb_usage_event" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"event_time" timestamp with time zone NOT NULL,
	"quantity" numeric NOT NULL,
	"unit" text NOT NULL,
	"uniq_hash" text NOT NULL,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "rb_usage_rollup" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"unit" text NOT NULL,
	"qty" numeric NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "rb_usage_source" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"config" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_alloc_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"run_id" text NOT NULL,
	"method" text NOT NULL,
	"strategy" text NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"corridor_flag" boolean DEFAULT false NOT NULL,
	"total_invoice_amount" numeric NOT NULL,
	"total_allocated_amount" numeric NOT NULL,
	"rounding_adjustment" numeric DEFAULT '0',
	"processing_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_alloc_link" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"invoice_line_id" text NOT NULL,
	"line_txn_amount" numeric NOT NULL,
	"allocated_to_pob" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"kind" text NOT NULL,
	"filename" text NOT NULL,
	"sha256" text NOT NULL,
	"bytes" integer NOT NULL,
	"storage_uri" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_bundle" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bundle_sku" text NOT NULL,
	"name" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "rev_bundle_unique_active" UNIQUE("company_id","bundle_sku","effective_from")
);
--> statement-breakpoint
CREATE TABLE "rev_bundle_component" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_id" text NOT NULL,
	"product_id" text NOT NULL,
	"weight_pct" numeric NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"min_qty" numeric DEFAULT '1',
	"max_qty" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_change_line" (
	"id" text PRIMARY KEY NOT NULL,
	"change_order_id" text NOT NULL,
	"pob_id" text,
	"product_id" text,
	"qty_delta" numeric,
	"price_delta" numeric,
	"term_delta_days" integer,
	"new_method" text,
	"new_ssp" numeric
);
--> statement-breakpoint
CREATE TABLE "rev_change_order" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"contract_id" text NOT NULL,
	"effective_date" date NOT NULL,
	"type" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_discount_applied" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"rule_id" text NOT NULL,
	"computed_amount" numeric NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_discount_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"priority" integer DEFAULT 0,
	"max_usage_count" integer,
	"max_usage_amount" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "rev_discount_rule_unique_active" UNIQUE("company_id","code","effective_from")
);
--> statement-breakpoint
CREATE TABLE "rev_event" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_mod_register" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"contract_id" text NOT NULL,
	"change_order_id" text NOT NULL,
	"effective_date" date NOT NULL,
	"type" text NOT NULL,
	"reason" text,
	"txn_price_before" numeric NOT NULL,
	"txn_price_after" numeric NOT NULL,
	"txn_price_delta" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_pob" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"contract_id" text NOT NULL,
	"subscription_id" text,
	"invoice_line_id" text,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"method" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"qty" numeric DEFAULT '1' NOT NULL,
	"uom" text,
	"ssp" numeric,
	"allocated_amount" numeric NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"rev_account" text NOT NULL,
	"unbilled_ar_account" text NOT NULL,
	"deferred_rev_account" text NOT NULL,
	"rounding" text DEFAULT 'HALF_UP' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_post_lock" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_by" text NOT NULL,
	CONSTRAINT "rev_post_lock_unique" UNIQUE("company_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "rev_prod_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"product_id" text NOT NULL,
	"method" text NOT NULL,
	"rev_account" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "rev_prod_policy_unique" UNIQUE("company_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "rev_rec_catchup" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"catchup_amount" numeric NOT NULL,
	"dr_account" text NOT NULL,
	"cr_account" text NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_rec_line" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"company_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"amount" numeric NOT NULL,
	"dr_account" text NOT NULL,
	"cr_account" text NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_rec_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"stats" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "rev_rec_run_unique" UNIQUE("company_id","period_year","period_month")
);
--> statement-breakpoint
CREATE TABLE "rev_rpo_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"as_of_date" date NOT NULL,
	"currency" text NOT NULL,
	"total_rpo" numeric DEFAULT '0' NOT NULL,
	"due_within_12m" numeric DEFAULT '0' NOT NULL,
	"due_after_12m" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "rev_rpo_snapshot_unique" UNIQUE("company_id","as_of_date","currency")
);
--> statement-breakpoint
CREATE TABLE "rev_sched_rev" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"from_period_year" integer NOT NULL,
	"from_period_month" integer NOT NULL,
	"planned_before" numeric NOT NULL,
	"planned_after" numeric NOT NULL,
	"delta_planned" numeric NOT NULL,
	"cause" text NOT NULL,
	"change_order_id" text,
	"vc_estimate_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"planned" numeric NOT NULL,
	"recognized" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rev_schedule_unique" UNIQUE("company_id","pob_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "rev_ssp_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"product_id" text NOT NULL,
	"currency" text NOT NULL,
	"ssp" numeric NOT NULL,
	"method" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"corridor_min_pct" numeric,
	"corridor_max_pct" numeric,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "rev_ssp_catalog_unique_active" UNIQUE("company_id","product_id","currency","effective_from")
);
--> statement-breakpoint
CREATE TABLE "rev_ssp_change" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"requestor" text NOT NULL,
	"reason" text NOT NULL,
	"diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"decision_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_ssp_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"source" text NOT NULL,
	"note" text,
	"value" numeric,
	"doc_uri" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_ssp_policy" (
	"company_id" text PRIMARY KEY NOT NULL,
	"rounding" text DEFAULT 'HALF_UP' NOT NULL,
	"residual_allowed" boolean DEFAULT true NOT NULL,
	"residual_eligible_products" jsonb DEFAULT '[]'::jsonb,
	"default_method" text DEFAULT 'OBSERVABLE' NOT NULL,
	"corridor_tolerance_pct" numeric DEFAULT '0.20',
	"alert_threshold_pct" numeric DEFAULT '0.15',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_txn_price_rev" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"change_order_id" text NOT NULL,
	"previous_total_tp" numeric NOT NULL,
	"new_total_tp" numeric NOT NULL,
	"allocated_deltas" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_usage_bridge" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"rollup_id" text NOT NULL,
	"qty" numeric NOT NULL,
	"rated_amount" numeric NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rev_usage_bridge_unique" UNIQUE("company_id","pob_id","rollup_id")
);
--> statement-breakpoint
CREATE TABLE "rev_vc_estimate" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"contract_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"method" text NOT NULL,
	"raw_estimate" numeric NOT NULL,
	"constrained_amount" numeric NOT NULL,
	"confidence" numeric NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_vc_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"default_method" text NOT NULL,
	"constraint_probability_threshold" numeric DEFAULT '0.5' NOT NULL,
	"volatility_lookback_months" integer DEFAULT 12 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rev_vc_rollforward" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"contract_id" text NOT NULL,
	"pob_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"opening_balance" numeric DEFAULT '0' NOT NULL,
	"additions" numeric DEFAULT '0' NOT NULL,
	"changes" numeric DEFAULT '0' NOT NULL,
	"releases" numeric DEFAULT '0' NOT NULL,
	"recognized" numeric DEFAULT '0' NOT NULL,
	"closing_balance" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sanction_adapter_profile" (
	"company_id" text NOT NULL,
	"adapter" text NOT NULL,
	"config" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "sanction_adapter_profile_company_id_adapter_pk" PRIMARY KEY("company_id","adapter")
);
--> statement-breakpoint
CREATE TABLE "sanction_denylist" (
	"company_id" text NOT NULL,
	"name_norm" text NOT NULL,
	"country" text,
	"source" text,
	"listed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sanction_hit" (
	"id" text PRIMARY KEY NOT NULL,
	"screen_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"name_norm" text NOT NULL,
	"match_score" numeric NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "sanction_screen_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"run_id" text,
	"supplier_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secret_ref" (
	"name" text PRIMARY KEY NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "sox_assertion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"period" text NOT NULL,
	"type" text NOT NULL,
	"statement" jsonb NOT NULL,
	"ebinder_id" uuid,
	"signed_by" text NOT NULL,
	"signed_role" text NOT NULL,
	"sha256_hex" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sox_control_scope" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"control_id" uuid NOT NULL,
	"period" text NOT NULL,
	"in_scope" boolean DEFAULT true NOT NULL,
	"materiality" numeric(18, 2),
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sox_deficiency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"control_id" uuid,
	"discovered_in" text NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"root_cause" text,
	"aggregation_id" uuid,
	"rem_owner_id" text,
	"remediation_plan" text,
	"remediation_due" date,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sox_deficiency_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deficiency_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sox_key_control" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"process" text NOT NULL,
	"risk_stmt" text NOT NULL,
	"assertion" text NOT NULL,
	"frequency" text NOT NULL,
	"automation" text NOT NULL,
	"owner_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sox_test_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"control_id" uuid NOT NULL,
	"period" text NOT NULL,
	"attributes" jsonb NOT NULL,
	"sample_method" text NOT NULL,
	"sample_size" integer NOT NULL,
	"prepared_by" text NOT NULL,
	"prepared_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"status" text DEFAULT 'DRAFT' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sox_test_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"sample_id" uuid,
	"attribute" text NOT NULL,
	"outcome" text NOT NULL,
	"note" text,
	"evd_record_id" uuid,
	"tested_by" text NOT NULL,
	"tested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sox_test_sample" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"picked_reason" text
);
--> statement-breakpoint
CREATE TABLE "tax_code" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"rate" numeric DEFAULT '0' NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uar_campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" "uar_campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uar_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"company_id" text NOT NULL,
	"system_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"owner_user_id" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"state" "uar_item_state" DEFAULT 'PENDING' NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"exception_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uar_pack" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"sha256" text NOT NULL,
	"evd_record_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "class" text;--> statement-breakpoint
ALTER TABLE "ar_cash_app_link" ADD CONSTRAINT "ar_cash_app_link_cash_app_id_ar_cash_app_id_fk" FOREIGN KEY ("cash_app_id") REFERENCES "public"."ar_cash_app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_checkout_txn" ADD CONSTRAINT "ar_checkout_txn_intent_id_ar_checkout_intent_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."ar_checkout_intent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statement_artifact" ADD CONSTRAINT "ar_statement_artifact_run_id_ar_statement_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ar_statement_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statement_email" ADD CONSTRAINT "ar_statement_email_run_id_ar_statement_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ar_statement_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statement_line" ADD CONSTRAINT "ar_statement_line_run_id_ar_statement_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ar_statement_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attest_assignment" ADD CONSTRAINT "attest_assignment_program_id_attest_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."attest_program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attest_campaign" ADD CONSTRAINT "attest_campaign_program_id_attest_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."attest_program"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attest_campaign" ADD CONSTRAINT "attest_campaign_template_id_attest_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."attest_template"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attest_evidence_link" ADD CONSTRAINT "attest_evidence_link_task_id_attest_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."attest_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attest_pack" ADD CONSTRAINT "attest_pack_task_id_attest_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."attest_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attest_response" ADD CONSTRAINT "attest_response_task_id_attest_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."attest_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attest_task" ADD CONSTRAINT "attest_task_campaign_id_attest_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."attest_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_dl_key" ADD CONSTRAINT "audit_dl_key_grant_id_audit_grant_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."audit_grant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_grant" ADD CONSTRAINT "audit_grant_auditor_id_audit_auditor_id_fk" FOREIGN KEY ("auditor_id") REFERENCES "public"."audit_auditor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_request" ADD CONSTRAINT "audit_request_auditor_id_audit_auditor_id_fk" FOREIGN KEY ("auditor_id") REFERENCES "public"."audit_auditor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_request_msg" ADD CONSTRAINT "audit_request_msg_request_id_audit_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."audit_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_session" ADD CONSTRAINT "audit_session_auditor_id_audit_auditor_id_fk" FOREIGN KEY ("auditor_id") REFERENCES "public"."audit_auditor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cert_signoff" ADD CONSTRAINT "cert_signoff_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cert_signoff" ADD CONSTRAINT "cert_signoff_statement_id_cert_statement_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."cert_statement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_dep" ADD CONSTRAINT "close_dep_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_dep" ADD CONSTRAINT "close_dep_task_id_close_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."close_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_dep" ADD CONSTRAINT "close_dep_depends_on_task_id_close_task_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."close_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_evidence" ADD CONSTRAINT "close_evidence_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_evidence" ADD CONSTRAINT "close_evidence_task_id_close_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."close_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_item_action" ADD CONSTRAINT "close_item_action_item_id_close_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."close_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_item_comment" ADD CONSTRAINT "close_item_comment_item_id_close_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."close_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_item_evd_link" ADD CONSTRAINT "close_item_evd_link_item_id_close_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."close_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_kpi" ADD CONSTRAINT "close_kpi_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_task" ADD CONSTRAINT "close_task_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_assignment" ADD CONSTRAINT "ctrl_assignment_control_id_ctrl_control_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."ctrl_control"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_assignment" ADD CONSTRAINT "ctrl_assignment_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_assignment" ADD CONSTRAINT "ctrl_assignment_task_id_close_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."close_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_evidence" ADD CONSTRAINT "ctrl_evidence_ctrl_run_id_ctrl_run_id_fk" FOREIGN KEY ("ctrl_run_id") REFERENCES "public"."ctrl_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_exception" ADD CONSTRAINT "ctrl_exception_ctrl_run_id_ctrl_run_id_fk" FOREIGN KEY ("ctrl_run_id") REFERENCES "public"."ctrl_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_result" ADD CONSTRAINT "ctrl_result_ctrl_run_id_ctrl_run_id_fk" FOREIGN KEY ("ctrl_run_id") REFERENCES "public"."ctrl_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_run" ADD CONSTRAINT "ctrl_run_control_id_ctrl_control_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."ctrl_control"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_run" ADD CONSTRAINT "ctrl_run_assignment_id_ctrl_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."ctrl_assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctrl_run" ADD CONSTRAINT "ctrl_run_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evd_attestation" ADD CONSTRAINT "evd_attestation_binder_id_evd_binder_id_fk" FOREIGN KEY ("binder_id") REFERENCES "public"."evd_binder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evd_binder" ADD CONSTRAINT "evd_binder_manifest_id_evd_manifest_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."evd_manifest"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evd_link" ADD CONSTRAINT "evd_link_record_id_evd_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."evd_record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evd_manifest_line" ADD CONSTRAINT "evd_manifest_line_manifest_id_evd_manifest_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."evd_manifest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evd_manifest_line" ADD CONSTRAINT "evd_manifest_line_record_id_evd_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."evd_record"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evd_record" ADD CONSTRAINT "evd_record_object_id_evd_object_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."evd_object"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flux_comment" ADD CONSTRAINT "flux_comment_run_id_flux_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."flux_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flux_comment" ADD CONSTRAINT "flux_comment_line_id_flux_line_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."flux_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flux_line" ADD CONSTRAINT "flux_line_run_id_flux_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."flux_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flux_run" ADD CONSTRAINT "flux_run_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_anomaly" ADD CONSTRAINT "ins_anomaly_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_fact_cert" ADD CONSTRAINT "ins_fact_cert_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_fact_close" ADD CONSTRAINT "ins_fact_close_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_fact_ctrl" ADD CONSTRAINT "ins_fact_ctrl_ctrl_run_id_ctrl_run_id_fk" FOREIGN KEY ("ctrl_run_id") REFERENCES "public"."ctrl_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_fact_flux" ADD CONSTRAINT "ins_fact_flux_flux_run_id_flux_run_id_fk" FOREIGN KEY ("flux_run_id") REFERENCES "public"."flux_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_fact_task" ADD CONSTRAINT "ins_fact_task_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_fact_task" ADD CONSTRAINT "ins_fact_task_task_id_close_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."close_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ins_reco" ADD CONSTRAINT "ins_reco_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_breakglass" ADD CONSTRAINT "it_breakglass_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_breakglass" ADD CONSTRAINT "it_breakglass_user_id_it_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."it_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_connector_profile" ADD CONSTRAINT "it_connector_profile_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_entitlement" ADD CONSTRAINT "it_entitlement_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_grant" ADD CONSTRAINT "it_grant_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_grant" ADD CONSTRAINT "it_grant_user_id_it_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."it_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_grant" ADD CONSTRAINT "it_grant_entitlement_id_it_entitlement_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."it_entitlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_role" ADD CONSTRAINT "it_role_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_sod_violation" ADD CONSTRAINT "it_sod_violation_rule_id_it_sod_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."it_sod_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_sod_violation" ADD CONSTRAINT "it_sod_violation_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_sod_violation" ADD CONSTRAINT "it_sod_violation_user_id_it_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."it_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_user" ADD CONSTRAINT "it_user_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdna_draft" ADD CONSTRAINT "mdna_draft_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdna_draft" ADD CONSTRAINT "mdna_draft_template_id_mdna_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."mdna_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdna_publish" ADD CONSTRAINT "mdna_publish_run_id_close_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."close_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdna_publish" ADD CONSTRAINT "mdna_publish_draft_id_mdna_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."mdna_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_contract" ADD CONSTRAINT "rb_contract_book_id_rb_price_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."rb_price_book"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_credit_apply" ADD CONSTRAINT "rb_credit_apply_memo_id_rb_credit_memo_id_fk" FOREIGN KEY ("memo_id") REFERENCES "public"."rb_credit_memo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_credit_apply" ADD CONSTRAINT "rb_credit_apply_invoice_id_rb_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."rb_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_invoice_artifact" ADD CONSTRAINT "rb_invoice_artifact_invoice_id_rb_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."rb_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_invoice_email" ADD CONSTRAINT "rb_invoice_email_invoice_id_rb_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."rb_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_invoice_line" ADD CONSTRAINT "rb_invoice_line_invoice_id_rb_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."rb_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_price" ADD CONSTRAINT "rb_price_product_id_rb_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."rb_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_price" ADD CONSTRAINT "rb_price_book_id_rb_price_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."rb_price_book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_subscription" ADD CONSTRAINT "rb_subscription_contract_id_rb_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rb_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_subscription" ADD CONSTRAINT "rb_subscription_product_id_rb_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."rb_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_subscription" ADD CONSTRAINT "rb_subscription_price_id_rb_price_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."rb_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rb_usage_event" ADD CONSTRAINT "rb_usage_event_subscription_id_rb_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."rb_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_alloc_link" ADD CONSTRAINT "rev_alloc_link_pob_id_rev_pob_id_fk" FOREIGN KEY ("pob_id") REFERENCES "public"."rev_pob"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_artifact" ADD CONSTRAINT "rev_artifact_run_id_rev_rec_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."rev_rec_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_bundle_component" ADD CONSTRAINT "rev_bundle_component_bundle_id_rev_bundle_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."rev_bundle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_bundle_component" ADD CONSTRAINT "rev_bundle_component_product_id_rb_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."rb_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_change_line" ADD CONSTRAINT "rev_change_line_change_order_id_rev_change_order_id_fk" FOREIGN KEY ("change_order_id") REFERENCES "public"."rev_change_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_change_line" ADD CONSTRAINT "rev_change_line_product_id_rb_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."rb_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_change_order" ADD CONSTRAINT "rev_change_order_contract_id_rb_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rb_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_discount_applied" ADD CONSTRAINT "rev_discount_applied_rule_id_rev_discount_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rev_discount_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_event" ADD CONSTRAINT "rev_event_pob_id_rev_pob_id_fk" FOREIGN KEY ("pob_id") REFERENCES "public"."rev_pob"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_mod_register" ADD CONSTRAINT "rev_mod_register_contract_id_rb_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rb_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_mod_register" ADD CONSTRAINT "rev_mod_register_change_order_id_rev_change_order_id_fk" FOREIGN KEY ("change_order_id") REFERENCES "public"."rev_change_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_pob" ADD CONSTRAINT "rev_pob_contract_id_rb_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rb_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_pob" ADD CONSTRAINT "rev_pob_subscription_id_rb_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."rb_subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_pob" ADD CONSTRAINT "rev_pob_product_id_rb_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."rb_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_prod_policy" ADD CONSTRAINT "rev_prod_policy_product_id_rb_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."rb_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_rec_line" ADD CONSTRAINT "rev_rec_line_run_id_rev_rec_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."rev_rec_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_rec_line" ADD CONSTRAINT "rev_rec_line_pob_id_rev_pob_id_fk" FOREIGN KEY ("pob_id") REFERENCES "public"."rev_pob"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_sched_rev" ADD CONSTRAINT "rev_sched_rev_change_order_id_rev_change_order_id_fk" FOREIGN KEY ("change_order_id") REFERENCES "public"."rev_change_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_sched_rev" ADD CONSTRAINT "rev_sched_rev_vc_estimate_id_rev_vc_estimate_id_fk" FOREIGN KEY ("vc_estimate_id") REFERENCES "public"."rev_vc_estimate"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_schedule" ADD CONSTRAINT "rev_schedule_pob_id_rev_pob_id_fk" FOREIGN KEY ("pob_id") REFERENCES "public"."rev_pob"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_ssp_catalog" ADD CONSTRAINT "rev_ssp_catalog_product_id_rb_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."rb_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_ssp_evidence" ADD CONSTRAINT "rev_ssp_evidence_catalog_id_rev_ssp_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."rev_ssp_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_txn_price_rev" ADD CONSTRAINT "rev_txn_price_rev_change_order_id_rev_change_order_id_fk" FOREIGN KEY ("change_order_id") REFERENCES "public"."rev_change_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_usage_bridge" ADD CONSTRAINT "rev_usage_bridge_pob_id_rev_pob_id_fk" FOREIGN KEY ("pob_id") REFERENCES "public"."rev_pob"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_vc_estimate" ADD CONSTRAINT "rev_vc_estimate_contract_id_rb_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rb_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rev_vc_rollforward" ADD CONSTRAINT "rev_vc_rollforward_contract_id_rb_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rb_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_assertion" ADD CONSTRAINT "sox_assertion_ebinder_id_evd_binder_id_fk" FOREIGN KEY ("ebinder_id") REFERENCES "public"."evd_binder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_control_scope" ADD CONSTRAINT "sox_control_scope_control_id_sox_key_control_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."sox_key_control"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_deficiency" ADD CONSTRAINT "sox_deficiency_control_id_sox_key_control_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."sox_key_control"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_deficiency" ADD CONSTRAINT "sox_deficiency_aggregation_id_sox_deficiency_id_fk" FOREIGN KEY ("aggregation_id") REFERENCES "public"."sox_deficiency"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_deficiency_link" ADD CONSTRAINT "sox_deficiency_link_deficiency_id_sox_deficiency_id_fk" FOREIGN KEY ("deficiency_id") REFERENCES "public"."sox_deficiency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_test_plan" ADD CONSTRAINT "sox_test_plan_control_id_sox_key_control_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."sox_key_control"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_test_result" ADD CONSTRAINT "sox_test_result_plan_id_sox_test_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."sox_test_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_test_result" ADD CONSTRAINT "sox_test_result_sample_id_sox_test_sample_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."sox_test_sample"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_test_result" ADD CONSTRAINT "sox_test_result_evd_record_id_evd_record_id_fk" FOREIGN KEY ("evd_record_id") REFERENCES "public"."evd_record"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sox_test_sample" ADD CONSTRAINT "sox_test_sample_plan_id_sox_test_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."sox_test_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uar_item" ADD CONSTRAINT "uar_item_campaign_id_uar_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."uar_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uar_item" ADD CONSTRAINT "uar_item_system_id_it_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."it_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uar_item" ADD CONSTRAINT "uar_item_user_id_it_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."it_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uar_pack" ADD CONSTRAINT "uar_pack_campaign_id_uar_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."uar_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_access_log_company_auditor_ts" ON "audit_access_log" USING btree ("company_id","auditor_id","ts");--> statement-breakpoint
CREATE INDEX "idx_audit_access_log_session_action_ts" ON "audit_access_log" USING btree ("session_id","action","ts");--> statement-breakpoint
CREATE INDEX "idx_audit_auditor_company_email" ON "audit_auditor" USING btree ("company_id","email");--> statement-breakpoint
CREATE INDEX "idx_audit_auditor_company_status" ON "audit_auditor" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_audit_dl_key_grant_expires" ON "audit_dl_key" USING btree ("grant_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_audit_dl_key_key_hash_expires" ON "audit_dl_key" USING btree ("key_hash","expires_at");--> statement-breakpoint
CREATE INDEX "idx_audit_grant_auditor_expires" ON "audit_grant" USING btree ("auditor_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_audit_grant_scope_object" ON "audit_grant" USING btree ("scope","object_id");--> statement-breakpoint
CREATE INDEX "idx_audit_grant_company_scope_object" ON "audit_grant" USING btree ("company_id","scope","object_id");--> statement-breakpoint
CREATE INDEX "idx_audit_request_company_state_due" ON "audit_request" USING btree ("company_id","state","due_at");--> statement-breakpoint
CREATE INDEX "idx_audit_request_auditor_state" ON "audit_request" USING btree ("auditor_id","state","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_request_msg_request_created" ON "audit_request_msg" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_session_auditor_expires" ON "audit_session" USING btree ("auditor_id","expires_at");--> statement-breakpoint
CREATE INDEX "close_dep_task_idx" ON "close_dep" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "close_dep_depends_idx" ON "close_dep" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX "close_evidence_task_idx" ON "close_evidence" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "close_evidence_run_idx" ON "close_evidence" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "close_evidence_kind_idx" ON "close_evidence" USING btree ("kind","added_at");--> statement-breakpoint
CREATE INDEX "close_kpi_company_metric_idx" ON "close_kpi" USING btree ("company_id","metric","computed_at");--> statement-breakpoint
CREATE INDEX "close_kpi_run_idx" ON "close_kpi" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "close_kpi_computed_idx" ON "close_kpi" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "close_kpi_metric_value_idx" ON "close_kpi" USING btree ("metric","value","computed_at");--> statement-breakpoint
CREATE INDEX "close_lock_period_idx" ON "close_lock" USING btree ("company_id","year","month");--> statement-breakpoint
CREATE INDEX "close_run_company_period_idx" ON "close_run" USING btree ("company_id","year","month");--> statement-breakpoint
CREATE INDEX "close_run_status_idx" ON "close_run" USING btree ("company_id","status","started_at");--> statement-breakpoint
CREATE INDEX "close_run_owner_status_idx" ON "close_run" USING btree ("owner","status","started_at");--> statement-breakpoint
CREATE INDEX "close_run_closed_at_idx" ON "close_run" USING btree ("closed_at");--> statement-breakpoint
CREATE INDEX "close_task_run_status_idx" ON "close_task" USING btree ("run_id","status");--> statement-breakpoint
CREATE INDEX "close_task_status_sla_idx" ON "close_task" USING btree ("status","sla_due_at");--> statement-breakpoint
CREATE INDEX "close_task_owner_idx" ON "close_task" USING btree ("owner","status");--> statement-breakpoint
CREATE INDEX "close_task_priority_status_idx" ON "close_task" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "flux_comment_line_idx" ON "flux_comment" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "flux_comment_run_idx" ON "flux_comment" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "flux_line_run_idx" ON "flux_line" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "flux_line_material_idx" ON "flux_line" USING btree ("material");--> statement-breakpoint
CREATE INDEX "flux_line_account_idx" ON "flux_line" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX "flux_line_material_desc_idx" ON "flux_line" USING btree ("material","delta");--> statement-breakpoint
CREATE INDEX "flux_rule_company_scope_idx" ON "flux_rule" USING btree ("company_id","scope","active");--> statement-breakpoint
CREATE INDEX "flux_run_company_period_idx" ON "flux_run" USING btree ("company_id","cmp_year","cmp_month");--> statement-breakpoint
CREATE INDEX "flux_run_status_idx" ON "flux_run" USING btree ("company_id","status","created_at");--> statement-breakpoint
CREATE INDEX "flux_run_company_cmp_period_idx" ON "flux_run" USING btree ("company_id","cmp_year","cmp_month","created_at");--> statement-breakpoint
CREATE INDEX "ins_anomaly_company_run_idx" ON "ins_anomaly" USING btree ("company_id","run_id");--> statement-breakpoint
CREATE INDEX "ins_anomaly_score_severity_idx" ON "ins_anomaly" USING btree ("score","severity");--> statement-breakpoint
CREATE INDEX "ins_anomaly_opened_idx" ON "ins_anomaly" USING btree ("opened_at");--> statement-breakpoint
CREATE INDEX "ins_anomaly_kind_idx" ON "ins_anomaly" USING btree ("kind","severity");--> statement-breakpoint
CREATE INDEX "ins_bench_baseline_company_metric_idx" ON "ins_bench_baseline" USING btree ("company_id","metric","entity_group");--> statement-breakpoint
CREATE INDEX "ins_bench_baseline_window_idx" ON "ins_bench_baseline" USING btree ("window_start","window_end");--> statement-breakpoint
CREATE INDEX "ins_bench_target_company_metric_idx" ON "ins_bench_target" USING btree ("company_id","metric","effective_from");--> statement-breakpoint
CREATE INDEX "ins_fact_cert_run_idx" ON "ins_fact_cert" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ins_fact_cert_level_role_idx" ON "ins_fact_cert" USING btree ("level","signer_role");--> statement-breakpoint
CREATE INDEX "ins_fact_close_company_run_idx" ON "ins_fact_close" USING btree ("company_id","run_id");--> statement-breakpoint
CREATE INDEX "ins_fact_close_period_idx" ON "ins_fact_close" USING btree ("company_id","year","month");--> statement-breakpoint
CREATE INDEX "ins_fact_close_computed_idx" ON "ins_fact_close" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "ins_fact_ctrl_run_idx" ON "ins_fact_ctrl" USING btree ("ctrl_run_id");--> statement-breakpoint
CREATE INDEX "ins_fact_ctrl_status_severity_idx" ON "ins_fact_ctrl" USING btree ("status","severity");--> statement-breakpoint
CREATE INDEX "ins_fact_ctrl_material_fail_idx" ON "ins_fact_ctrl" USING btree ("material_fail","exceptions_count");--> statement-breakpoint
CREATE INDEX "ins_fact_flux_run_idx" ON "ins_fact_flux" USING btree ("flux_run_id");--> statement-breakpoint
CREATE INDEX "ins_fact_flux_scope_idx" ON "ins_fact_flux" USING btree ("scope","material");--> statement-breakpoint
CREATE INDEX "ins_fact_flux_delta_idx" ON "ins_fact_flux" USING btree ("top_delta_abs","top_delta_pct");--> statement-breakpoint
CREATE INDEX "ins_fact_task_run_idx" ON "ins_fact_task" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ins_fact_task_owner_status_idx" ON "ins_fact_task" USING btree ("owner","status");--> statement-breakpoint
CREATE INDEX "ins_fact_task_breached_idx" ON "ins_fact_task" USING btree ("breached","age_hours");--> statement-breakpoint
CREATE INDEX "ins_fact_task_code_idx" ON "ins_fact_task" USING btree ("code","age_hours");--> statement-breakpoint
CREATE INDEX "ins_reco_company_run_idx" ON "ins_reco" USING btree ("company_id","run_id");--> statement-breakpoint
CREATE INDEX "ins_reco_status_idx" ON "ins_reco" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ins_reco_effort_impact_idx" ON "ins_reco" USING btree ("effort","impact_estimate");--> statement-breakpoint
CREATE INDEX "idx_it_breakglass_company_opened" ON "it_breakglass" USING btree ("company_id","opened_at");--> statement-breakpoint
CREATE INDEX "idx_it_breakglass_company_status" ON "it_breakglass" USING btree ("company_id","closed_at") WHERE "it_breakglass"."closed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_it_breakglass_expires" ON "it_breakglass" USING btree ("expires_at") WHERE "it_breakglass"."closed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_it_breakglass_user" ON "it_breakglass" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_it_breakglass_system" ON "it_breakglass" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX "idx_it_connector_profile_system" ON "it_connector_profile" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX "idx_it_connector_profile_schedule" ON "it_connector_profile" USING btree ("schedule_cron") WHERE "it_connector_profile"."is_enabled" = true;--> statement-breakpoint
CREATE INDEX "idx_it_entitlement_company_system_kind_code" ON "it_entitlement" USING btree ("company_id","system_id","kind","code");--> statement-breakpoint
CREATE INDEX "idx_it_entitlement_company_system" ON "it_entitlement" USING btree ("company_id","system_id");--> statement-breakpoint
CREATE INDEX "idx_it_entitlement_kind" ON "it_entitlement" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "idx_it_grant_company_system_user_entitlement" ON "it_grant" USING btree ("company_id","system_id","user_id","entitlement_id");--> statement-breakpoint
CREATE INDEX "idx_it_grant_company_system" ON "it_grant" USING btree ("company_id","system_id");--> statement-breakpoint
CREATE INDEX "idx_it_grant_user" ON "it_grant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_it_grant_entitlement" ON "it_grant" USING btree ("entitlement_id");--> statement-breakpoint
CREATE INDEX "idx_it_grant_expires" ON "it_grant" USING btree ("expires_at") WHERE "it_grant"."expires_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_it_grant_source" ON "it_grant" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_it_role_company_system_code" ON "it_role" USING btree ("company_id","system_id","code");--> statement-breakpoint
CREATE INDEX "idx_it_role_company_system" ON "it_role" USING btree ("company_id","system_id");--> statement-breakpoint
CREATE INDEX "idx_it_role_critical" ON "it_role" USING btree ("critical") WHERE "it_role"."critical" = true;--> statement-breakpoint
CREATE INDEX "idx_it_snapshot_company_scope_taken" ON "it_snapshot" USING btree ("company_id","scope","taken_at");--> statement-breakpoint
CREATE INDEX "idx_it_snapshot_company_scope" ON "it_snapshot" USING btree ("company_id","scope");--> statement-breakpoint
CREATE INDEX "idx_it_snapshot_taken_at" ON "it_snapshot" USING btree ("taken_at");--> statement-breakpoint
CREATE INDEX "idx_it_snapshot_sha256" ON "it_snapshot" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "idx_it_sod_rule_company_code" ON "it_sod_rule" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "idx_it_sod_rule_company_active" ON "it_sod_rule" USING btree ("company_id","active");--> statement-breakpoint
CREATE INDEX "idx_it_sod_rule_severity" ON "it_sod_rule" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_it_sod_violation_rule_user_detected" ON "it_sod_violation" USING btree ("rule_id","user_id","detected_at");--> statement-breakpoint
CREATE INDEX "idx_it_sod_violation_company_status" ON "it_sod_violation" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_it_sod_violation_rule" ON "it_sod_violation" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_it_sod_violation_user" ON "it_sod_violation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_it_sod_violation_detected" ON "it_sod_violation" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_it_system_company_code" ON "it_system" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "idx_it_system_company_active" ON "it_system" USING btree ("company_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_it_user_company_system_ext" ON "it_user" USING btree ("company_id","system_id","ext_id");--> statement-breakpoint
CREATE INDEX "idx_it_user_company_system" ON "it_user" USING btree ("company_id","system_id");--> statement-breakpoint
CREATE INDEX "idx_it_user_status" ON "it_user" USING btree ("status") WHERE "it_user"."status" != 'ACTIVE';--> statement-breakpoint
CREATE INDEX "idx_it_user_last_seen" ON "it_user" USING btree ("last_seen");--> statement-breakpoint
CREATE INDEX "mdna_draft_company_run_idx" ON "mdna_draft" USING btree ("company_id","run_id");--> statement-breakpoint
CREATE INDEX "mdna_draft_template_idx" ON "mdna_draft" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "mdna_draft_status_idx" ON "mdna_draft" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "mdna_publish_company_run_idx" ON "mdna_publish" USING btree ("company_id","run_id");--> statement-breakpoint
CREATE INDEX "mdna_publish_draft_idx" ON "mdna_publish" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "mdna_template_company_status_idx" ON "mdna_template" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "rev_alloc_audit_invoice_idx" ON "rev_alloc_audit" USING btree ("company_id","invoice_id");--> statement-breakpoint
CREATE INDEX "rev_alloc_audit_run_idx" ON "rev_alloc_audit" USING btree ("company_id","run_id");--> statement-breakpoint
CREATE INDEX "rev_alloc_audit_method_idx" ON "rev_alloc_audit" USING btree ("company_id","method","created_at");--> statement-breakpoint
CREATE INDEX "rev_alloc_audit_corridor_idx" ON "rev_alloc_audit" USING btree ("company_id","corridor_flag","created_at");--> statement-breakpoint
CREATE INDEX "rev_alloc_audit_created_idx" ON "rev_alloc_audit" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "rev_alloc_link_idx" ON "rev_alloc_link" USING btree ("company_id","pob_id");--> statement-breakpoint
CREATE INDEX "rev_alloc_invoice_idx" ON "rev_alloc_link" USING btree ("company_id","invoice_id");--> statement-breakpoint
CREATE INDEX "rev_artifact_run_idx" ON "rev_artifact" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "rev_artifact_kind_idx" ON "rev_artifact" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "rev_bundle_company_sku_idx" ON "rev_bundle" USING btree ("company_id","bundle_sku","effective_from");--> statement-breakpoint
CREATE INDEX "rev_bundle_status_idx" ON "rev_bundle" USING btree ("company_id","status","effective_from");--> statement-breakpoint
CREATE INDEX "rev_bundle_component_bundle_idx" ON "rev_bundle_component" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "rev_bundle_component_product_idx" ON "rev_bundle_component" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "rev_discount_applied_invoice_idx" ON "rev_discount_applied" USING btree ("company_id","invoice_id");--> statement-breakpoint
CREATE INDEX "rev_discount_applied_rule_idx" ON "rev_discount_applied" USING btree ("company_id","rule_id");--> statement-breakpoint
CREATE INDEX "rev_discount_rule_company_code_idx" ON "rev_discount_rule" USING btree ("company_id","code","effective_from");--> statement-breakpoint
CREATE INDEX "rev_discount_rule_active_idx" ON "rev_discount_rule" USING btree ("company_id","active","effective_from");--> statement-breakpoint
CREATE INDEX "rev_discount_rule_kind_idx" ON "rev_discount_rule" USING btree ("company_id","kind","priority");--> statement-breakpoint
CREATE INDEX "rev_event_idx" ON "rev_event" USING btree ("company_id","pob_id","occurred_at");--> statement-breakpoint
CREATE INDEX "rev_event_kind_idx" ON "rev_event" USING btree ("company_id","kind","occurred_at");--> statement-breakpoint
CREATE INDEX "rev_event_processed_idx" ON "rev_event" USING btree ("company_id","processed_at");--> statement-breakpoint
CREATE INDEX "rev_event_unprocessed_idx" ON "rev_event" USING btree ("company_id","processed_at");--> statement-breakpoint
CREATE INDEX "rev_event_kind_date_idx" ON "rev_event" USING btree ("company_id","kind","occurred_at");--> statement-breakpoint
CREATE INDEX "rev_pob_idx" ON "rev_pob" USING btree ("company_id","contract_id","status","start_date");--> statement-breakpoint
CREATE INDEX "rev_pob_product_idx" ON "rev_pob" USING btree ("company_id","product_id","status");--> statement-breakpoint
CREATE INDEX "rev_pob_status_idx" ON "rev_pob" USING btree ("company_id","status","start_date");--> statement-breakpoint
CREATE INDEX "rev_pob_end_date_idx" ON "rev_pob" USING btree ("company_id","end_date");--> statement-breakpoint
CREATE INDEX "rev_post_lock_idx" ON "rev_post_lock" USING btree ("company_id","year","month");--> statement-breakpoint
CREATE INDEX "rev_prod_policy_idx" ON "rev_prod_policy" USING btree ("company_id","product_id");--> statement-breakpoint
CREATE INDEX "rev_rec_line_pob_idx" ON "rev_rec_line" USING btree ("company_id","pob_id","year","month");--> statement-breakpoint
CREATE INDEX "rev_rec_line_account_idx" ON "rev_rec_line" USING btree ("company_id","dr_account","cr_account");--> statement-breakpoint
CREATE INDEX "rev_rec_line_run_idx" ON "rev_rec_line" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "rev_rec_run_idx" ON "rev_rec_run" USING btree ("company_id","period_year","period_month");--> statement-breakpoint
CREATE INDEX "rev_rpo_idx" ON "rev_rpo_snapshot" USING btree ("company_id","as_of_date");--> statement-breakpoint
CREATE INDEX "rev_rpo_date_idx" ON "rev_rpo_snapshot" USING btree ("as_of_date");--> statement-breakpoint
CREATE INDEX "rev_sched_idx" ON "rev_schedule" USING btree ("company_id","year","month","status");--> statement-breakpoint
CREATE INDEX "rev_sched_pob_idx" ON "rev_schedule" USING btree ("company_id","pob_id","year","month");--> statement-breakpoint
CREATE INDEX "rev_sched_status_pob_idx" ON "rev_schedule" USING btree ("company_id","status","pob_id");--> statement-breakpoint
CREATE INDEX "rev_sched_period_status_idx" ON "rev_schedule" USING btree ("company_id","year","month","status");--> statement-breakpoint
CREATE INDEX "rev_ssp_catalog_company_product_idx" ON "rev_ssp_catalog" USING btree ("company_id","product_id","currency","effective_from");--> statement-breakpoint
CREATE INDEX "rev_ssp_catalog_status_idx" ON "rev_ssp_catalog" USING btree ("company_id","status","effective_from");--> statement-breakpoint
CREATE INDEX "rev_ssp_catalog_effective_idx" ON "rev_ssp_catalog" USING btree ("company_id","effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "rev_ssp_change_company_status_idx" ON "rev_ssp_change" USING btree ("company_id","status","created_at");--> statement-breakpoint
CREATE INDEX "rev_ssp_change_requestor_idx" ON "rev_ssp_change" USING btree ("company_id","requestor","created_at");--> statement-breakpoint
CREATE INDEX "rev_ssp_change_decided_idx" ON "rev_ssp_change" USING btree ("company_id","decided_by","decided_at");--> statement-breakpoint
CREATE INDEX "rev_ssp_evidence_catalog_idx" ON "rev_ssp_evidence" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "rev_usage_bridge_idx" ON "rev_usage_bridge" USING btree ("company_id","pob_id","period_year","period_month");--> statement-breakpoint
CREATE INDEX "rev_usage_rollup_idx" ON "rev_usage_bridge" USING btree ("company_id","rollup_id");--> statement-breakpoint
CREATE INDEX "idx_sox_assertion_company_type" ON "sox_assertion" USING btree ("company_id","type");--> statement-breakpoint
CREATE INDEX "idx_sox_assertion_company_period" ON "sox_assertion" USING btree ("company_id","period");--> statement-breakpoint
CREATE INDEX "idx_sox_assertion_type_period" ON "sox_assertion" USING btree ("type","period");--> statement-breakpoint
CREATE INDEX "idx_sox_assertion_signed_by" ON "sox_assertion" USING btree ("signed_by");--> statement-breakpoint
CREATE INDEX "idx_sox_assertion_signed_at" ON "sox_assertion" USING btree ("signed_at");--> statement-breakpoint
CREATE INDEX "idx_sox_control_scope_company_period" ON "sox_control_scope" USING btree ("company_id","period");--> statement-breakpoint
CREATE INDEX "idx_sox_control_scope_control_period" ON "sox_control_scope" USING btree ("control_id","period");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_company_status" ON "sox_deficiency" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_company_severity" ON "sox_deficiency" USING btree ("company_id","severity");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_status_severity" ON "sox_deficiency" USING btree ("status","severity");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_discovered_in" ON "sox_deficiency" USING btree ("discovered_in");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_control" ON "sox_deficiency" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_rem_owner" ON "sox_deficiency" USING btree ("rem_owner_id");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_created_at" ON "sox_deficiency" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_link_deficiency" ON "sox_deficiency_link" USING btree ("deficiency_id");--> statement-breakpoint
CREATE INDEX "idx_sox_deficiency_link_source" ON "sox_deficiency_link" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX "idx_sox_key_control_company_code" ON "sox_key_control" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "idx_sox_key_control_company_process" ON "sox_key_control" USING btree ("company_id","process");--> statement-breakpoint
CREATE INDEX "idx_sox_key_control_company_owner" ON "sox_key_control" USING btree ("company_id","owner_id");--> statement-breakpoint
CREATE INDEX "idx_sox_key_control_company_active" ON "sox_key_control" USING btree ("company_id","active");--> statement-breakpoint
CREATE INDEX "idx_sox_test_plan_company_period" ON "sox_test_plan" USING btree ("company_id","period");--> statement-breakpoint
CREATE INDEX "idx_sox_test_plan_control_period" ON "sox_test_plan" USING btree ("control_id","period");--> statement-breakpoint
CREATE INDEX "idx_sox_test_plan_status" ON "sox_test_plan" USING btree ("status","prepared_at");--> statement-breakpoint
CREATE INDEX "idx_sox_test_result_company_plan" ON "sox_test_result" USING btree ("company_id","plan_id");--> statement-breakpoint
CREATE INDEX "idx_sox_test_result_plan_tested_at" ON "sox_test_result" USING btree ("plan_id","tested_at");--> statement-breakpoint
CREATE INDEX "idx_sox_test_result_outcome" ON "sox_test_result" USING btree ("outcome","tested_at");--> statement-breakpoint
CREATE INDEX "idx_sox_test_result_evd_record" ON "sox_test_result" USING btree ("evd_record_id");--> statement-breakpoint
CREATE INDEX "idx_sox_test_sample_plan" ON "sox_test_sample" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_sox_test_sample_company" ON "sox_test_sample" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_uar_campaign_company_code" ON "uar_campaign" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "idx_uar_campaign_company_status" ON "uar_campaign" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_uar_campaign_due_at" ON "uar_campaign" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "idx_uar_campaign_period" ON "uar_campaign" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_uar_item_campaign_user_system" ON "uar_item" USING btree ("campaign_id","user_id","system_id");--> statement-breakpoint
CREATE INDEX "idx_uar_item_campaign_state" ON "uar_item" USING btree ("campaign_id","state");--> statement-breakpoint
CREATE INDEX "idx_uar_item_owner" ON "uar_item" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "idx_uar_item_user_system" ON "uar_item" USING btree ("user_id","system_id");--> statement-breakpoint
CREATE INDEX "idx_uar_item_decided_at" ON "uar_item" USING btree ("decided_at") WHERE "uar_item"."decided_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_uar_pack_campaign" ON "uar_pack" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_uar_pack_sha256" ON "uar_pack" USING btree ("sha256");