-- Migration: Additional catalog adjustments
-- Set default for status column (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
    ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'draft';
  END IF;
END $$;

-- Add foreign key constraint for stock_movements.created_by (if column exists and constraint doesn't)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'created_by')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints 
       WHERE constraint_name = 'stock_movements_created_by_users_id_fk'
     ) THEN
    ALTER TABLE "stock_movements" 
    ADD CONSTRAINT "stock_movements_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Remove stock column from variants (stock is now calculated from movements)
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "stock";
