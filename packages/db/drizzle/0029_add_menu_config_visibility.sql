-- Add config and visibility columns to navbar_items table
ALTER TABLE "navbar_items" ADD COLUMN IF NOT EXISTS "config" jsonb;
ALTER TABLE "navbar_items" ADD COLUMN IF NOT EXISTS "visibility" jsonb;

-- Update existing records to have default visibility (all breakpoints visible)
UPDATE "navbar_items" 
SET "visibility" = '{"desktop": true, "tablet": true, "mobile": true}'::jsonb 
WHERE "visibility" IS NULL;










