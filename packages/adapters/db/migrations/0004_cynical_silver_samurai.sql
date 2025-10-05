CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"hash" text NOT NULL,
	"enabled" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"user_id" text NOT NULL,
	"company_id" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	CONSTRAINT "membership_user_id_company_id_pk" PRIMARY KEY("user_id","company_id")
);
--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;