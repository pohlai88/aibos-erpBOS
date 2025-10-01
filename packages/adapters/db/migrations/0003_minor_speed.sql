CREATE TABLE "accounting_period" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"code" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "accounting_period_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "item_costs" (
	"company_id" text NOT NULL,
	"item_id" text NOT NULL,
	"on_hand_qty" numeric(20, 6) NOT NULL,
	"moving_avg_cost" numeric(20, 6) NOT NULL,
	"total_value" numeric(20, 6) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_costs_company_id_item_id_pk" PRIMARY KEY("company_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"party_type" text NOT NULL,
	"party_id" text NOT NULL,
	"doc_date" timestamp with time zone NOT NULL,
	"currency" char(3) NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"journal_id" text
);
--> statement-breakpoint
CREATE TABLE "payment_allocation" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"apply_doctype" text NOT NULL,
	"apply_id" text NOT NULL,
	"amount" numeric(20, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"item_id" text NOT NULL,
	"move_id" text NOT NULL,
	"kind" text NOT NULL,
	"qty" numeric(20, 6) NOT NULL,
	"unit_cost" numeric(20, 6) NOT NULL,
	"total_cost" numeric(20, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "stock_move" CASCADE;--> statement-breakpoint
ALTER TABLE "journal" ADD COLUMN "is_reversal" text DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "journal" ADD COLUMN "reverses_journal_id" text;--> statement-breakpoint
ALTER TABLE "journal" ADD COLUMN "auto_reverse_on" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounting_period" ADD CONSTRAINT "accounting_period_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_costs" ADD CONSTRAINT "item_costs_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_costs" ADD CONSTRAINT "item_costs_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE no action;