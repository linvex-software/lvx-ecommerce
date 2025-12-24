-- Create table for Melhor Envio OAuth2 tokens
CREATE TABLE IF NOT EXISTS "melhor_envio_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "melhor_envio_tokens_store_id_unique" UNIQUE("store_id"),
  CONSTRAINT "melhor_envio_tokens_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "melhor_envio_tokens_store_id_idx" ON "melhor_envio_tokens"("store_id");

