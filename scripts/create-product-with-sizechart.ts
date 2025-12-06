import 'dotenv/config'
import { db, schema, eq } from '@white-label/db'

async function createProductWithSizeChart() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrado no arquivo .env')
    process.exit(1)
  }

  console.log('🔍 Buscando loja...\n')

  // Buscar store com domain localhost
  const stores = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.domain, 'localhost'))
    .limit(1)

  if (stores.length === 0) {
    console.error('❌ Nenhuma loja encontrada com domain "localhost"')
    console.error('   Execute: pnpm test:setup')
    process.exit(1)
  }

  const store = stores[0]
  console.log(`✅ Loja encontrada: ${store.name} (${store.id})\n`)

  // Verificar se já existe produto com size_chart
  const existingProducts = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      slug: schema.products.slug
    })
    .from(schema.products)
    .innerJoin(
      schema.productSizeChart,
      eq(schema.products.id, schema.productSizeChart.product_id)
    )
    .where(eq(schema.products.store_id, store.id))
    .limit(1)

  if (existingProducts.length > 0) {
    const product = existingProducts[0]
    console.log('✅ Produto com size_chart já existe:')
    console.log(`   Nome: ${product.name}`)
    console.log(`   Slug: ${product.slug}`)
    console.log(`   URL: http://localhost:3000/products/${product.slug}\n`)
    process.exit(0)
  }

  console.log('📦 Criando produto com size_chart...\n')

  // Criar categoria primeiro (se não existir)
  let category = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.store_id, store.id))
    .limit(1)
    .then((cats) => cats[0])

  if (!category) {
    const [newCategory] = await db
      .insert(schema.categories)
      .values({
        store_id: store.id,
        name: 'Roupas',
        slug: 'roupas'
      })
      .returning()
    category = newCategory
  }

  // Criar produto
  const [product] = await db
    .insert(schema.products)
    .values({
      store_id: store.id,
      name: 'Camiseta Básica - Provador Virtual',
      slug: 'camiseta-basica-provador-virtual',
      description: 'Camiseta básica para testar o provador virtual. Disponível em vários tamanhos.',
      base_price: '79.90',
      sku: 'CAM-PV-001',
      status: 'active',
      main_image: 'https://via.placeholder.com/800'
    })
    .returning()

  console.log(`✅ Produto criado: ${product.name} (${product.slug})\n`)

  // Criar size_chart
  const sizeChartData = {
    'PP': {
      'Busto': '80 - 84',
      'Cintura': '62 - 66',
      'Quadril': '86 - 90'
    },
    'P': {
      'Busto': '84 - 88',
      'Cintura': '66 - 70',
      'Quadril': '90 - 94'
    },
    'M': {
      'Busto': '92 - 96',
      'Cintura': '74 - 78',
      'Quadril': '102 - 106'
    },
    'G': {
      'Busto': '100 - 104',
      'Cintura': '82 - 86',
      'Quadril': '110 - 114'
    },
    'GG': {
      'Busto': '108 - 112',
      'Cintura': '90 - 94',
      'Quadril': '118 - 122'
    }
  }

  await db.insert(schema.productSizeChart).values({
    store_id: store.id,
    product_id: product.id,
    name: 'Tabela de Medidas - Camiseta',
    chart_json: sizeChartData
  })

  console.log('✅ Size chart criado com tamanhos: PP, P, M, G, GG\n')

  // Criar imagem do produto
  await db.insert(schema.productImages).values({
    store_id: store.id,
    product_id: product.id,
    image_url: 'https://via.placeholder.com/800',
    position: 0,
    is_main: true
  })

  // Vincular categoria
  await db.insert(schema.productCategory).values({
    product_id: product.id,
    category_id: category.id
  })

  // Criar estoque inicial
  await db.insert(schema.stockMovements).values({
    store_id: store.id,
    product_id: product.id,
    type: 'in',
    origin: 'initial',
    quantity: 100
  })

  console.log('📋 Resumo:')
  console.log(`   Produto: ${product.name}`)
  console.log(`   Slug: ${product.slug}`)
  console.log(`   URL: http://localhost:3000/products/${product.slug}`)
  console.log(`   Tamanhos: PP, P, M, G, GG`)
  console.log(`   Medidas: Busto, Cintura, Quadril\n`)

  process.exit(0)
}

createProductWithSizeChart().catch((error) => {
  console.error('\n❌ Erro ao criar produto:\n')
  console.error('   Detalhes:', error.message)
  if (error.code) {
    console.error(`   Código: ${error.code}`)
  }
  process.exit(1)
})

