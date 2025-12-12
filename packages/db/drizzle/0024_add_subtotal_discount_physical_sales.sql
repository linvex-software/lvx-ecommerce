ALTER TABLE "physical_sales" ADD COLUMN IF NOT EXISTS "subtotal" numeric(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE "physical_sales" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2) NOT NULL DEFAULT 0;

-- Para registros existentes, definir subtotal igual ao total e desconto zero
UPDATE "physical_sales" 
SET "subtotal" = "total", "discount_amount" = 0 
WHERE "subtotal" = 0 OR "subtotal" IS NULL;

