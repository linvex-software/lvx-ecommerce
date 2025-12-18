import 'dotenv/config'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const STORE_ID = 'a439ab69-babe-4d1b-834e-2d2e44817cae'
const USER_EMAIL = 'admin@teste.com'
const USER_PASSWORD = 'admin123'
const PRODUCT_1_ID = 'aa175afd-7034-4bcd-9b88-328cda762d21'
const PRODUCT_2_ID = '02b842f3-2a6d-46f2-a793-271bb5c5857e'
const COUPON_CODE = 'TESTE10'

let accessToken: string
let userId: string

async function fetchAPI(
  path: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Promise<Response> {
  const url = `${API_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-store-id': STORE_ID,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  return response
}

async function login(): Promise<void> {
  console.log('\n🔐 Fazendo login...')
  const response = await fetchAPI('/auth/login', {
    method: 'POST',
    body: {
      email: USER_EMAIL,
      password: USER_PASSWORD
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Login falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  accessToken = data.accessToken
  userId = data.user.id
  console.log(`✅ Login realizado. User ID: ${userId}`)
}

async function testCreateCart(): Promise<string> {
  console.log('\n🛒 Testando POST /physical-sales/cart...')
  const response = await fetchAPI('/physical-sales/cart', {
    method: 'POST',
    body: {
      items: [
        {
          product_id: PRODUCT_1_ID,
          quantity: 2,
          price: 10000
        }
      ],
      coupon_code: null,
      shipping_address: '01001000'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Criar carrinho falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`✅ Carrinho criado: ${data.cart.id}`)
  console.log(`   Total: R$ ${(parseFloat(data.cart.total) / 100).toFixed(2)}`)
  return data.cart.id
}

async function testAbandonCart(cartId: string): Promise<void> {
  console.log(`\n🗑️  Testando POST /physical-sales/cart/${cartId}/abandon...`)
  const response = await fetchAPI(`/physical-sales/cart/${cartId}/abandon`, {
    method: 'POST'
  })

  if (response.status === 204 || response.status === 200) {
    console.log('✅ Carrinho marcado como abandonado')
    return
  }

  const errorText = await response.text().catch(() => '')
  if (!response.ok) {
    throw new Error(`Abandonar carrinho falhou: ${response.status} - ${errorText}`)
  }

  console.log('✅ Carrinho marcado como abandonado')
}

async function testListAbandonedCarts(): Promise<void> {
  console.log('\n📋 Testando GET /physical-sales/cart/abandoned...')
  const response = await fetchAPI('/physical-sales/cart/abandoned')

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Listar carrinhos abandonados falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`✅ Carrinhos abandonados encontrados: ${data.carts.length}`)
}

async function testCreateSimpleSale(): Promise<string> {
  console.log('\n💰 Testando POST /physical-sales (venda simples)...')
  const response = await fetchAPI('/physical-sales', {
    method: 'POST',
    body: {
      product_id: PRODUCT_1_ID,
      quantity: 1,
      total: 10000
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Criar venda falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`✅ Venda criada: ${data.sale.id}`)
  console.log(`   Subtotal: R$ ${((data.sale.subtotal || 0) / 100).toFixed(2)}`)
  console.log(`   Desconto: R$ ${((data.sale.discount || 0) / 100).toFixed(2)}`)
  console.log(`   Total: R$ ${(parseFloat(data.sale.total) / 100).toFixed(2)}`)
  console.log(`   Frete: R$ ${((data.sale.shipping_cost_amount || 0) / 100).toFixed(2)}`)
  return data.sale.id
}

async function testCreateSaleWithCouponAndShipping(): Promise<string> {
  console.log('\n💰 Testando POST /physical-sales (com cupom + frete + comissão)...')
  // Calcular total esperado:
  // Produto: 200.00 * 2 = 400.00 = 40000 centavos
  // Cupom 10%: 40000 * 0.1 = 4000 centavos de desconto
  // Subtotal com desconto: 36000 centavos
  // Frete estimado (CEP 01001): ~800 centavos
  // Total: 36800 centavos (será calculado pelo backend, então não precisamos enviar exato)
  const response = await fetchAPI('/physical-sales', {
    method: 'POST',
    body: {
      product_id: PRODUCT_2_ID,
      quantity: 2,
      total: 0, // Será calculado pelo backend
      coupon_code: COUPON_CODE,
      shipping_address: {
        zip_code: '01001000'
      },
      commission_rate: 10
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Criar venda com cupom falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`✅ Venda criada: ${data.sale.id}`)
  console.log(`   Subtotal: R$ ${((data.sale.subtotal || 0) / 100).toFixed(2)}`)
  console.log(`   Desconto: R$ ${((data.sale.discount || 0) / 100).toFixed(2)}`)
  console.log(`   Frete: R$ ${((data.sale.shipping_cost_amount || 0) / 100).toFixed(2)}`)
  console.log(`   Total: R$ ${(parseFloat(data.sale.total) / 100).toFixed(2)}`)
  if (data.sale.commission) {
    console.log(`   Comissão: R$ ${(data.sale.commission.amount / 100).toFixed(2)} (${data.sale.commission.rate}%)`)
  }
  return data.sale.id
}

async function testListSales(): Promise<void> {
  console.log('\n📊 Testando GET /physical-sales...')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  const endDate = new Date()

  const response = await fetchAPI(
    `/physical-sales?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&seller_id=${userId}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Listar vendas falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`✅ Vendas encontradas: ${data.total}`)
  console.log(`   Página: ${data.page}, Limite: ${data.limit}`)
  if (data.sales.length > 0) {
    console.log(`   Primeira venda: ${data.sales[0].id}`)
  }
}

