CREATE TABLE IF NOT EXISTS "stock_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"item_id" text NOT NULL,
	"move_id" text NOT NULL,
	"kind" text NOT NULL,
	"qty" numeric(20,6) NOT NULL,
	"unit_cost" numeric(20,6) NOT NULL,
	"total_cost" numeric(20,6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_costs" (
	"company_id" text NOT NULL,
	"item_id" text NOT NULL,
	"on_hand_qty" numeric(20,6) NOT NULL,
	"moving_avg_cost" numeric(20,6) NOT NULL,
	"total_value" numeric(20,6) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_costs_pk" PRIMARY KEY("company_id","item_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_costs" ADD CONSTRAINT "item_costs_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "item_costs" ADD CONSTRAINT "item_costs_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
