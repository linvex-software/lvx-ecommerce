import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// DATABASE_URL deve ser carregado via:
// 1. dotenv/config no server.ts (desenvolvimento local)
// 2. Variáveis de ambiente injetadas pela plataforma (Railway, produção)
// Não tentamos carregar .env aqui para evitar problemas com ESM e ordem de execução

if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is not defined in environment variables.\n` +
    `Current working directory: ${process.cwd()}\n` +
    `Please ensure DATABASE_URL is set:\n` +
    `  - In your .env file at the project root (for local development)\n` +
    `  - In your platform's environment variables (Railway, etc. for production)\n` +
    `  - Make sure 'dotenv/config' is imported before importing this module.`
  )
}

const client = postgres(process.env.DATABASE_URL, { max: 1 })
export const db = drizzle(client)

