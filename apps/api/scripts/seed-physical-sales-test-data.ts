import 'dotenv/config'
import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function seedPhysicalSalesTestData() {
  console.log('🌱 Seeding physical sales test data...')

  try {
    // 1. Buscar ou criar store de teste
    let store = await db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.domain, 'localhost'))
      .limit(1)

    let storeId: string

    if (store.length === 0) {
      const [newStore] = await db
        .insert(schema.stores)
        .values({
          name: 'Loja Teste Physical Sales',
          domain: 'localhost',
          active: true
        })
        .returning()
      storeId = newStore.id
      console.log(`✅ Store criada: ${storeId}`)
    } else {
      storeId = store[0].id
      console.log(`✅ Store existente: ${storeId}`)
    }

    // 2. Buscar ou criar usuário vendedor/admin
    const testEmail = 'vendedor@teste.com'
    let user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, testEmail))
      .limit(1)

    let userId: string
    let userPassword = 'senha123'

    if (user.length === 0) {
      const passwordHash = await bcrypt.hash(userPassword, 10)
      const [newUser] = await db
        .insert(schema.users)
        .values({
          store_id: storeId,
          name: 'Vendedor Teste',
          email: testEmail,
          password_hash: passwordHash,
          role: 'vendedor'
        })
        .returning()
      userId = newUser.id
      console.log(`✅ Usuário criado: ${userId} (${testEmail})`)
    } else {
      userId = user[0].id
      console.log(`✅ Usuário existente: ${userId} (${testEmail})`)
    }

    // 3. Criar ou buscar produtos com estoque
    const products = []

    // Produto 1
    let product1 = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.store_id, storeId), eq(schema.products.sku, 'TEST-001')))
      .limit(1)

    if (product1.length === 0) {
      const [newProduct1] = await db
        .insert(schema.products)
        .values({
          store_id: storeId,
          name: 'Produto Teste 1',
          slug: 'produto-teste-1',
          description: 'Produto para testes de vendas físicas',
          base_price: '100.00',
          sku: 'TEST-001',
          status: 'active'
        })
        .returning()
      product1 = [newProduct1]
      console.log(`✅ Produto 1 criado: ${newProduct1.id}`)
    } else {
      console.log(`✅ Produto 1 existente: ${product1[0].id}`)
    }
    products.push(product1[0])

    // Produto 2
    let product2 = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.store_id, storeId), eq(schema.products.sku, 'TEST-002')))
      .limit(1)

    if (product2.length === 0) {
      const [newProduct2] = await db
        .insert(schema.products)
        .values({
          store_id: storeId,
          name: 'Produto Teste 2',
          slug: 'produto-teste-2',
          description: 'Segundo produto para testes',
          base_price: '200.00',
          sku: 'TEST-002',
          status: 'active'
        })
        .returning()
      product2 = [newProduct2]
      console.log(`✅ Produto 2 criado: ${newProduct2.id}`)
    } else {
      console.log(`✅ Produto 2 existente: ${product2[0].id}`)
    }
    products.push(product2[0])

    // 4. Criar movimentos de estoque (entrada) para os produtos
    for (const product of products) {
      await db.insert(schema.stockMovements).values({
        store_id: storeId,
        product_id: product.id,
        type: 'IN',
        origin: 'manual',
        quantity: 100,
        reason: 'Estoque inicial para testes'
      })
      console.log(`✅ Estoque criado para produto ${product.id} (100 unidades)`)
    }

    // 5. Criar ou buscar cupom de teste
    let coupon = await db
      .select()
      .from(schema.coupons)
      .where(and(eq(schema.coupons.store_id, storeId), eq(schema.coupons.code, 'TESTE10')))
      .limit(1)

    if (coupon.length === 0) {
      const [newCoupon] = await db
        .insert(schema.coupons)
        .values({
          store_id: storeId,
          code: 'TESTE10',
          type: 'percent',
          value: '10.00', // 10%
          min_value: '50.00',
          max_uses: 100,
          active: true
        })
        .returning()
      coupon = [newCoupon]
      console.log(`✅ Cupom criado: ${newCoupon.code}`)
    } else {
      console.log(`✅ Cupom existente: ${coupon[0].code}`)
    }

    // 6. Resumo
    console.log('\n📋 Dados de teste criados:')
    console.log(`   Store ID: ${storeId}`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${userPassword}`)
    console.log(`   Product 1 ID: ${products[0].id}`)
    console.log(`   Product 2 ID: ${products[1].id}`)
    console.log(`   Cupom: ${coupon[0].code}`)
    console.log('\n✅ Seed concluído!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error)
    process.exit(1)
  }
}

seedPhysicalSalesTestData()

