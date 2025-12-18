#!/bin/sh
set -e

echo "=========================================="
echo "🗄️  Iniciando processo de migrations..."
echo "=========================================="

echo "🔄 Executando migrations do banco de dados..."
echo "Comando: pnpm --filter @white-label/db db:migrate"
echo ""

# Executa migrations (set -e vai parar se falhar)
pnpm --filter @white-label/db db:migrate

# Se chegou aqui, migrations foram executadas com sucesso
echo ""
echo "✅ =========================================="
echo "✅ Migrations executadas com SUCESSO!"
echo "✅ =========================================="
echo ""

echo "🚀 Iniciando API..."
echo "Comando: node /app/apps/api/dist/server.js"
echo ""
node /app/apps/api/dist/server.js