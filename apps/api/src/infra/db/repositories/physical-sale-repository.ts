import { db, schema } from '@white-label/db'
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm'
import type {
  PhysicalSale,
  CreatePhysicalSaleInput,
  PhysicalSaleWithRelations,
  ListPhysicalSalesFilters,
  PhysicalSalesListResult,
  PhysicalSalesByProductReport
} from '../../../domain/physical-sales/physical-sales-types'

export class PhysicalSaleRepository {
  async create(
    data: CreatePhysicalSaleInput & {
      subtotal?: number
      discount_amount?: number
      coupon_id?: string | null
      shipping_cost?: number
      commission_amount?: number | null
      cart_id?: string | null
      status?: string
    },
    storeId: string,
    sellerUserId: string
  ): Promise<PhysicalSale> {
    // Converter de centavos para reais antes de salvar
    const subtotalInReais = (data.subtotal ?? data.total) / 100
    const discountInReais = (data.discount_amount ?? 0) / 100
    const totalInReais = data.total / 100
    
    const result = await db
      .insert(schema.physicalSales)
      .values({
        store_id: storeId,
        product_id: data.product_id,
        quantity: data.quantity,
        subtotal: subtotalInReais.toFixed(2),
        discount_amount: discountInReais.toFixed(2),
        total: totalInReais.toFixed(2),
        seller_user_id: sellerUserId,
        coupon_id: data.coupon_id ?? null,
        shipping_cost: ((data.shipping_cost ?? 0) / 100).toFixed(2),
        commission_amount: data.commission_amount ? (data.commission_amount / 100).toFixed(2) : null,
        cart_id: data.cart_id ?? null,
        status: data.status ?? 'completed'
      })
      .returning()

    return this.mapRowToPhysicalSale(result[0])
  }

