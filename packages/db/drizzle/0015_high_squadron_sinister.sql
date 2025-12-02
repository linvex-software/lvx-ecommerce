-- Atualizar registros com CPF nulo antes de tornar a coluna obrigatória
-- Se houver registros sem CPF, eles serão removidos (não podem fazer login sem CPF)
DELETE FROM "customers" WHERE "cpf" IS NULL;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "cpf" SET NOT NULL;
