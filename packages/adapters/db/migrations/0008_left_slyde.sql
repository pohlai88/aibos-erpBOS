CREATE TABLE "alert_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"rule_id" uuid NOT NULL,
	"board" text NOT NULL,
	"kpi" text NOT NULL,
	"snapshot_id" uuid,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"action_suggestion_id" uuid,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"fired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acked_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"board" text NOT NULL,
	"kpi" text NOT NULL,
	"rule_id" text NOT NULL,
	"expr" text NOT NULL,
	"severity" text NOT NULL,
	"throttle_sec" integer DEFAULT 3600 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_fired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"board" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_present_ccy" char(3) DEFAULT 'USD' NOT NULL,
	"layout" jsonb,
	"acl" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_refresh_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"mv_name" text NOT NULL,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rows_affected" integer,
	"duration_ms" integer,
	"status" text DEFAULT 'SUCCESS' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"board" text NOT NULL,
	"kpi" text NOT NULL,
	"ts_utc" timestamp with time zone DEFAULT now() NOT NULL,
	"value" numeric(28, 6),
	"num" integer,
	"den" integer,
	"meta" jsonb,
	"present_ccy" char(3) DEFAULT 'USD' NOT NULL,
	"basis" text DEFAULT 'ACTUAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_tile_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"board" text NOT NULL,
	"tile_id" text NOT NULL,
	"kpi" text NOT NULL,
	"viz" text NOT NULL,
	"format" text,
	"targets" jsonb,
	"order_no" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_action_registry" (
	"code" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"caps_required" text[] DEFAULT '{}' NOT NULL,
	"dry_run_supported" boolean DEFAULT true NOT NULL,
	"payload_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_action_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"fire_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"action_code" text NOT NULL,
	"verification_type" text NOT NULL,
	"expected_outcome" jsonb,
	"actual_outcome" jsonb,
	"verification_result" text NOT NULL,
	"guardrail_violations" jsonb DEFAULT '[]'::jsonb,
	"rollback_triggered" boolean DEFAULT false NOT NULL,
	"rollback_reason" text,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_approval_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"fire_id" uuid NOT NULL,
	"playbook_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"approval_type" text NOT NULL,
	"impact_estimate" jsonb NOT NULL,
	"diff_summary" jsonb NOT NULL,
	"blast_radius_count" integer DEFAULT 0 NOT NULL,
	"risk_score" numeric(3, 2) DEFAULT '0.0' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_blast_radius_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"fire_id" uuid NOT NULL,
	"playbook_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_count" integer NOT NULL,
	"entity_ids" jsonb DEFAULT '[]'::jsonb,
	"blast_radius_percentage" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_canary_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"fire_id" uuid NOT NULL,
	"playbook_id" uuid NOT NULL,
	"canary_scope" jsonb NOT NULL,
	"execution_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"rollback_at" timestamp with time zone,
	"success_rate" numeric(5, 2),
	"impact_summary" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_cap" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"playbook_code" text NOT NULL,
	"capability" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_capability" UNIQUE("company_id","playbook_code","capability","role")
);
--> statement-breakpoint
CREATE TABLE "ops_dry_run_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"playbook_id" uuid NOT NULL,
	"version_no" integer,
	"execution_id" uuid NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_duration_ms" integer,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"status" text DEFAULT 'COMPLETED' NOT NULL,
	"error_message" text,
	"result_summary" jsonb
);
--> statement-breakpoint
CREATE TABLE "ops_execution_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"playbook_id" uuid NOT NULL,
	"execution_date" timestamp with time zone NOT NULL,
	"total_executions" integer DEFAULT 0 NOT NULL,
	"successful_executions" integer DEFAULT 0 NOT NULL,
	"failed_executions" integer DEFAULT 0 NOT NULL,
	"suppressed_executions" integer DEFAULT 0 NOT NULL,
	"p50_duration_ms" integer,
	"p95_duration_ms" integer,
	"p99_duration_ms" integer,
	"avg_duration_ms" integer,
	"success_rate" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_fire" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"rule_id" uuid NOT NULL,
	"window_from" timestamp with time zone NOT NULL,
	"window_to" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"approvals_needed" integer DEFAULT 0 NOT NULL,
	"approvals_got" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_fire_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fire_id" uuid NOT NULL,
	"step_no" integer NOT NULL,
	"action_code" text NOT NULL,
	"dry_run" boolean DEFAULT true NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"duration_ms" integer,
	"error_message" text,
	"result" jsonb,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_guard_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"scope" text NOT NULL,
	"max_concurrent" integer DEFAULT 1 NOT NULL,
	"blast_radius" jsonb,
	"requires_dual_control" boolean DEFAULT false NOT NULL,
	"canary" jsonb,
	"rollback_policy" jsonb,
	"timeout_sec" integer DEFAULT 900 NOT NULL,
	"cooldown_sec" integer DEFAULT 3600 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_guardrail_lock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"until_ts" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"key" text NOT NULL,
	"payload_jsonb" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_playbook" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"latest_version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ops_playbook_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ops_playbook_legacy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"steps" jsonb NOT NULL,
	"max_blast_radius" integer DEFAULT 100 NOT NULL,
	"dry_run_default" boolean DEFAULT true NOT NULL,
	"require_dual_control" boolean DEFAULT false NOT NULL,
	"timeout_sec" integer DEFAULT 300 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_playbook_version" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"playbook_id" text NOT NULL,
	"version_no" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_blast_radius" integer DEFAULT 100 NOT NULL,
	"dry_run_default" boolean DEFAULT true NOT NULL,
	"require_dual_control" boolean DEFAULT false NOT NULL,
	"timeout_sec" integer DEFAULT 300 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"change_summary" text,
	CONSTRAINT "unique_playbook_version" UNIQUE("company_id","playbook_id","version_no")
);
--> statement-breakpoint
CREATE TABLE "ops_quorum_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fire_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_rollback_step" (
	"id" text PRIMARY KEY NOT NULL,
	"run_step_id" text NOT NULL,
	"action_code" text NOT NULL,
	"input_jsonb" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"source" text,
	"where_jsonb" jsonb,
	"schedule_cron" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ops_rule_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ops_rule_legacy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"severity" text DEFAULT 'HIGH' NOT NULL,
	"when_expr" jsonb NOT NULL,
	"window_sec" integer DEFAULT 3600 NOT NULL,
	"threshold" jsonb NOT NULL,
	"throttle_sec" integer DEFAULT 3600 NOT NULL,
	"approvals" integer DEFAULT 0 NOT NULL,
	"action_playbook_id" uuid,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_rule_stat" (
	"rule_id" uuid PRIMARY KEY NOT NULL,
	"last_fired_at" timestamp with time zone,
	"fire_count" integer DEFAULT 0 NOT NULL,
	"suppressed_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_rule_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"rule_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"severity" text DEFAULT 'HIGH' NOT NULL,
	"when_expr" jsonb NOT NULL,
	"window_sec" integer DEFAULT 3600 NOT NULL,
	"threshold" jsonb NOT NULL,
	"throttle_sec" integer DEFAULT 3600 NOT NULL,
	"approvals" integer DEFAULT 0 NOT NULL,
	"action_playbook_id" uuid,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"change_summary" text
);
--> statement-breakpoint
CREATE TABLE "ops_run" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"rule_id" text,
	"playbook_version_id" text NOT NULL,
	"trigger" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"canary" boolean DEFAULT false NOT NULL,
	"scope_jsonb" jsonb,
	"blast_radius_eval" jsonb,
	"approvals_jsonb" jsonb,
	"metrics_jsonb" jsonb,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_run_step" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"idx" integer NOT NULL,
	"action_code" text NOT NULL,
	"input_jsonb" jsonb NOT NULL,
	"output_jsonb" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"duration_ms" integer,
	"rolled_back" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_signal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hash" text NOT NULL,
	"dedup_until" timestamp with time zone,
	"severity" text DEFAULT 'MEDIUM' NOT NULL,
	"kpi" text,
	"value" numeric(28, 6),
	"unit" text,
	"tags" text[] DEFAULT '{}',
	"inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opscc_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"next_retry_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "playbook_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parameter_schema" jsonb NOT NULL,
	"required_capability" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "playbook_action_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "whatif_scenario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"board" text NOT NULL,
	"scenario_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"params" jsonb NOT NULL,
	"baseline_at" timestamp with time zone NOT NULL,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ops_playbook_version" ADD CONSTRAINT "ops_playbook_version_playbook_id_ops_playbook_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."ops_playbook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_rollback_step" ADD CONSTRAINT "ops_rollback_step_run_step_id_ops_run_step_id_fk" FOREIGN KEY ("run_step_id") REFERENCES "public"."ops_run_step"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_run" ADD CONSTRAINT "ops_run_rule_id_ops_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."ops_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_run" ADD CONSTRAINT "ops_run_playbook_version_id_ops_playbook_version_id_fk" FOREIGN KEY ("playbook_version_id") REFERENCES "public"."ops_playbook_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_run_step" ADD CONSTRAINT "ops_run_step_run_id_ops_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ops_run"("id") ON DELETE cascade ON UPDATE no action;