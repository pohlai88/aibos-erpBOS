CREATE TABLE "item" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"uom" text NOT NULL,
	CONSTRAINT "item_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "stock_move" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"item_id" text NOT NULL,
	"qty" numeric(20, 6) NOT NULL,
	"unit_cost" numeric(20, 6) NOT NULL,
	"direction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_move" ADD CONSTRAINT "stock_move_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_move" ADD CONSTRAINT "stock_move_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE no action;