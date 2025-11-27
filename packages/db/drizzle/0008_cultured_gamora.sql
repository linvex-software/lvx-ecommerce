DROP INDEX IF EXISTS "users_store_email_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "store_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");