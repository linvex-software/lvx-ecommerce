-- Adicionar colunas faltantes na tabela physical_sales_carts
ALTER TABLE "physical_sales_carts" ADD COLUMN IF NOT EXISTS "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "physical_sales_carts" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "physical_sales_carts" ADD COLUMN IF NOT EXISTS "origin" text;--> statement-breakpoint
ALTER TABLE "physical_sales_carts" ADD COLUMN IF NOT EXISTS "commission_rate" numeric(5, 2);--> statement-breakpoint
-- Adicionar foreign key para customer_id
DO $$ BEGIN
 ALTER TABLE "physical_sales_carts" ADD CONSTRAINT "physical_sales_carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Criar índice para customer_id (conforme schema)
CREATE INDEX IF NOT EXISTS "physical_sales_carts_store_customer_idx" ON "physical_sales_carts" USING btree ("store_id","customer_id");

