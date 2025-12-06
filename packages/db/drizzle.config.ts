import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'node:fs'
import type { Config } from 'drizzle-kit'

// Carrega o .env da raiz do projeto
// Tenta encontrar o .env na raiz (subindo até encontrar)
let envPath = resolve(process.cwd(), '.env')
if (!existsSync(envPath)) {
  envPath = resolve(process.cwd(), '../../.env')
}
if (existsSync(envPath)) {
  config({ path: envPath })
}

export default {
  schema: './src/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string
  }
} satisfies Config

