import 'dotenv/config'
import { db, schema, eq } from '@white-label/db'

async function getStoreId() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrado no arquivo .env')
    process.exit(1)
  }

  console.log('🔍 Buscando loja de teste...\n')

  const stores = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.domain, 'localhost'))
    .limit(1)

  if (stores.length === 0) {
    console.log('❌ Nenhuma loja encontrada com domain "localhost"')
    console.log('   Execute: pnpm test:setup')
    process.exit(1)
  }

  const store = stores[0]
  console.log('✅ Loja encontrada:')
  console.log(`   ID: ${store.id}`)
  console.log(`   Nome: ${store.name}`)
  console.log(`   Domain: ${store.domain}`)
  console.log(`   Ativa: ${store.active ? 'Sim' : 'Não'}`)
  console.log('')
  console.log('📋 Use este Store ID nos testes:')
  console.log(`   ${store.id}`)
  console.log('')

  // Buscar usuários da loja
  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role
    })
    .from(schema.users)
    .where(eq(schema.users.store_id, store.id))

  if (users.length > 0) {
    console.log('👥 Usuários encontrados:')
    users.forEach((user) => {
      console.log(`   - ${user.email} (${user.role})`)
    })
    console.log('')
  }

  process.exit(0)
}

getStoreId().catch((error) => {
  console.error('\n❌ Erro ao buscar loja:\n')
  console.error('   Detalhes:', error.message)
  if (error.code) {
    console.error(`   Código: ${error.code}`)
  }
  process.exit(1)
})

