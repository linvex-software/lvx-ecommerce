CREATE TABLE IF NOT EXISTS "dynamic_page_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dynamic_page_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "landing_pages" ADD COLUMN "content_json" jsonb;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dynamic_page_products" ADD CONSTRAINT "dynamic_page_products_dynamic_page_id_landing_pages_id_fk" FOREIGN KEY ("dynamic_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dynamic_page_products" ADD CONSTRAINT "dynamic_page_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dynamic_page_products_page_product_idx" ON "dynamic_page_products" USING btree ("dynamic_page_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dynamic_page_products_page_order_idx" ON "dynamic_page_products" USING btree ("dynamic_page_id","order_index");