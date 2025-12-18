#!/bin/sh
set -e

echo "🗄️ Rodando migrations..."
pnpm --filter @white-label/db db:migrate

echo "🚀 Iniciando API..."
node /app/apps/api/dist/server.js