  async findByIdWithRelations(
    id: string,
    storeId: string,
    includeCommission: boolean = false
  ): Promise<PhysicalSaleWithRelations | null> {
    const result = await db
      .select({
        sale: schema.physicalSales,
        product: schema.products,
        seller: schema.users
      })
      .from(schema.physicalSales)
      .leftJoin(schema.products, eq(schema.physicalSales.product_id, schema.products.id))
      .leftJoin(schema.users, eq(schema.physicalSales.seller_user_id, schema.users.id))
      .where(
        and(
          eq(schema.physicalSales.id, id),
          eq(schema.physicalSales.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    if (!row.product) {
      return null
    }

    const sale = this.mapRowToPhysicalSale(row.sale)

    // Converter valores de REAIS para CENTAVOS (para manter padrão do sistema)
    const subtotal = Math.round(parseFloat(sale.subtotal) * 100)
    const discount = Math.round(parseFloat(sale.discount_amount) * 100)
    const total = Math.round(parseFloat(sale.total) * 100)

    // Buscar comissão se solicitado
    let commission = null
    if (includeCommission && sale.commission_amount) {
      // Importação dinâmica para evitar circular dependency
      const { PhysicalSalesCommissionRepository } = await import('./physical-sales-commission-repository')
      const commissionRepo = new PhysicalSalesCommissionRepository()
      const commissionData = await commissionRepo.findBySaleId(id, storeId)
      if (commissionData) {
        commission = {
          amount: Math.round(parseFloat(commissionData.commission_amount)),
          rate: commissionData.commission_rate ? parseFloat(commissionData.commission_rate) : null,
          status: commissionData.status
        }
      }
    }

    return {
      ...sale,
      // IMPORTANTE: Substituir todos os valores monetários para CENTAVOS
      // O frontend espera valores em centavos e divide por 100 no formatCurrency
      subtotal: subtotal.toString(), // Substituir subtotal em reais por centavos
      discount_amount: discount.toString(), // Substituir discount_amount em reais por centavos
      total: total.toString(), // Substituir total em reais por centavos
      product: {
        id: row.product.id,
        name: row.product.name,
        slug: row.product.slug,
        base_price: row.product.base_price,
        sku: row.product.sku
      },
      seller: row.seller
        ? {
            id: row.seller.id,
            name: row.seller.name,
            email: row.seller.email
          }
        : null,
      // Manter campos calculados para compatibilidade (já estão em centavos)
      subtotal_calculated: subtotal,
      discount,
      shipping_cost_amount: Math.round(parseFloat(sale.shipping_cost) * 100),
      commission
    }
  }

  async listByStore(
    storeId: string,
    filters?: ListPhysicalSalesFilters
  ): Promise<PhysicalSalesListResult> {
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 50
    const offset = (page - 1) * limit

    const conditions = [eq(schema.physicalSales.store_id, storeId)]

    if (filters?.start_date) {
      conditions.push(gte(schema.physicalSales.created_at, filters.start_date))
    }

    if (filters?.end_date) {
      conditions.push(lte(schema.physicalSales.created_at, filters.end_date))
    }

    if (filters?.seller_id) {
      conditions.push(eq(schema.physicalSales.seller_user_id, filters.seller_id))
    }

    if (filters?.product_id) {
      conditions.push(eq(schema.physicalSales.product_id, filters.product_id))
    }

    // Contar total
    const totalResult = await db
      .select({ count: count() })
      .from(schema.physicalSales)
      .where(and(...conditions))

    const total = totalResult[0]?.count ?? 0

    // Buscar vendas com relações
    const salesResult = await db
      .select({
        sale: schema.physicalSales,
        product: schema.products,
        seller: schema.users
      })
      .from(schema.physicalSales)
      .leftJoin(schema.products, eq(schema.physicalSales.product_id, schema.products.id))
      .leftJoin(schema.users, eq(schema.physicalSales.seller_user_id, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.physicalSales.created_at))
      .limit(limit)
      .offset(offset)

    const sales: PhysicalSaleWithRelations[] = salesResult
      .filter((row) => row.product !== null)
      .map((row) => {
        const sale = this.mapRowToPhysicalSale(row.sale)
        // Converter valores de REAIS para CENTAVOS 
        // O banco armazena em REAIS (ex: "7.07"), precisamos converter para CENTAVOS (707)
        const subtotal = Math.round(parseFloat(sale.subtotal) * 100)
        const discount = Math.round(parseFloat(sale.discount_amount) * 100)
        const total = Math.round(parseFloat(sale.total) * 100)
        
        return {
          ...sale,
          // IMPORTANTE: Substituir todos os valores monetários para CENTAVOS
          // O frontend espera valores em centavos e divide por 100 no formatCurrency
          subtotal: subtotal.toString(), // Substituir subtotal em reais por centavos
          discount_amount: discount.toString(), // Substituir discount_amount em reais por centavos
          total: total.toString(), // Substituir total em reais por centavos
          product: {
            id: row.product!.id,
            name: row.product!.name,
            slug: row.product!.slug,
            base_price: row.product!.base_price,
            sku: row.product!.sku
          },
          seller: row.seller
            ? {
                id: row.seller.id,
                name: row.seller.name,
                email: row.seller.email
              }
            : null,
          // Manter campos calculados para compatibilidade (já estão em centavos)
          subtotal_calculated: subtotal,
          discount
        }
      })

    return {
      sales,
      total,
      page,
      limit
    }
  }

  async updateStatus(
    id: string,
    storeId: string,
    status: 'completed' | 'pending' | 'cancelled'
  ): Promise<void> {
    await db
      .update(schema.physicalSales)
      .set({ status })
      .where(
        and(
          eq(schema.physicalSales.id, id),
          eq(schema.physicalSales.store_id, storeId)
        )
      )
  }

  async getReportByProduct(
    storeId: string,
    startDate?: Date,
    endDate?: Date,
    sellerId?: string
  ): Promise<PhysicalSalesByProductReport[]> {
    const conditions = [eq(schema.physicalSales.store_id, storeId)]

    if (startDate) {
      conditions.push(gte(schema.physicalSales.created_at, startDate))
    }

    if (endDate) {
      conditions.push(lte(schema.physicalSales.created_at, endDate))
    }

    if (sellerId) {
      conditions.push(eq(schema.physicalSales.seller_user_id, sellerId))
    }

    const result = await db
      .select({
        product_id: schema.physicalSales.product_id,
        product_name: schema.products.name,
        total_quantity: sql<number>`SUM(${schema.physicalSales.quantity})::int`,
        total_amount: sql<string>`SUM(${schema.physicalSales.total})::numeric`
      })
      .from(schema.physicalSales)
      .innerJoin(schema.products, eq(schema.physicalSales.product_id, schema.products.id))
      .where(and(...conditions))
      .groupBy(schema.physicalSales.product_id, schema.products.name)
      .orderBy(desc(sql`SUM(${schema.physicalSales.total})`))

    return result.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      total_quantity: row.total_quantity,
      total_amount: Math.round(parseFloat(row.total_amount) * 100) // Converter REAIS → CENTAVOS
    }))
  }

  private mapRowToPhysicalSale(row: typeof schema.physicalSales.$inferSelect): PhysicalSale {
    return {
      id: row.id,
      store_id: row.store_id,
      product_id: row.product_id,
      quantity: row.quantity,
      subtotal: row.subtotal,
      discount_amount: row.discount_amount,
      total: row.total,
      seller_user_id: row.seller_user_id,
      coupon_id: row.coupon_id ?? null,
      shipping_cost: row.shipping_cost,
      commission_amount: row.commission_amount ?? null,
      cart_id: row.cart_id ?? null,
      status: row.status as PhysicalSale['status'],
      created_at: row.created_at
    }
  }
}

