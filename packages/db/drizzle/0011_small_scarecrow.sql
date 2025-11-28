CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"session_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"items_json" text NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"coupon_code" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_store_customer_idx" ON "carts" USING btree ("store_id","customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_store_session_idx" ON "carts" USING btree ("store_id","session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_store_status_idx" ON "carts" USING btree ("store_id","status");