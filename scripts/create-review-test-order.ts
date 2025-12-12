import 'dotenv/config'
import { db, schema } from '@white-label/db'
import { eq, or } from 'drizzle-orm'

const API_URL = process.env.API_URL || 'http://localhost:3333'

/**
 * Script para criar um pedido pago com um produto, permitindo avaliar o produto
 *
 * Uso:
 * 1. Execute: tsx --tsconfig scripts/tsconfig.json scripts/create-review-test-order.ts
 *
 * Este script:
 * - Cria um cliente com senha (ou usa existente)
 * - Cria um pedido com status 'paid'
 * - Adiciona um produto ao pedido
 * - Vincula a um cliente
 *
 * Depois, você pode:
 * 1. Fazer login como esse cliente na web (email/CPF + senha)
 * 2. Acessar a PDP do produto
 * 3. Clicar em "Avaliar Produto"
 */

async function createReviewTestOrder() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrado no arquivo .env')
    process.exit(1)
  }

  console.log('🔧 Criando pedido de teste para avaliações...\n')

  // Buscar store
  let store = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.domain, 'localhost'))
    .limit(1)

  if (store.length === 0) {
    console.error('❌ Nenhuma store encontrada. Certifique-se de que há uma store com domain="localhost"')
    process.exit(1)
  }

  const storeId = store[0].id
  console.log(`✅ Store encontrada: ${store[0].name} (ID: ${storeId})\n`)

  // Buscar ou criar cliente
  const TEST_EMAIL = 'cliente@avaliacoes.com'
  const TEST_CPF = '12345678900'
  const TEST_PASSWORD = '123456' // Senha padrão para testes

  let customer = await db
    .select()
    .from(schema.customers)
    .where(
      or(
        eq(schema.customers.email, TEST_EMAIL),
        eq(schema.customers.cpf, TEST_CPF)
      )
    )
    .limit(1)

  if (customer.length === 0) {
    console.log('📦 Criando cliente de teste via API (para ter senha)...')

    try {
      // Registrar cliente via API (isso cria com senha)
      const registerResponse = await fetch(`${API_URL}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-store-id': storeId
        },
        body: JSON.stringify({
          name: 'Cliente Teste Avaliações',
          email: TEST_EMAIL,
          cpf: TEST_CPF,
          password: TEST_PASSWORD
        })
      })

      if (!registerResponse.ok) {
        const error = await registerResponse.text()
        throw new Error(`Erro ao registrar cliente: ${error}`)
      }

      const registerData = await registerResponse.json()
      console.log(`✅ Cliente criado via API: ${registerData.customer.name}`)

      // Buscar cliente recém criado
      const newCustomers = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.store_id, storeId))
        .limit(10)

      customer = newCustomers.filter(c =>
        c.email === TEST_EMAIL || c.cpf === TEST_CPF
      )
    } catch (error: any) {
      console.error(`⚠️  Erro ao criar cliente via API: ${error.message}`)
      console.log('   Tentando criar diretamente no banco (sem senha)...')
      console.log('   ⚠️  Você precisará definir senha manualmente ou registrar via web\n')

      // Fallback: criar sem senha (precisa definir depois)
      const [newCustomer] = await db
        .insert(schema.customers)
        .values({
          store_id: storeId,
          name: 'Cliente Teste Avaliações',
          email: TEST_EMAIL,
          cpf: TEST_CPF
        })
        .returning()
      customer = [newCustomer]
    }
  }

  if (customer.length === 0) {
    console.error('❌ Não foi possível criar ou encontrar cliente')
    process.exit(1)
  }

  const customerData = customer[0]
  console.log(`✅ Cliente encontrado: ${customerData.name} (ID: ${customerData.id})`)
  console.log(`   Email: ${customerData.email || 'N/A'}`)
  console.log(`   CPF: ${customerData.cpf || 'N/A'}`)
  console.log(`   🔑 Senha para login: ${TEST_PASSWORD}\n`)

  const customerId = customer[0].id

  // Buscar um produto ativo
  const products = await db
    .select()
    .from(schema.products)
    .where(
      eq(schema.products.store_id, storeId)
      // Não filtrar por status aqui, vamos pegar qualquer produto
    )
    .limit(1)

  if (products.length === 0) {
    console.error('❌ Nenhum produto encontrado. Crie um produto primeiro via admin panel.')
    process.exit(1)
  }

  const product = products[0]
  console.log(`✅ Produto encontrado: ${product.name} (ID: ${product.id})`)
  console.log(`   Slug: ${product.slug}\n`)

  // Criar pedido pago
  const [order] = await db
    .insert(schema.orders)
    .values({
      store_id: storeId,
      customer_id: customerId,
      total: product.base_price, // Usar preço do produto
      status: 'completed', // Pedido completo
      payment_status: 'paid', // ⚠️ IMPORTANTE: precisa ser 'paid' para poder avaliar
      shipping_cost: '10.00'
    })
    .returning()

  console.log(`✅ Pedido criado (ID: ${order.id})`)
  console.log(`   Status: ${order.status}`)
  console.log(`   Payment Status: ${order.payment_status} ✅`)
  console.log(`   Total: R$ ${order.total}\n`)

  // Criar order_item com o produto
  const [orderItem] = await db
    .insert(schema.orderItems)
    .values({
      order_id: order.id,
      product_id: product.id,
      variant_id: null,
      quantity: 1,
      price: product.base_price
    })
    .returning()

  console.log(`✅ Item do pedido criado (ID: ${orderItem.id})`)
  console.log(`   Produto: ${product.name}`)
  console.log(`   Quantidade: ${orderItem.quantity}`)
  console.log(`   Preço: R$ ${orderItem.price}\n`)

  console.log('📋 RESUMO PARA AVALIAR:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`1. Cliente:`)
  console.log(`   Email: ${customerData.email || 'N/A'}`)
  console.log(`   CPF: ${customerData.cpf || 'N/A'}`)
  console.log(`   ID: ${customerId}`)
  console.log(`\n2. Produto para avaliar:`)
  console.log(`   Nome: ${product.name}`)
  console.log(`   Slug: ${product.slug}`)
  console.log(`   URL na web: /produto/${product.slug}`)
  console.log(`   ID: ${product.id}`)
  console.log(`\n3. Pedido:`)
  console.log(`   ID: ${order.id}`)
  console.log(`   Order Item ID: ${orderItem.id}`)
  console.log(`   Status: ${order.payment_status} ✅`)
  console.log(`\n4. PRÓXIMOS PASSOS:`)
  console.log(`   a) Faça login na web:`)
  console.log(`      - Email/CPF: ${customerData.email || customerData.cpf}`)
  console.log(`      - Senha: ${TEST_PASSWORD}`)
  console.log(`      - URL: http://localhost:3000/login`)
  console.log(`   b) Depois do login, acesse a PDP:`)
  console.log(`      - URL: http://localhost:3000/produto/${product.slug}`)
  console.log(`   c) Role até a seção de avaliações (ao final da página)`)
  console.log(`   d) Clique no botão "Avaliar Produto"`)
  console.log(`   e) Selecione uma avaliação (1-5 estrelas)`)
  console.log(`   f) Selecione tags opcionais baseadas no rating`)
  console.log(`   g) Clique em "Enviar Avaliação"`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  process.exit(0)
}

createReviewTestOrder().catch((error) => {
  console.error('❌ Erro ao criar pedido de teste:', error)
  process.exit(1)
})

