CREATE TABLE IF NOT EXISTS "customer_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customer_favorites_store_customer_product_unique" ON "customer_favorites" USING btree ("store_id","customer_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_favorites_customer_idx" ON "customer_favorites" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_favorites_product_idx" ON "customer_favorites" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_favorites_store_idx" ON "customer_favorites" USING btree ("store_id");