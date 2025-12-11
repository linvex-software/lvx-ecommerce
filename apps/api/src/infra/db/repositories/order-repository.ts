 
import { db, schema, sql } from '@white-label/db'
import { eq, and, or, desc, gte, lte, inArray } from 'drizzle-orm'

import type {
  Order,
  OrderItem,
  OrderWithItems,
  ListOrdersFilters,
  UpdateOrderInput
} from '../../../domain/orders/order-types'
import type { 
  TopProduct,
  SalesByDay,
  RevenueMetrics,
  OperationalMetrics
} from '../../../domain/dashboard/dashboard-types'

export class OrderRepository {
  async create(
    orderData: {
      store_id: string
      customer_id: string | null
      total: number // em centavos
      status: string
      payment_status: string
      shipping_cost: number // em centavos
      delivery_type?: 'shipping' | 'pickup_point' | null
      delivery_option_id?: string | null
      shipping_address: {
        zip_code: string
        street?: string
        number?: string
        complement?: string
        neighborhood?: string
        city?: string
        state?: string
        country?: string
      } | null
    },
    items: Array<{
      product_id: string
      variant_id: string | null
      quantity: number
      price: number // em centavos
    }>
  ): Promise<Order> {
    // Criar pedido em uma transação
    const result = await db.transaction(async (tx) => {
      // Inserir pedido
      // Converter centavos para reais (banco espera valores em reais com 2 casas decimais)
      const [order] = await tx
        .insert(schema.orders)
        .values({
          store_id: orderData.store_id,
          customer_id: orderData.customer_id,
          total: (orderData.total / 100).toFixed(2), // Converter centavos para reais
          status: orderData.status,
          payment_status: orderData.payment_status,
          shipping_cost: (orderData.shipping_cost / 100).toFixed(2), // Converter centavos para reais
          delivery_type: orderData.delivery_type ?? null,
          delivery_option_id: orderData.delivery_option_id ?? null,
          shipping_address: orderData.shipping_address ?? null, // JSONB: Drizzle faz stringify automaticamente
          shipping_label_url: null,
          tracking_code: null
        })
        .returning()

      // Inserir endereço de entrega se fornecido
      // Nota: A tabela shipping_addresses é opcional
      // Se não existir, o endereço não será salvo mas o pedido será criado normalmente
      if (orderData.shipping_address) {
        // Não tentar inserir - tabela pode não existir
        // O endereço não é crítico para criar o pedido
        // TODO: Criar tabela shipping_addresses quando necessário
      }

      // Inserir itens do pedido
      // Converter centavos para reais (banco espera valores em reais com 2 casas decimais)
      if (items.length > 0) {
        await tx.insert(schema.orderItems).values(
          items.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: (item.price / 100).toFixed(2) // Converter centavos para reais
          }))
        )
      }

