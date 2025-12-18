CREATE TABLE IF NOT EXISTS "coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid,
	"customer_id" uuid,
	"discount_value" numeric(12, 2) NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_usage_store_id_idx" ON "coupon_usage" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupon_usage_coupon_id_idx" ON "coupon_usage" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupons_store_id_idx" ON "coupons" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupons_active_idx" ON "coupons" USING btree ("active");