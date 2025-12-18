# Multi-stage build para otimizar tamanho da imagem
FROM node:22-alpine AS base

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# Copiar arquivos de configuração do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./

# Copiar package.json de todos os workspaces necessários
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/

# Instalar dependências para a API
# Temporariamente sem --frozen-lockfile até o lockfile ser atualizado no repositório
RUN pnpm install --filter=@white-label/api... --prod=false

# Stage 2: Build
FROM base AS builder
WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copiar código fonte e configuração
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY apps/api ./apps/api

# Copiar packages necessários do contexto
COPY packages ./packages

# Scripts não são necessários em produção (apenas para test-setup opcional)
# Removido para simplificar - adicione de volta se precisar de test-setup
# COPY scripts ./scripts

# Build apenas da API e suas dependências
RUN pnpm build --filter=@white-label/api...

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Instalar pnpm (necessário para instalar dependências do workspace)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copiar apenas arquivos necessários para produção
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

# Verificar se arquivos necessários para migrations estão presentes
RUN test -f packages/db/drizzle.config.ts || (echo "ERROR: packages/db/drizzle.config.ts not found!" && exit 1)
RUN test -d packages/db/drizzle || (echo "ERROR: packages/db/drizzle/ directory not found!" && exit 1)
RUN test -d packages/db/src/schema || (echo "ERROR: packages/db/src/schema/ directory not found!" && exit 1)
RUN test -f packages/db/package.json || (echo "ERROR: packages/db/package.json not found!" && exit 1)
RUN echo "✅ All migration files are present"

# Scripts não são necessários em produção (apenas para test-setup opcional)
# Removido para simplificar - adicione de volta se precisar de test-setup
# COPY --from=builder /app/scripts ./scripts

# Instalar dependências de produção (incluindo drizzle-kit que agora está em dependencies)
# O filter @white-label/api... inclui todas as dependências do workspace (incluindo @white-label/db)
# Temporariamente sem --frozen-lockfile até o lockfile ser atualizado no repositório
RUN pnpm install --filter=@white-label/api... --prod

# Verificar se o arquivo existe (debug)
RUN ls -la apps/api/dist/ || echo "Directory not found"
RUN test -f apps/api/dist/server.js || (echo "server.js not found!" && ls -la apps/api/dist/ && exit 1)

# Copiar script de startup
COPY apps/api/start.sh ./apps/api/start.sh

# Garantir permissão de execução
RUN chmod +x apps/api/start.sh

# Expor porta (padrão 3333, mas pode ser sobrescrita via PORT env var)
EXPOSE 3333

# Comando para iniciar a API via script
WORKDIR /app
CMD ["sh", "/app/apps/api/start.sh"]


