import 'dotenv/config'
import { db, schema } from '@white-label/db'
import bcrypt from 'bcryptjs'

async function setupTestData() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrado no arquivo .env')
    console.error('   Verifique se o arquivo .env existe na raiz do projeto')
    console.error('   e se contém a variável DATABASE_URL')
    process.exit(1)
  }

  console.log('🔧 Criando dados de teste...\n')
  console.log('📡 Conectando ao banco de dados...\n')

  // Criar store
  const [store] = await db
    .insert(schema.stores)
    .values({
      name: 'Loja Teste',
      domain: 'localhost',
      active: true
    })
    .returning()

  console.log('✅ Store criada:')
  console.log(`   ID: ${store.id}`)
  console.log(`   Nome: ${store.name}`)
  console.log(`   Domain: ${store.domain}\n`)

  // Criar usuário admin
  const adminPassword = 'admin123'
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10)

  const [admin] = await db
    .insert(schema.users)
    .values({
      store_id: store.id,
      name: 'Admin Teste',
      email: 'admin@teste.com',
      password_hash: adminPasswordHash,
      role: 'admin'
    })
    .returning()

  console.log('✅ Usuário Admin criado:')
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Senha: ${adminPassword}`)
  console.log(`   Role: ${admin.role}\n`)

  // Criar usuário operador
  const operadorPassword = 'operador123'
  const operadorPasswordHash = await bcrypt.hash(operadorPassword, 10)

  const [operador] = await db
    .insert(schema.users)
    .values({
      store_id: store.id,
      name: 'Operador Teste',
      email: 'operador@teste.com',
      password_hash: operadorPasswordHash,
      role: 'operador'
    })
    .returning()

  console.log('✅ Usuário Operador criado:')
  console.log(`   ID: ${operador.id}`)
  console.log(`   Email: ${operador.email}`)
  console.log(`   Senha: ${operadorPassword}`)
  console.log(`   Role: ${operador.role}\n`)

  // Criar usuário vendedor
  const vendedorPassword = 'vendedor123'
  const vendedorPasswordHash = await bcrypt.hash(vendedorPassword, 10)

  const [vendedor] = await db
    .insert(schema.users)
    .values({
      store_id: store.id,
      name: 'Vendedor Teste',
      email: 'vendedor@teste.com',
      password_hash: vendedorPasswordHash,
      role: 'vendedor'
    })
    .returning()

  console.log('✅ Usuário Vendedor criado:')
  console.log(`   ID: ${vendedor.id}`)
  console.log(`   Email: ${vendedor.email}`)
  console.log(`   Senha: ${vendedorPassword}`)
  console.log(`   Role: ${vendedor.role}\n`)

  console.log('📋 Resumo:')
  console.log(`   Store ID: ${store.id}`)
  console.log(`   Use este ID no header: x-store-id: ${store.id}\n`)

  console.log('🧪 Credenciais para teste:')
  console.log('   Admin:')
  console.log(`     Email: admin@teste.com`)
  console.log(`     Senha: admin123\n`)
  console.log('   Operador:')
  console.log(`     Email: operador@teste.com`)
  console.log(`     Senha: operador123\n`)
  console.log('   Vendedor:')
  console.log(`     Email: vendedor@teste.com`)
  console.log(`     Senha: vendedor123\n`)

  process.exit(0)
}

setupTestData().catch((error) => {
  console.error('\n❌ Erro ao criar dados de teste:\n')
  
  if (error.code === '28P01') {
    console.error('   Erro de autenticação do PostgreSQL')
    console.error('   Verifique se a DATABASE_URL está correta no arquivo .env')
    console.error('   Formato esperado: postgresql://usuario:senha@host:porta/database')
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    console.error('   Erro de conexão com o banco de dados')
    console.error('   Verifique se o PostgreSQL está rodando')
    console.error('   e se o host e porta na DATABASE_URL estão corretos')
  } else {
    console.error('   Detalhes:', error.message)
    if (error.code) {
      console.error(`   Código: ${error.code}`)
    }
  }
  
  process.exit(1)
})

