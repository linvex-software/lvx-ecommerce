CREATE TABLE IF NOT EXISTS "store_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"layout_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"from_payment_status" text,
	"to_payment_status" text,
	"changed_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "navbar_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"target" text DEFAULT '_self',
	"icon" text,
	"visible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"parent_id" uuid,
	"style" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "shipping_addresses";--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "cnpj_cpf" text;-->statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "whatsapp" text;-->statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "email" text;-->statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "address" text;-->statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "social_media" jsonb;-->statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "favicon_url" text;-->statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_address" jsonb;-->statement-breakpoint
ALTER TABLE "store_theme_config" ADD COLUMN IF NOT EXISTS "text_color" text;-->statement-breakpoint
ALTER TABLE "store_theme_config" ADD COLUMN IF NOT EXISTS "icon_color" text;-->statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_layouts" ADD CONSTRAINT "store_layouts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navbar_items" ADD CONSTRAINT "navbar_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "navbar_items" ADD CONSTRAINT "navbar_items_parent_id_navbar_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."navbar_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_layouts_store_id_unique" ON "store_layouts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "store_layouts_store_id_idx" ON "store_layouts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_history_order_created_idx" ON "order_status_history" USING btree ("order_id","created_at");