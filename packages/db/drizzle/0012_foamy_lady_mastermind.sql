CREATE TABLE IF NOT EXISTS "store_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"layout_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
DO $$ BEGIN
 ALTER TABLE "store_layouts" ADD CONSTRAINT "store_layouts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
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
CREATE INDEX IF NOT EXISTS "store_layouts_store_id_idx" ON "store_layouts" USING btree ("store_id");