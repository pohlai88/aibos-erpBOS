CREATE TABLE "fx_rate" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"from_ccy" char(3) NOT NULL,
	"to_ccy" char(3) NOT NULL,
	"rate" numeric(20, 10) NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal" ADD COLUMN "base_currency" char(3);--> statement-breakpoint
ALTER TABLE "journal" ADD COLUMN "rate_used" numeric(20, 10);--> statement-breakpoint
ALTER TABLE "journal_line" ADD COLUMN "base_amount" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "journal_line" ADD COLUMN "base_currency" char(3);--> statement-breakpoint
ALTER TABLE "journal_line" ADD COLUMN "txn_amount" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "journal_line" ADD COLUMN "txn_currency" char(3);