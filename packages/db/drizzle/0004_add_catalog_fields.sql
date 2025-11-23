-- Migration: Add catalog fields (slug, status, base_price, etc.)
-- Generated manually for catalog feature

-- Products table updates
DO $$
BEGIN
  -- Add slug column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
    ALTER TABLE "products" ADD COLUMN "slug" text;
  END IF;
  
  -- Handle active to status migration
  -- First, add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
    ALTER TABLE "products" ADD COLUMN "status" text DEFAULT 'draft';
  END IF;
  
  -- Migrate data from active to status if active exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'active')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
    -- Update status based on active value
    UPDATE "products" SET "status" = CASE 
      WHEN "active" = true THEN 'active'
      WHEN "active" = false THEN 'inactive'
      ELSE 'draft'
    END WHERE "status" = 'draft' OR "status" IS NULL;
    -- Remove the old active column after migration
    ALTER TABLE "products" DROP COLUMN IF EXISTS "active";
  END IF;
  
  -- Set status as NOT NULL after data migration
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
    -- First, set any NULL values to 'draft'
    UPDATE "products" SET "status" = 'draft' WHERE "status" IS NULL;
    -- Then set NOT NULL constraint
    ALTER TABLE "products" ALTER COLUMN "status" SET NOT NULL;
    ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'draft';
  END IF;
  
  -- Handle price to base_price migration
  -- First, try to rename price to base_price if price exists and base_price doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'base_price') THEN
    ALTER TABLE "products" RENAME COLUMN "price" TO "base_price";
  -- If both exist, copy data from price to base_price where base_price is NULL, then drop price
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'base_price') THEN
    -- Copy data from price to base_price where base_price is NULL
    UPDATE "products" SET "base_price" = "price" WHERE "base_price" IS NULL AND "price" IS NOT NULL;
    -- Drop the old price column
    ALTER TABLE "products" DROP COLUMN IF EXISTS "price";
  -- If base_price doesn't exist and price doesn't exist, create base_price
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'base_price') THEN
    ALTER TABLE "products" ADD COLUMN "base_price" numeric(12, 2);
  END IF;
  
  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
    ALTER TABLE "products" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  
  -- Add virtual_model_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'virtual_model_url') THEN
    ALTER TABLE "products" ADD COLUMN "virtual_model_url" text;
  END IF;
  
  -- Add virtual_provider column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'virtual_provider') THEN
    ALTER TABLE "products" ADD COLUMN "virtual_provider" text;
  END IF;
  
  -- Add virtual_config_json column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'virtual_config_json') THEN
    ALTER TABLE "products" ADD COLUMN "virtual_config_json" jsonb;
  END IF;
END $$;

-- Make slug NOT NULL after data migration (if needed)
-- ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique index for store_id + slug
CREATE UNIQUE INDEX IF NOT EXISTS "products_store_slug_unique" ON "products" ("store_id", "slug");

-- Add index for store_id + status
CREATE INDEX IF NOT EXISTS "products_store_status_idx" ON "products" ("store_id", "status");

-- Product variants: add store_id
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "store_id" uuid REFERENCES "stores"("id") ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "sku" text;

-- Remove stock column from variants (stock is now calculated from movements)
-- ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "stock";

-- Add unique index for store_id + sku in variants
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_store_sku_unique" ON "product_variants" ("store_id", "sku") WHERE "sku" IS NOT NULL;

-- Product images: add store_id and is_main
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "store_id" uuid REFERENCES "stores"("id") ON DELETE CASCADE;
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "is_main" boolean DEFAULT false NOT NULL;

-- Create product_seo table
CREATE TABLE IF NOT EXISTS "product_seo" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "meta_title" text,
  "meta_description" text,
  "meta_keywords" text,
  "open_graph_image" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_seo_product_id_unique" ON "product_seo" ("product_id");
CREATE INDEX IF NOT EXISTS "product_seo_store_id_idx" ON "product_seo" ("store_id");

-- Create product_size_chart table
CREATE TABLE IF NOT EXISTS "product_size_chart" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "chart_json" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_size_chart_product_id_unique" ON "product_size_chart" ("product_id");
CREATE INDEX IF NOT EXISTS "product_size_chart_store_id_idx" ON "product_size_chart" ("store_id");

-- Stock movements: add reason, final_quantity, created_by
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "final_quantity" integer;
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- Add index for product + variant in stock_movements
CREATE INDEX IF NOT EXISTS "stock_movements_product_variant_idx" ON "stock_movements" ("product_id", "variant_id");

