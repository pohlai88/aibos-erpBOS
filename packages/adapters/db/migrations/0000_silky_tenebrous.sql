CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"normal_balance" char(1) NOT NULL,
	"parent_code" text
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"currency" char(3) NOT NULL,
	CONSTRAINT "company_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "journal" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"posting_date" timestamp with time zone NOT NULL,
	"currency" char(3) NOT NULL,
	"source_doctype" text NOT NULL,
	"source_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	CONSTRAINT "journal_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "journal_line" (
	"id" text PRIMARY KEY NOT NULL,
	"journal_id" text NOT NULL,
	"account_code" text NOT NULL,
	"dc" char(1) NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency" char(3) NOT NULL,
	"party_type" text,
	"party_id" text
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal" ADD CONSTRAINT "journal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_journal_id_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal"("id") ON DELETE cascade ON UPDATE no action;