async function testReportByProduct(): Promise<void> {
  console.log('\n📈 Testando GET /physical-sales/report-by-product...')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  const endDate = new Date()

  const response = await fetchAPI(
    `/physical-sales/report-by-product?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Relatório por produto falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`✅ Relatório gerado: ${data.report.length} produtos`)
  data.report.forEach((item: { product_name: string; total_quantity: number; total_amount: number }) => {
    console.log(
      `   ${item.product_name}: ${item.total_quantity} unidades, R$ ${(item.total_amount / 100).toFixed(2)}`
    )
  })
}

async function testCreateSaleFromCart(cartId: string): Promise<void> {
  console.log('\n🛒💰 Testando criar venda a partir de carrinho...')
  // Primeiro, preciso reativar o carrinho (criar um novo, já que não temos endpoint de reativar)
  const newCartId = await testCreateCart()

  const response = await fetchAPI('/physical-sales', {
    method: 'POST',
    body: {
      product_id: PRODUCT_1_ID,
      quantity: 1,
      total: 10000,
      cart_id: newCartId
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Criar venda com carrinho falhou: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`✅ Venda criada a partir de carrinho: ${data.sale.id}`)
  console.log(`   Cart ID: ${data.sale.cart_id}`)
}

async function runTests(): Promise<void> {
  try {
    console.log('🧪 Iniciando testes de endpoints de vendas físicas...\n')
    console.log(`API URL: ${API_URL}`)
    console.log(`Store ID: ${STORE_ID}`)

    await login()

    // Testar carrinho
    const cartId = await testCreateCart()
    await testAbandonCart(cartId)
    await testListAbandonedCarts()

    // Testar vendas
    await testCreateSimpleSale()
    await testCreateSaleWithCouponAndShipping()

    // Testar listagem e relatório
    await testListSales()
    await testReportByProduct()

    // Testar venda com carrinho
    await testCreateSaleFromCart(cartId)

    console.log('\n✅ Todos os testes passaram!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Erro nos testes:', error)
    process.exit(1)
  }
}

runTests()

