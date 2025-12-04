import 'dotenv/config'

/**
 * Script manual para testar Task #48 - Checkout Delivery Options
 *
 * Uso:
 * 1. Certifique-se de que a API está rodando: pnpm dev (na pasta apps/api)
 * 2. Execute: node --loader tsx scripts/test-task-48-manual.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3333'

// Buscar store_id do banco
async function getStoreId(): Promise<string | null> {
  try {
    const { db, schema, eq } = await import('@white-label/db')
    const stores = await db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.domain, 'localhost'))
      .limit(1)

    return stores.length > 0 ? stores[0].id : null
  } catch (error) {
    console.error('Erro ao buscar store_id:', error)
    return null
  }
}

// Buscar produto de teste
async function getTestProduct(storeId: string): Promise<{ id: string; price: number } | null> {
  try {
    const response = await fetch(`${API_URL}/catalog/products?store_id=${storeId}`, {
      headers: {
        'x-store-id': storeId
      }
    })
    if (!response.ok) return null
    const data = await response.json()
    if (data.products && data.products.length > 0) {
      const product = data.products[0]
      return {
        id: product.id,
        price: Math.round(parseFloat(product.base_price) * 100) // centavos
      }
    }
    return null
  } catch {
    return null
  }
}

// Criar pickup point de teste
async function createTestPickupPoint(storeId: string): Promise<string | null> {
  try {
    const { db, schema } = await import('@white-label/db')
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

    return pickup.id
  } catch (error) {
    console.error('Erro ao criar pickup point:', error)
    return null
  }
}

interface TestResult {
  name: string
  success: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []

async function test(description: string, fn: () => Promise<any>): Promise<void> {
  process.stdout.write(`\n🧪 ${description}... `)
  try {
    const result = await fn()
    results.push({ name: description, success: true, data: result })
    process.stdout.write('✅\n')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.push({ name: description, success: false, error: errorMessage })
    process.stdout.write(`❌\n   Erro: ${errorMessage}\n`)
  }
}

async function main() {
  console.log('🚀 Iniciando testes manuais da Task #48\n')
  console.log(`API URL: ${API_URL}\n`)

  // 1. Buscar store_id
  const storeId = await getStoreId()
  if (!storeId) {
    console.error('❌ Store ID não encontrado. Execute: pnpm test:setup')
    process.exit(1)
  }
  console.log(`✅ Store ID: ${storeId}\n`)

  // 2. Buscar produto
  const testProduct = await getTestProduct(storeId)
  if (!testProduct) {
    console.error('❌ Produto de teste não encontrado. Crie um produto no admin.')
    process.exit(1)
  }
  console.log(`✅ Produto de teste: ${testProduct.id} (R$ ${(testProduct.price / 100).toFixed(2)})\n`)

  // 3. Criar pickup point de teste
  const pickupPointId = await createTestPickupPoint(storeId)
  if (pickupPointId) {
    console.log(`✅ Pickup point criado: ${pickupPointId}\n`)
  }

  // ===== TESTES =====

  // Teste 1: POST /checkout/delivery-options com CEP
  await test('POST /checkout/delivery-options - com CEP', async () => {
    const response = await fetch(`${API_URL}/checkout/delivery-options`, {
      method: 'POST',
      headers: {
        'x-store-id': storeId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination_zip_code: '01310100',
        items: [
          {
            product_id: testProduct.id,
            quantity: 1,
            price: testProduct.price
          }
        ]
      })
    })

    if (response.status !== 200) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const data = await response.json()
    if (!data.shippingOptions || !Array.isArray(data.shippingOptions)) {
      throw new Error('shippingOptions não encontrado ou não é array')
    }
    if (!data.pickupOptions || !Array.isArray(data.pickupOptions)) {
      throw new Error('pickupOptions não encontrado ou não é array')
    }

    return {
      shippingCount: data.shippingOptions.length,
      pickupCount: data.pickupOptions.length
    }
  })

  // Teste 2: POST /checkout/delivery-options sem CEP
  await test('POST /checkout/delivery-options - sem CEP (só pickup)', async () => {
    const response = await fetch(`${API_URL}/checkout/delivery-options`, {
      method: 'POST',
      headers: {
        'x-store-id': storeId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            product_id: testProduct.id,
            quantity: 1,
            price: testProduct.price
          }
        ]
      })
    })

    if (response.status !== 200) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const data = await response.json()
    if (data.shippingOptions.length !== 0) {
      throw new Error('shippingOptions deve estar vazio sem CEP')
    }
    if (!Array.isArray(data.pickupOptions)) {
      throw new Error('pickupOptions deve ser array')
    }

    return { shippingCount: 0, pickupCount: data.pickupOptions.length }
  })

  // Teste 3: POST /checkout/delivery-options sem store-id
  await test('POST /checkout/delivery-options - sem store-id (deve falhar)', async () => {
    const response = await fetch(`${API_URL}/checkout/delivery-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination_zip_code: '01310100',
        items: [
          {
            product_id: testProduct.id,
            quantity: 1,
            price: testProduct.price
          }
        ]
      })
    })

    if (![400, 404].includes(response.status)) {
      throw new Error(`Esperava 400 ou 404, recebeu ${response.status}`)
    }

    return { status: response.status }
  })

  // Teste 4: POST /orders sem delivery_type (deve falhar)
  await test('POST /orders - sem delivery_type (deve falhar)', async () => {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'x-store-id': storeId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            product_id: testProduct.id,
            quantity: 1,
            price: testProduct.price
          }
        ],
        shipping_cost: 0
        // delivery_type ausente
      })
    })

    if (![400, 422].includes(response.status)) {
      const error = await response.text()
      throw new Error(`Esperava 400 ou 422, recebeu ${response.status}: ${error}`)
    }

    return { status: response.status }
  })

  // Teste 5: POST /orders com shipping válido
  await test('POST /orders - com shipping válido', async () => {
    // Primeiro buscar opções
    const optionsResponse = await fetch(`${API_URL}/checkout/delivery-options`, {
      method: 'POST',
      headers: {
        'x-store-id': storeId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination_zip_code: '01310100',
        items: [
          {
            product_id: testProduct.id,
            quantity: 1,
            price: testProduct.price
          }
        ]
      })
    })

    if (optionsResponse.status !== 200) {
      throw new Error('Não foi possível buscar opções de entrega')
    }

    const options = await optionsResponse.json()
    if (options.shippingOptions.length === 0) {
      throw new Error('Nenhuma opção de frete disponível')
    }

    const shippingOption = options.shippingOptions[0]

    // Criar pedido
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'x-store-id': storeId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            product_id: testProduct.id,
            quantity: 1,
            price: testProduct.price
          }
        ],
        shipping_cost: 0, // será recalculado
        delivery_type: 'shipping',
        delivery_option_id: shippingOption.id,
        shipping_address: {
          zip_code: '01310100',
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR'
        }
      })
    })

    if (response.status !== 201) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const order = await response.json()
    if (order.order.delivery_type !== 'shipping') {
      throw new Error(`delivery_type esperado: shipping, recebido: ${order.order.delivery_type}`)
    }
    if (!order.order.delivery_option_id) {
      throw new Error('delivery_option_id não preenchido')
    }

    return {
      orderId: order.order.id,
      deliveryType: order.order.delivery_type,
      shippingCost: order.order.shipping_cost
    }
  })

  // Teste 6: POST /orders com pickup válido
  if (pickupPointId) {
    await test('POST /orders - com pickup válido', async () => {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'x-store-id': storeId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }
          ],
          shipping_cost: 0,
          delivery_type: 'pickup_point',
          delivery_option_id: pickupPointId
          // sem shipping_address
        })
      })

      if (response.status !== 201) {
        const error = await response.text()
        throw new Error(`HTTP ${response.status}: ${error}`)
      }

      const order = await response.json()
      if (order.order.delivery_type !== 'pickup_point') {
        throw new Error(`delivery_type esperado: pickup_point, recebido: ${order.order.delivery_type}`)
      }
      if (order.order.delivery_option_id !== pickupPointId) {
        throw new Error('delivery_option_id não corresponde ao pickup point')
      }
      if (parseFloat(order.order.shipping_cost) !== 0) {
        throw new Error('shipping_cost deve ser 0 para pickup')
      }

      return {
        orderId: order.order.id,
        deliveryType: order.order.delivery_type,
        shippingCost: order.order.shipping_cost
      }
    })
  }

  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (!result.success && result.error) {
      console.log(`   Erro: ${result.error}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Sucessos: ${successful}`)
  console.log(`❌ Falhas: ${failed}`)
  console.log('='.repeat(60))

  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('\n🎉 Todos os testes passaram!')
  }
}

main().catch(console.error)

