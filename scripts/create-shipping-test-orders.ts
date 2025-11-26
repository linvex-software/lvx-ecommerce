import 'dotenv/config'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

async function createShippingTestOrders() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrado no arquivo .env')
    process.exit(1)
  }

  console.log('🔧 Criando pedidos de teste para gestão de etiquetas...\n')

  // Buscar ou criar uma store de teste
  let store = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.domain, 'localhost'))
    .limit(1)

  if (store.length === 0) {
    console.log('📦 Criando store de teste...')
    const [newStore] = await db
      .insert(schema.stores)
      .values({
        name: 'Loja Teste Etiquetas',
        domain: 'localhost',
        active: true
      })
      .returning()
    store = [newStore]
  }

  const storeId = store[0].id
  console.log(`✅ Store ID: ${storeId}\n`)

  // Criar um customer de teste (opcional, mas ajuda)
  let customer = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.store_id, storeId))
    .limit(1)

  if (customer.length === 0) {
    const [newCustomer] = await db
      .insert(schema.customers)
      .values({
        store_id: storeId,
        name: 'Cliente Teste',
        email: 'cliente@teste.com'
      })
      .returning()
    customer = [newCustomer]
  }

  const customerId = customer[0].id

  // Pedido A: sem etiqueta, sem tracking
  const [orderA] = await db
    .insert(schema.orders)
    .values({
      store_id: storeId,
      customer_id: customerId,
      total: '100.00',
      status: 'pending',
      payment_status: 'pending',
      shipping_cost: '10.00',
      shipping_label_url: null,
      tracking_code: null
    })
    .returning()

  console.log('✅ Pedido A criado (sem etiqueta, sem tracking):')
  console.log(`   ID: ${orderA.id}`)
  console.log(`   Total: R$ 100,00`)
  console.log(`   Status: pending\n`)

  // Pedido B: com etiqueta, sem tracking
  const [orderB] = await db
    .insert(schema.orders)
    .values({
      store_id: storeId,
      customer_id: customerId,
      total: '200.00',
      status: 'shipped',
      payment_status: 'paid',
      shipping_cost: '15.00',
      shipping_label_url: 'https://exemplo.com/etiqueta-pedido-b.pdf',
      tracking_code: null
    })
    .returning()

  console.log('✅ Pedido B criado (com etiqueta, sem tracking):')
  console.log(`   ID: ${orderB.id}`)
  console.log(`   Total: R$ 200,00`)
  console.log(`   Status: shipped`)
  console.log(`   Etiqueta: ${orderB.shipping_label_url}\n`)

  // Pedido C: com etiqueta e tracking
  const [orderC] = await db
    .insert(schema.orders)
    .values({
      store_id: storeId,
      customer_id: customerId,
      total: '300.00',
      status: 'shipped',
      payment_status: 'paid',
      shipping_cost: '20.00',
      shipping_label_url: 'https://exemplo.com/etiqueta-pedido-c.pdf',
      tracking_code: 'BR123456789BR'
    })
    .returning()

  console.log('✅ Pedido C criado (com etiqueta e tracking):')
  console.log(`   ID: ${orderC.id}`)
  console.log(`   Total: R$ 300,00`)
  console.log(`   Status: shipped`)
  console.log(`   Etiqueta: ${orderC.shipping_label_url}`)
  console.log(`   Tracking: ${orderC.tracking_code}\n`)

  console.log('📋 Resumo:')
  console.log(`   Store ID: ${storeId}`)
  console.log(`   Pedido A: ${orderA.id} (R$ 100,00 - pending)`)
  console.log(`   Pedido B: ${orderB.id} (R$ 200,00 - shipped)`)
  console.log(`   Pedido C: ${orderC.id} (R$ 300,00 - shipped)\n`)

  process.exit(0)
}

createShippingTestOrders().catch((error) => {
  console.error('\n❌ Erro ao criar pedidos de teste:\n')
  console.error('   Detalhes:', error.message)
  if (error.code) {
    console.error(`   Código: ${error.code}`)
  }
  process.exit(1)
})

