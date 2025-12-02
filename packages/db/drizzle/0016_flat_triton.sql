CREATE TABLE IF NOT EXISTS "pickup_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "free_shipping_min_total" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_type" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_option_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pickup_points" ADD CONSTRAINT "pickup_points_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_points_store_id_idx" ON "pickup_points" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_points_store_active_idx" ON "pickup_points" USING btree ("store_id","is_active");