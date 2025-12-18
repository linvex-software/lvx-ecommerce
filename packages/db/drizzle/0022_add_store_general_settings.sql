ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "cnpj_cpf" text;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "whatsapp" text;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "social_media" jsonb;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "favicon_url" text;
