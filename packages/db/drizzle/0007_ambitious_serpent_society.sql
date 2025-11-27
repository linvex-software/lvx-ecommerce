CREATE TABLE IF NOT EXISTS "physical_sales_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"seller_user_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"items_json" text NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"coupon_code" text,
	"shipping_address" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "physical_sales_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"physical_sale_id" uuid NOT NULL,
	"seller_user_id" uuid NOT NULL,
	"commission_amount" numeric(12, 2) NOT NULL,
	"commission_rate" numeric(5, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "physical_sales" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "physical_sales" ADD COLUMN "shipping_cost" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "physical_sales" ADD COLUMN "commission_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "physical_sales" ADD COLUMN "cart_id" uuid;--> statement-breakpoint
ALTER TABLE "physical_sales" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "physical_sales_carts" ADD CONSTRAINT "physical_sales_carts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "physical_sales_carts" ADD CONSTRAINT "physical_sales_carts_seller_user_id_users_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "physical_sales_commissions" ADD CONSTRAINT "physical_sales_commissions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "physical_sales_commissions" ADD CONSTRAINT "physical_sales_commissions_physical_sale_id_physical_sales_id_fk" FOREIGN KEY ("physical_sale_id") REFERENCES "public"."physical_sales"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "physical_sales_commissions" ADD CONSTRAINT "physical_sales_commissions_seller_user_id_users_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "physical_sales_carts_store_seller_idx" ON "physical_sales_carts" USING btree ("store_id","seller_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "physical_sales_carts_store_status_idx" ON "physical_sales_carts" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "physical_sales_commissions_sale_id_idx" ON "physical_sales_commissions" USING btree ("physical_sale_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "physical_sales_commissions_store_seller_idx" ON "physical_sales_commissions" USING btree ("store_id","seller_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "physical_sales_store_status_idx" ON "physical_sales" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "physical_sales_cart_id_idx" ON "physical_sales" USING btree ("cart_id");