import 'dotenv/config'
import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
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
  console.log('ℹ️  Nota: Este script cria apenas os usuários.')
  console.log('   A store será criada pelo próprio usuário no primeiro acesso (onboarding).\n')

  // Verificar se usuário admin já existe
  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(and(
      eq(schema.users.email, 'admin@teste.com')
    ))
    .limit(1)

  const adminPassword = 'admin123'
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10)

  let admin
  if (existingAdmin.length > 0) {
    // Admin já existe, atualizar (apenas senha, sem store nem role)
    console.log('⚠️  Usuário Admin já existe, atualizando senha...\n')
    const [updatedAdmin] = await db
      .update(schema.users)
      .set({
        store_id: null,
        name: 'Admin Teste',
        password_hash: adminPasswordHash,
        role: null
      })
      .where(eq(schema.users.email, 'admin@teste.com'))
      .returning()
    admin = updatedAdmin
  } else {
    // Criar usuário admin (sem store - será criada no onboarding)
    const [newAdmin] = await db
      .insert(schema.users)
      .values({
        store_id: null,
        name: 'Admin Teste',
        email: 'admin@teste.com',
        password_hash: adminPasswordHash,
        role: null
      })
      .returning()
    admin = newAdmin
  }

  console.log('✅ Usuário Admin criado:')
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Senha: ${adminPassword}`)
  console.log(`   Store: Será criada no primeiro acesso (onboarding)\n`)

  // Verificar se usuário operador já existe
  const existingOperador = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'operador@teste.com'))
    .limit(1)

  const operadorPassword = 'operador123'
  const operadorPasswordHash = await bcrypt.hash(operadorPassword, 10)

  let operador
  if (existingOperador.length > 0) {
    // Operador já existe, atualizar (apenas senha, sem store nem role)
    console.log('⚠️  Usuário Operador já existe, atualizando senha...\n')
    const [updatedOperador] = await db
      .update(schema.users)
      .set({
        store_id: null,
        name: 'Operador Teste',
        password_hash: operadorPasswordHash,
        role: null
      })
      .where(eq(schema.users.email, 'operador@teste.com'))
      .returning()
    operador = updatedOperador
  } else {
    // Criar usuário operador (sem store - será criada no onboarding)
    const [newOperador] = await db
      .insert(schema.users)
      .values({
        store_id: null,
        name: 'Operador Teste',
        email: 'operador@teste.com',
        password_hash: operadorPasswordHash,
        role: null
      })
      .returning()
    operador = newOperador
  }

  console.log('✅ Usuário Operador criado:')
  console.log(`   ID: ${operador.id}`)
  console.log(`   Email: ${operador.email}`)
  console.log(`   Senha: ${operadorPassword}`)
  console.log(`   Store: Será criada no primeiro acesso (onboarding)\n`)

  // Verificar se usuário vendedor já existe
  const existingVendedor = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'vendedor@teste.com'))
    .limit(1)

  const vendedorPassword = 'vendedor123'
  const vendedorPasswordHash = await bcrypt.hash(vendedorPassword, 10)

  let vendedor
  if (existingVendedor.length > 0) {
    // Vendedor já existe, atualizar (apenas senha, sem store nem role)
    console.log('⚠️  Usuário Vendedor já existe, atualizando senha...\n')
    const [updatedVendedor] = await db
      .update(schema.users)
      .set({
        store_id: null,
        name: 'Vendedor Teste',
        password_hash: vendedorPasswordHash,
        role: null
      })
      .where(eq(schema.users.email, 'vendedor@teste.com'))
      .returning()
    vendedor = updatedVendedor
  } else {
    // Criar usuário vendedor (sem store - será criada no onboarding)
    const [newVendedor] = await db
      .insert(schema.users)
      .values({
        store_id: null,
        name: 'Vendedor Teste',
        email: 'vendedor@teste.com',
        password_hash: vendedorPasswordHash,
        role: null
      })
      .returning()
    vendedor = newVendedor
  }

  console.log('✅ Usuário Vendedor criado:')
  console.log(`   ID: ${vendedor.id}`)
  console.log(`   Email: ${vendedor.email}`)
  console.log(`   Senha: ${vendedorPassword}`)
  console.log(`   Store: Será criada no primeiro acesso (onboarding)\n`)

  console.log('📋 Resumo:')
  console.log('   Usuários criados sem store associada.')
  console.log('   Cada usuário criará sua própria store no primeiro acesso (onboarding).\n')
  console.log('   ⚠️  NOTA: Este script é apenas para desenvolvimento.')
  console.log('   O sistema agora funciona automaticamente sem necessidade de configurar storeId manualmente.\n')

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

