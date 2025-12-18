-- Garantir que as colunas existem com estrutura correta
-- IMPORTANTE: Valores armazenados em REAIS (não centavos)
-- Ex: R$ 707,00 = 707.00 no banco

ALTER TABLE "physical_sales" 
ADD COLUMN IF NOT EXISTS "subtotal" numeric(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE "physical_sales" 
ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2) NOT NULL DEFAULT 0;
