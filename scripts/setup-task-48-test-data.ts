import 'dotenv/config'
import { db, schema, eq } from '@white-label/db'

/**
 * Script para criar dados de teste necessários para Task #48
 *
 * Uso: npx tsx scripts/setup-task-48-test-data.ts
 */

async function setupTestData() {
  console.log('🔧 Configurando dados de teste para Task #48...\n')

  // 1. Buscar ou criar loja
  const stores = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.domain, 'localhost'))
    .limit(1)

  let storeId: string
  if (stores.length === 0) {
    console.log('📦 Criando loja de teste...')
    const [store] = await db
      .insert(schema.stores)
      .values({
        name: 'Loja Teste',
        domain: 'localhost',
        active: true,
        free_shipping_min_total: '200.00' // R$ 200,00 para frete grátis
      })
      .returning()
    storeId = store.id
    console.log(`✅ Loja criada: ${storeId}\n`)
  } else {
    storeId = stores[0].id
    console.log(`✅ Loja encontrada: ${storeId}`)

    // Atualizar free_shipping_min_total se não estiver configurado
    if (!stores[0].free_shipping_min_total) {
      await db
        .update(schema.stores)
        .set({ free_shipping_min_total: '200.00' })
        .where(eq(schema.stores.id, storeId))
      console.log('✅ free_shipping_min_total configurado: R$ 200,00')
    }
    console.log('')
  }

  // 2. Verificar se há produtos
  const products = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.store_id, storeId))
    .limit(1)

  let productId: string
  if (products.length === 0) {
    console.log('📦 Criando produto de teste...')
    const [product] = await db
      .insert(schema.products)
      .values({
        store_id: storeId,
        name: 'Produto Teste Task #48',
        slug: 'produto-teste-task-48',
        description: 'Produto criado para testes da Task #48',
        base_price: '50.00', // R$ 50,00
        sku: 'TEST-48-001',
        status: 'active'
      })
      .returning()
    productId = product.id
    console.log(`✅ Produto criado: ${productId}\n`)

    // Criar estoque inicial
    console.log('📦 Criando estoque inicial...')
    await db.insert(schema.stockMovements).values({
      store_id: storeId,
      product_id: productId,
      type: 'IN',
      origin: 'manual',
      quantity: 100,
      reason: 'Estoque inicial para testes Task #48'
    })
    console.log('✅ Estoque criado: 100 unidades\n')
  } else {
    productId = products[0].id
    console.log(`✅ Produto encontrado: ${productId}`)

    // Verificar estoque
    const stockMovements = await db
      .select()
      .from(schema.stockMovements)
      .where(eq(schema.stockMovements.product_id, productId))
      .limit(1)

    if (stockMovements.length === 0) {
      console.log('📦 Criando estoque inicial...')
      await db.insert(schema.stockMovements).values({
        store_id: storeId,
        product_id: productId,
        type: 'IN',
        origin: 'manual',
        quantity: 100,
        reason: 'Estoque inicial para testes Task #48'
      })
      console.log('✅ Estoque criado: 100 unidades\n')
    } else {
      console.log('✅ Produto já tem estoque\n')
    }
  }

  // 3. Verificar se há pickup points
  const pickupPoints = await db
    .select()
    .from(schema.pickupPoints)
    .where(eq(schema.pickupPoints.store_id, storeId))
    .limit(1)

  if (pickupPoints.length === 0) {
    console.log('📦 Criando pickup point de teste...')
    const [pickup] = await db
      .insert(schema.pickupPoints)
      .values({
        store_id: storeId,
        name: 'Loja Teste - Centro',
        street: 'Rua Teste',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310100',
        is_active: true
      })
      .returning()
    console.log(`✅ Pickup point criado: ${pickup.id}\n`)
  } else {
    console.log(`✅ Pickup point encontrado: ${pickupPoints[0].id}\n`)
  }

  console.log('='.repeat(60))
  console.log('✅ Dados de teste configurados com sucesso!')
  console.log('='.repeat(60))
  console.log(`\nStore ID: ${storeId}`)
  console.log(`Product ID: ${productId}`)
  console.log(`\nUse estes IDs nos testes.\n`)
}

setupTestData().catch((error) => {
  console.error('\n❌ Erro ao configurar dados de teste:\n')
  console.error(error)
  process.exit(1)
})

