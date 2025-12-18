import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'node:fs'
import type { Config } from 'drizzle-kit'

// Carrega o .env da raiz do projeto (apenas se existir)
// No Railway/produção, as variáveis já estão em process.env, então não precisa de .env
// Tenta encontrar o .env na raiz (subindo até encontrar)
let envPath = resolve(process.cwd(), '.env')
if (!existsSync(envPath)) {
  envPath = resolve(process.cwd(), '../../.env')
}
if (existsSync(envPath)) {
  config({ path: envPath })
}

// Verificar se DATABASE_URL está disponível
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  const error = new Error(
    'DATABASE_URL is not defined in environment variables.\n' +
    `Current working directory: ${process.cwd()}\n` +
    'Please ensure DATABASE_URL is set:\n' +
    '  - In your .env file at the project root (for local development)\n' +
    '  - In your platform\'s environment variables (Railway, etc. for production)'
  )
  console.error('[drizzle.config]', error.message)
  throw error
}

export default {
  schema: './src/schema',
  out: './drizzle',
  dialect: 'postgresql',
  strict: false,
  dbCredentials: {
    url: databaseUrl
  }
} satisfies Config

