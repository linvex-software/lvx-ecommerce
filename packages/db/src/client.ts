import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// DATABASE_URL deve ser carregado via:
// 1. dotenv/config no server.ts (desenvolvimento local) 
// 2. Variáveis de ambiente injetadas pela plataforma (Railway, produção)
// Não tentamos carregar .env aqui para evitar problemas com ESM e ordem de execução

// Lazy initialization - só cria o client quando for realmente usado
// Isso permite que dotenv/config seja executado antes que este módulo seja importado
let _db: ReturnType<typeof drizzle> | null = null

function initializeDb() {
  const dbUrl = process.env.DATABASE_URL
  
  // Debug: log para verificar se está lendo (sem mostrar o valor completo por segurança)
  if (!dbUrl) {
    console.error('[DB Client] DATABASE_URL não encontrado nas variáveis de ambiente')
    console.error('[DB Client] Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
    throw new Error(
      `DATABASE_URL is not defined in environment variables.\n` +
      `Current working directory: ${process.cwd()}\n` +
      `Please ensure DATABASE_URL is set:\n` +
      `  - In your .env file at the project root (for local development)\n` +
      `  - In your platform's environment variables (Railway, etc. for production)\n` +
      `  - Make sure 'dotenv/config' is imported before importing this module.`
    )
  }
  
  // Log parcial para debug (sem mostrar credenciais)
  const urlParts = new URL(dbUrl)
  console.log(`[DB Client] Conectando ao banco: ${urlParts.protocol}//${urlParts.hostname}:${urlParts.port}${urlParts.pathname}`)
  
  const client = postgres(dbUrl, { max: 1 })
  return drizzle(client)
}

// Função getter para inicialização lazy
function getDb() {
  if (!_db) {
    _db = initializeDb()
  }
  return _db
}

// Exporta proxy que inicializa lazy quando acessado
// Usando uma abordagem mais compatível com ESM
const dbProxy = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const db = getDb()
    const value = db[prop as keyof ReturnType<typeof drizzle>]
    // Se for uma função, bind o contexto correto
    if (typeof value === 'function') {
      return value.bind(db)
    }
    return value
  }
})

export const db = dbProxy

