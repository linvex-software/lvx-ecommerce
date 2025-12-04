import { db, schema, sql } from '@white-label/db'
import { eq, and, desc } from 'drizzle-orm'
import type {
  Order,
  OrderItem,
  OrderWithItems,
  ListOrdersFilters,
  UpdateOrderInput
} from '../../../domain/orders/order-types'

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

    const result = await db
      .select()
      .from(schema.orders)
      .where(and(...conditions))
      .orderBy(desc(schema.orders.created_at))

    return result.map((row) => ({
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
    }))
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
    const order = await this.findById(id, storeId)
    if (!order) {
      return null
    }

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

    const items: OrderItem[] = itemsResult.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      quantity: row.quantity,
      price: row.price,
      product_name: row.product_name || null
    }))

    // Buscar endereço de entrega (opcional - tabela pode não existir)
    // Por enquanto, retornar null pois a tabela não existe
    const shippingAddress = null

    return {
      ...order,
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
}

