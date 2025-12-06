import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Carrega o .env da raiz do projeto
// Procura o .env subindo a partir do diretório atual de trabalho
// até encontrar o arquivo package.json do monorepo (que indica a raiz)
let envPath: string | null = null
let currentDir = process.cwd()

// Sobe até encontrar o package.json do monorepo (máximo 5 níveis)
for (let i = 0; i < 5; i++) {
  const potentialEnv = resolve(currentDir, '.env')
  const packageJson = resolve(currentDir, 'package.json')
  
  if (existsSync(potentialEnv) && existsSync(packageJson)) {
    // Verifica se é o package.json raiz (tem "workspaces" ou "turbo")
    try {
      const pkg = require(packageJson)
      if (pkg.workspaces || pkg.name === 'white-label-ecommerce') {
        envPath = potentialEnv
        break
      }
    } catch {
      // Se não conseguir ler, assume que é a raiz
      envPath = potentialEnv
      break
    }
  }
  
  currentDir = resolve(currentDir, '..')
}

if (envPath && existsSync(envPath)) {
  config({ path: envPath })
} else {
  // Fallback: tenta carregar do diretório atual
  config()
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is not defined in environment variables.\n` +
    `Tried to load .env from: ${envPath}\n` +
    `Current working directory: ${process.cwd()}\n` +
    `Please ensure DATABASE_URL is set in your .env file at the project root.`
  )
}

const client = postgres(process.env.DATABASE_URL, { max: 1 })
export const db = drizzle(client)