      return order
    })

    return {
      id: result.id,
      store_id: result.store_id,
      customer_id: result.customer_id,
      total: result.total,
      status: result.status as Order['status'],
      payment_status: result.payment_status as Order['payment_status'],
      shipping_cost: result.shipping_cost,
      shipping_label_url: result.shipping_label_url,
      tracking_code: result.tracking_code,
      delivery_type: result.delivery_type as Order['delivery_type'],
      delivery_option_id: result.delivery_option_id,
      created_at: result.created_at
    }
  }

  /**
   * Cria pedido com itens E movimentações de estoque em uma única transação atômica
   * Também atualiza carrinho (se fornecido) e incrementa cupom (se fornecido) na mesma transação
   */
  async createWithStockMovements(
    orderData: {
      store_id: string
      customer_id: string | null
      total: number // em centavos
      status: string
      payment_status: string
      shipping_cost: number // em centavos
      delivery_type?: 'shipping' | 'pickup_point' | null
      delivery_option_id?: string | null
      shipping_address?: {
        zip_code: string
        street?: string
        number?: string
        complement?: string
        neighborhood?: string
        city?: string
        state?: string
        country?: string
      } | null
    },
    items: Array<{
      product_id: string
      variant_id: string | null
      quantity: number
      price: number // em centavos
    }>,
    stockMovements: Array<{
      product_id: string
      variant_id: string | null
      quantity: number
      reason: string
    }>,
    options?: {
      cart_id?: string | null // ID do carrinho a ser marcado como 'converted'
      coupon_id?: string | null // ID do cupom a ter contador incrementado
    }
  ): Promise<Order> {
    // Criar pedido, itens e movimentações de estoque em uma única transação
    const result = await db.transaction(async (tx) => {
      // Inserir pedido
      const [order] = await tx
        .insert(schema.orders)
        .values({
          store_id: orderData.store_id,
          customer_id: orderData.customer_id,
          total: (orderData.total / 100).toFixed(2), // Converter centavos para reais
          status: orderData.status,
          payment_status: orderData.payment_status,
          shipping_cost: (orderData.shipping_cost / 100).toFixed(2), // Converter centavos para reais
          delivery_type: orderData.delivery_type ?? null,
          delivery_option_id: orderData.delivery_option_id ?? null,
          shipping_address: orderData.shipping_address ?? null, // JSONB: Drizzle faz stringify automaticamente
          shipping_label_url: null,
          tracking_code: null
        })
        .returning()

      // Inserir itens do pedido
      if (items.length > 0) {
        await tx.insert(schema.orderItems).values(
          items.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: (item.price / 100).toFixed(2) // Converter centavos para reais
          }))
        )
      }

      // Inserir movimentações de estoque (saída) para cada item
      // O order.id está disponível aqui porque o pedido foi criado acima
      if (stockMovements.length > 0) {
        await tx.insert(schema.stockMovements).values(
          stockMovements.map((movement) => {
            // Substituir placeholder ${orderId} pelo ID real do pedido
            const reason = movement.reason.includes('${orderId}')
              ? movement.reason.replace('${orderId}', order.id)
              : `${movement.reason} - Pedido ${order.id}`
            
            return {
              store_id: orderData.store_id,
              product_id: movement.product_id,
              variant_id: movement.variant_id,
              type: 'OUT',
              origin: 'order',
              quantity: movement.quantity,
              reason,
              final_quantity: null,
              created_by: null // vendas online não têm userId
            }
          })
        )
      }

      // Atualizar status do carrinho para 'converted' (se fornecido)
      if (options?.cart_id) {
        await tx
          .update(schema.carts)
          .set({
            status: 'converted',
            updated_at: new Date()
          })
          .where(
            and(
              eq(schema.carts.id, options.cart_id),
              eq(schema.carts.store_id, orderData.store_id)
            )
          )
      }

      // Incrementar contador de uso do cupom (se fornecido)
      if (options?.coupon_id) {
        await tx
          .update(schema.coupons)
          .set({
            used_count: sql`${schema.coupons.used_count} + 1`
          })
          .where(
            and(
              eq(schema.coupons.id, options.coupon_id),
              eq(schema.coupons.store_id, orderData.store_id)
            )
          )
      }

      return order
    })

    return {
      id: result.id,
      store_id: result.store_id,
      customer_id: result.customer_id,
      total: result.total,
      status: result.status as Order['status'],
      payment_status: result.payment_status as Order['payment_status'],
      shipping_cost: result.shipping_cost,
      shipping_label_url: result.shipping_label_url,
      tracking_code: result.tracking_code,
      delivery_type: result.delivery_type as Order['delivery_type'],
      delivery_option_id: result.delivery_option_id,
      created_at: result.created_at
    }
  }

  async listByStore(storeId: string, filters?: ListOrdersFilters): Promise<Order[]> {
    const conditions = [eq(schema.orders.store_id, storeId)]

    if (filters?.status) {
      conditions.push(eq(schema.orders.status, filters.status))
    }

    if (filters?.payment_status) {
      conditions.push(eq(schema.orders.payment_status, filters.payment_status))
    }

    if (filters?.customer_id) {
      conditions.push(eq(schema.orders.customer_id, filters.customer_id))
    }

    if (filters?.start_date) {
      const startDate = new Date(filters.start_date)
      conditions.push(gte(schema.orders.created_at, startDate))
    }

    if (filters?.end_date) {
      const endDate = new Date(filters.end_date)
      // Adiciona 23:59:59.999 para incluir o dia inteiro
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(schema.orders.created_at, endDate))
    }

    const result = await db
      .select()
      .from(schema.orders)
      .where(and(...conditions))
      .orderBy(desc(schema.orders.created_at))

    // Carregar items de cada pedido
    const ordersWithItems = await Promise.all(
      result.map(async (row) => {
        // Buscar itens do pedido com nome do produto
        const itemsResult = await db
          .select({
            id: schema.orderItems.id,
            order_id: schema.orderItems.order_id,
            product_id: schema.orderItems.product_id,
            variant_id: schema.orderItems.variant_id,
            quantity: schema.orderItems.quantity,
            price: schema.orderItems.price,
            product_name: schema.products.name
          })
          .from(schema.orderItems)
          .leftJoin(schema.products, eq(schema.orderItems.product_id, schema.products.id))
          .where(eq(schema.orderItems.order_id, row.id))

        const items: OrderItem[] = itemsResult.map((item) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.product_name || null
        }))

        return {
          id: row.id,
          store_id: row.store_id,
          customer_id: row.customer_id,
          total: row.total,
          status: row.status as Order['status'],
          payment_status: row.payment_status as Order['payment_status'],
          shipping_cost: row.shipping_cost,
          shipping_label_url: row.shipping_label_url,
          tracking_code: row.tracking_code,
          delivery_type: row.delivery_type as Order['delivery_type'],
          delivery_option_id: row.delivery_option_id,
          created_at: row.created_at,
          items
        }
      })
    )

    return ordersWithItems
  }

  async findById(id: string, storeId: string): Promise<Order | null> {
    const result = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.id, id),
          eq(schema.orders.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      customer_id: row.customer_id,
      total: row.total,
      status: row.status as Order['status'],
      payment_status: row.payment_status as Order['payment_status'],
      shipping_cost: row.shipping_cost,
      shipping_label_url: row.shipping_label_url,
      tracking_code: row.tracking_code,
      delivery_type: row.delivery_type as Order['delivery_type'],
      delivery_option_id: row.delivery_option_id,
      created_at: row.created_at
    }
  }

  async findByIdWithItems(id: string, storeId: string): Promise<OrderWithItems | null> {
    // Buscar pedido completo incluindo shipping_address
    const result = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.id, id),
          eq(schema.orders.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]

    // Buscar itens com nome do produto
    const itemsResult = await db
      .select({
        id: schema.orderItems.id,
        order_id: schema.orderItems.order_id,
        product_id: schema.orderItems.product_id,
        variant_id: schema.orderItems.variant_id,
        quantity: schema.orderItems.quantity,
        price: schema.orderItems.price,
        product_name: schema.products.name
      })
      .from(schema.orderItems)
      .leftJoin(schema.products, eq(schema.orderItems.product_id, schema.products.id))
      .where(eq(schema.orderItems.order_id, id))

    const items: OrderItem[] = itemsResult.map((item) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name || null
    }))

    // JSONB: Drizzle faz parse automaticamente, retorna objeto direto
    const shippingAddress = row.shipping_address ?? null

    return {
      id: row.id,
      store_id: row.store_id,
      customer_id: row.customer_id,
      total: row.total,
      status: row.status as Order['status'],
      payment_status: row.payment_status as Order['payment_status'],
      shipping_cost: row.shipping_cost,
      shipping_label_url: row.shipping_label_url,
      tracking_code: row.tracking_code,
      delivery_type: row.delivery_type as Order['delivery_type'],
      delivery_option_id: row.delivery_option_id,
      created_at: row.created_at,
      items,
      shipping_address: shippingAddress
    }
  }

  async update(id: string, storeId: string, data: UpdateOrderInput): Promise<Order> {
    const updateData: {
      status?: string
      payment_status?: string
      shipping_label_url?: string | null
      tracking_code?: string | null
    } = {}

    if (data.status !== undefined) {
      updateData.status = data.status
    }
    if (data.payment_status !== undefined) {
      updateData.payment_status = data.payment_status
    }
    if (data.shipping_label_url !== undefined) {
      updateData.shipping_label_url = data.shipping_label_url
    }
    if (data.tracking_code !== undefined) {
      updateData.tracking_code = data.tracking_code
    }

    const result = await db
      .update(schema.orders)
      .set(updateData)
      .where(
        and(
          eq(schema.orders.id, id),
          eq(schema.orders.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Order not found')
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      customer_id: row.customer_id,
      total: row.total,
      status: row.status as Order['status'],
      payment_status: row.payment_status as Order['payment_status'],
      shipping_cost: row.shipping_cost,
      shipping_label_url: row.shipping_label_url,
      tracking_code: row.tracking_code,
      delivery_type: row.delivery_type as Order['delivery_type'],
      delivery_option_id: row.delivery_option_id,
      created_at: row.created_at
    }
  }

  async getTopProducts(storeId: string, days: number = 30, limit: number = 10): Promise<TopProduct[]> {
    // Calcular data de início (últimos N dias)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Query para agrupar order_items por product_id e somar quantidades
    const topProductsResult = await db
      .select({
        product_id: schema.orderItems.product_id,
        unitsSold: sql<number>`COALESCE(SUM(${schema.orderItems.quantity}), 0)::int`.as('units_sold'),
        revenue: sql<string>`COALESCE(SUM(${schema.orderItems.quantity} * ${schema.orderItems.price}), 0)`.as('revenue')
      })
      .from(schema.orderItems)
      .innerJoin(
        schema.orders,
        eq(schema.orderItems.order_id, schema.orders.id)
      )
      .where(
        and(
          eq(schema.orders.store_id, storeId),
          gte(schema.orders.created_at, startDate)
        )
      )
      .groupBy(schema.orderItems.product_id)
      .orderBy(desc(sql`COALESCE(SUM(${schema.orderItems.quantity}), 0)::int`))
      .limit(limit)

    if (topProductsResult.length === 0) {
      return []
    }

    // Buscar informações dos produtos
    const productIds = topProductsResult.map((p) => p.product_id)
    
    if (productIds.length === 0) {
      return []
    }

    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku
      })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.store_id, storeId),
          inArray(schema.products.id, productIds)
        )
      )

    const productsMap = new Map(products.map((p) => [p.id, p]))

    // Buscar categorias dos produtos
    const productCategories = await db
      .selectDistinct({
        product_id: schema.productCategory.product_id,
        category_name: schema.categories.name
      })
      .from(schema.productCategory)
      .leftJoin(
        schema.categories,
        eq(schema.productCategory.category_id, schema.categories.id)
      )
      .where(inArray(schema.productCategory.product_id, productIds))

    const categoriesMap = new Map<string, string>()
    for (const pc of productCategories) {
      if (pc.category_name && !categoriesMap.has(pc.product_id)) {
        categoriesMap.set(pc.product_id, pc.category_name)
      }
    }

    // Montar resultado final
    return topProductsResult.map((item) => {
      const product = productsMap.get(item.product_id)
      const category = categoriesMap.get(item.product_id) || null

      // Converter unitsSold e revenue corretamente
      const unitsSold = typeof item.unitsSold === 'number' 
        ? item.unitsSold 
        : Number(item.unitsSold) || 0
      
      const revenue = typeof item.revenue === 'string' 
        ? item.revenue 
        : String(item.revenue || '0')

      if (!product) {
        // Se produto não encontrado, criar um placeholder
        return {
          id: item.product_id,
          name: 'Produto não encontrado',
          sku: 'N/A',
          unitsSold,
          revenue,
          category: null
        }
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unitsSold,
        revenue,
        category
      }
    })
  }

  async getSalesByPeriod(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesByDay[]> {
    // Agrupar vendas por dia
    // total está em reais (numeric 12,2), retornar em reais como string
    const salesData = await db
      .select({
        date: sql<string>`DATE(${schema.orders.created_at})::text`.as('date'),
        ordersCount: sql<number>`COUNT(${schema.orders.id})::int`.as('orders_count'),
        revenue: sql<string>`COALESCE(SUM(${schema.orders.total}::numeric), 0)`.as('revenue')
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.store_id, storeId),
          eq(schema.orders.payment_status, 'paid'),
          gte(schema.orders.created_at, startDate),
          lte(schema.orders.created_at, endDate)
        )
      )
      .groupBy(sql`DATE(${schema.orders.created_at})`)
      .orderBy(sql`DATE(${schema.orders.created_at})`)

    return salesData.map((item) => ({
      date: item.date,
      ordersCount: typeof item.ordersCount === 'number' ? item.ordersCount : Number(item.ordersCount) || 0,
      revenue: typeof item.revenue === 'string' ? item.revenue : String(item.revenue || '0')
    }))
  }

  async getRevenueMetrics(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueMetrics> {
    // total está em reais (numeric 12,2), retornar em reais como string
    const result = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${schema.orders.total}::numeric), 0)`.as('total_revenue'),
        ordersCount: sql<number>`COUNT(${schema.orders.id})::int`.as('orders_count')
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.store_id, storeId),
          eq(schema.orders.payment_status, 'paid'),
          gte(schema.orders.created_at, startDate),
          lte(schema.orders.created_at, endDate)
        )
      )

    const revenue = result[0]?.totalRevenue
      ? (typeof result[0].totalRevenue === 'string' ? result[0].totalRevenue : String(result[0].totalRevenue))
      : '0'
    
    const ordersCount = result[0]?.ordersCount
      ? (typeof result[0].ordersCount === 'number' ? result[0].ordersCount : Number(result[0].ordersCount) || 0)
      : 0

    const totalRevenueNumeric = Number(revenue) || 0
    const averageOrderValue = ordersCount > 0 ? String((totalRevenueNumeric / ordersCount).toFixed(2)) : '0'

    return {
      totalRevenue: revenue,
      ordersCount,
      averageOrderValue
    }
  }

  async getOperationalMetrics(storeId: string): Promise<OperationalMetrics> {
    // Pedidos pendentes (status pending OU payment_status pending)
    const [pendingResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`.as('count')
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.store_id, storeId),
          or(
            eq(schema.orders.status, 'pending'),
            eq(schema.orders.payment_status, 'pending')
          )!
        )
      )

    // Pedidos pagos aguardando expedição (status processing E payment_status paid)
    const [awaitingShipmentResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`.as('count')
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.store_id, storeId),
          eq(schema.orders.status, 'processing'),
          eq(schema.orders.payment_status, 'paid')
        )
      )

    const pendingOrders = pendingResult?.count 
      ? (typeof pendingResult.count === 'number' ? pendingResult.count : Number(pendingResult.count) || 0)
      : 0

    const awaitingShipment = awaitingShipmentResult?.count
      ? (typeof awaitingShipmentResult.count === 'number' ? awaitingShipmentResult.count : Number(awaitingShipmentResult.count) || 0)
      : 0

    // Estoque baixo será calculado separadamente no ProductRepository
    // Por enquanto retornamos 0, será preenchido pelo use case que busca produtos
    return {
      pendingOrders,
      awaitingShipment,
      lowStock: 0 // Será preenchido pelo use case
    }
  }
}

