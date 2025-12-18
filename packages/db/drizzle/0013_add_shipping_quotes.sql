CREATE TABLE IF NOT EXISTS "shipping_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid,
	"quote_id" integer NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"origin_zip" text NOT NULL,
	"dest_zip" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"delivery_time" integer,
	"delivery_range_min" integer,
	"delivery_range_max" integer,
	"company_id" integer,
	"company_name" text,
	"quote_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipping_quotes" ADD CONSTRAINT "shipping_quotes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipping_quotes" ADD CONSTRAINT "shipping_quotes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipping_quotes_store_order_idx" ON "shipping_quotes" USING btree ("store_id","order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipping_quotes_store_provider_idx" ON "shipping_quotes" USING btree ("store_id","provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipping_quotes_quote_id_provider_idx" ON "shipping_quotes" USING btree ("quote_id","provider");