#!/bin/sh
set -e

echo "🔄 Rodando migrations..."
pnpm db:migrate

echo "🔧 Rodando test-setup (se necessário)..."
# Opcional: rodar test-setup apenas se a variável RUN_TEST_SETUP estiver definida
if [ -n "$RUN_TEST_SETUP" ]; then
  echo "📦 Instalando dependências de desenvolvimento para test-setup..."
  pnpm install --frozen-lockfile --filter=@white-label/db... --prod=false || echo "⚠️  Falha ao instalar dev deps"
  pnpm test:setup || echo "⚠️  test-setup falhou ou não é necessário"
fi

echo "🚀 Iniciando API..."
node /app/apps/api/dist/server.js

