CREATE TABLE IF NOT EXISTS "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"customer_id" uuid,
	"rating" integer NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"review_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"rating" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "physical_sales" ADD COLUMN IF NOT EXISTS "subtotal" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "physical_sales" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_tags" ADD CONSTRAINT "review_tags_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_tags" ADD CONSTRAINT "review_tags_review_id_product_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."product_reviews"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_order_item_unique" ON "product_reviews" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_product_id_idx" ON "product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_store_id_idx" ON "product_reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_customer_id_idx" ON "product_reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_tags_review_id_idx" ON "review_tags" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_tags_store_id_idx" ON "review_tags" USING btree ("store_id");