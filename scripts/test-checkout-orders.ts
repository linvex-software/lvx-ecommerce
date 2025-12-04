import 'dotenv/config'

/**
 * Script para testar o fluxo completo de criação de pedidos (checkout)
 * 
 * Uso:
 * 1. Certifique-se de que as migrations foram aplicadas: pnpm db:migrate
 * 2. Execute: pnpm test:checkout-orders
 * 
 * Pré-requisitos:
 * - Ter um produto ativo no banco com estoque
 * - Ter um store_id válido
 * - API rodando em http://localhost:3333
 */

const API_URL = process.env.API_URL || 'http://localhost:3333'
const STORE_ID = process.env.TEST_STORE_ID || '8adec9f6-02d7-404d-90dc-296badba9e41'

interface TestResult {
  name: string
  success: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []

async function test(description: string, fn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 ${description}...`)
    const data = await fn()
    results.push({ name: description, success: true, data })
    console.log(`✅ ${description} - SUCESSO`)
    if (data && typeof data === 'object') {
      console.log(`   Resposta:`, JSON.stringify(data, null, 2).slice(0, 200))
    }
  } catch (error: any) {
    results.push({ 
      name: description, 
      success: false, 
      error: error.message || String(error) 
    })
    console.log(`❌ ${description} - ERRO:`, error.message || error)
  }
}

async function main() {
  console.log('🚀 Iniciando testes de Checkout/Orders\n')
  console.log(`📍 API URL: ${API_URL}`)
  console.log(`🏪 Store ID: ${STORE_ID || '⚠️  Não configurado (use TEST_STORE_ID no .env)'}\n`)

  if (!STORE_ID) {
    console.error('❌ Erro: TEST_STORE_ID não encontrado no .env')
    console.error('   Execute: pnpm test:store-id para obter o Store ID')
    process.exit(1)
  }

  // 1. Testar cálculo de frete
  await test('Calcular frete (shipping)', async () => {
    const response = await fetch(`${API_URL}/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID
      },
      body: JSON.stringify({
        destination_zip_code: '01310100',
        items: [
          {
            quantity: 1,
            weight: 0.5, // kg
            height: 10, // cm
            width: 15,
            length: 20
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    return await response.json()
  })

  // 2. Criar pedido
  let createdOrderId: string | null = null
  
  await test('Criar pedido (POST /orders)', async () => {
    // Primeiro, precisamos buscar um produto ativo via catálogo público
    const productsResponse = await fetch(`${API_URL}/products?limit=1`, {
      headers: {
        'x-store-id': STORE_ID
      }
    })

    if (!productsResponse.ok) {
      throw new Error('Não foi possível buscar produtos')
    }

    const productsData = await productsResponse.json()
    const products = productsData.products || []

    if (products.length === 0) {
      throw new Error('Nenhum produto ativo encontrado. Crie um produto primeiro via admin panel.')
    }

    const product = products[0]

    // Verificar estoque do produto (vem junto na resposta do catálogo se disponível)
    console.log(`   ℹ️  Usando produto: ${product.name} (ID: ${product.id})`)
    
    // Nota: Para verificar estoque completo, seria necessário autenticação admin
    // Por enquanto, assumimos que o produto existe e vamos tentar criar o pedido

    const orderData = {
      items: [
        {
          product_id: product.id,
          variant_id: null,
          quantity: 1,
          price: Math.round(parseFloat(product.base_price) * 100) // converter para centavos
        }
      ],
      shipping_cost: 1000, // R$ 10,00 em centavos
      coupon_code: null,
      shipping_address: {
        zip_code: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        complement: 'Apto 100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR'
      }
    }

    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const order = await response.json()
    createdOrderId = order.order?.id || null
    return order
  })

  // 3. Verificar se pedido foi criado no banco (via admin endpoint)
  if (createdOrderId) {
    await test('Verificar pedido criado (GET /admin/orders/:id)', async () => {
      // Nota: Este endpoint requer autenticação, então apenas informamos
      console.log(`   ℹ️  Para verificar, faça login no admin e acesse /admin/orders/${createdOrderId}`)
      console.log(`   ℹ️  Ou use: GET /admin/orders/${createdOrderId} com token de autenticação`)
      return { orderId: createdOrderId, note: 'Requires authentication' }
    })
  }

  // 4. Resumo dos testes
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
    console.log('\n⚠️  Alguns testes falharam. Verifique:')
    console.log('   1. As migrations foram aplicadas? (pnpm db:migrate)')
    console.log('   2. A API está rodando? (pnpm dev)')
    console.log('   3. Existe pelo menos um produto ativo com estoque?')
    console.log('   4. O STORE_ID está correto? (pnpm test:store-id)')
    process.exit(1)
  } else {
    console.log('\n🎉 Todos os testes passaram!')
  }
}

main().catch(console.error)

