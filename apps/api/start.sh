#!/bin/sh
set -e

echo "=========================================="
echo "🗄️  Iniciando processo de migrations..."
echo "=========================================="

# Diagnosticar ambiente
echo ""
echo "📋 Diagnóstico do ambiente:"
echo "   Working directory: $(pwd)"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo ""

# Verificar DATABASE_URL
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: DATABASE_URL não está definido!"
  echo "   Variáveis disponíveis com 'DATABASE' no nome:"
  env | grep -i database || echo "   Nenhuma encontrada"
  exit 1
else
  # Mostrar apenas parte da URL (sem credenciais)
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^/]+).*|\1|' || echo "unknown")
  echo "✅ DATABASE_URL está definido (host: $DB_HOST)"
fi
echo ""

# Verificar arquivos necessários para migrations
echo "🔍 Verificando arquivos necessários para migrations..."
MISSING_FILES=0

if [ ! -f "packages/db/drizzle.config.ts" ]; then
  echo "❌ packages/db/drizzle.config.ts não encontrado!"
  MISSING_FILES=$((MISSING_FILES + 1))
else
  echo "✅ packages/db/drizzle.config.ts encontrado"
fi

if [ ! -d "packages/db/drizzle" ]; then
  echo "❌ packages/db/drizzle/ (pasta de migrations) não encontrada!"
  MISSING_FILES=$((MISSING_FILES + 1))
else
  MIGRATION_COUNT=$(find packages/db/drizzle -name "*.sql" 2>/dev/null | wc -l || echo "0")
  echo "✅ packages/db/drizzle/ encontrada ($MIGRATION_COUNT arquivos .sql)"
fi

if [ ! -d "packages/db/src/schema" ]; then
  echo "❌ packages/db/src/schema/ não encontrada!"
  MISSING_FILES=$((MISSING_FILES + 1))
else
  echo "✅ packages/db/src/schema/ encontrada"
fi

if [ ! -f "packages/db/package.json" ]; then
  echo "❌ packages/db/package.json não encontrado!"
  MISSING_FILES=$((MISSING_FILES + 1))
else
  echo "✅ packages/db/package.json encontrado"
fi

if [ $MISSING_FILES -gt 0 ]; then
  echo ""
  echo "❌ =========================================="
  echo "❌ ERRO: $MISSING_FILES arquivo(s) necessário(s) não encontrado(s)!"
  echo "❌ =========================================="
  echo ""
  echo "📁 Estrutura atual de packages/db/:"
  ls -la packages/db/ 2>/dev/null || echo "   Diretório não existe"
  exit 1
fi

echo ""
echo "✅ Todos os arquivos necessários estão presentes"
echo ""

# Verificar se drizzle-kit está disponível
echo "🔍 Verificando se drizzle-kit está disponível..."
if ! pnpm --filter @white-label/db exec drizzle-kit --version >/dev/null 2>&1; then
  echo "⚠️  drizzle-kit não encontrado via pnpm exec, tentando diretamente..."
  if ! command -v drizzle-kit >/dev/null 2>&1; then
    echo "❌ ERRO: drizzle-kit não está disponível!"
    echo "   Verificando node_modules..."
    if [ -d "packages/db/node_modules/.bin" ]; then
      ls -la packages/db/node_modules/.bin/ | grep drizzle || echo "   drizzle-kit não encontrado em node_modules"
    fi
    exit 1
  else
    echo "✅ drizzle-kit encontrado no PATH"
  fi
else
  echo "✅ drizzle-kit encontrado via pnpm"
fi
echo ""

# Executar migrations
echo "🔄 Executando migrations do banco de dados..."
echo "   Comando: pnpm --filter @white-label/db db:migrate"
echo "   Working directory: $(pwd)"
echo ""

# Executa migrations (set -e vai parar se falhar)
if pnpm --filter @white-label/db db:migrate; then
  MIGRATE_EXIT_CODE=0
else
  MIGRATE_EXIT_CODE=$?
fi

echo ""

# Verificar resultado
if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
  echo "✅ =========================================="
  echo "✅ Migrations executadas com SUCESSO!"
  echo "✅ =========================================="
  echo ""
else
  echo "❌ =========================================="
  echo "❌ ERRO ao executar migrations!"
  echo "❌ Código de saída: $MIGRATE_EXIT_CODE"
  echo "❌ =========================================="
  echo ""
  exit $MIGRATE_EXIT_CODE
fi

# Iniciar API
echo "🚀 Iniciando API..."
echo "   Comando: node /app/apps/api/dist/server.js"
echo "   Working directory: $(pwd)"
echo ""
node /app/apps/api/dist/server.js