import { db, schema } from '@white-label/db'
import { eq, and, sql, desc, sum } from 'drizzle-orm'
import type {
  StockMovement,
  ProductStock,
  CreateStockMovementInput
} from '../../../domain/catalog/stock-types'

export class StockMovementRepository {
  async create(data: CreateStockMovementInput): Promise<StockMovement> {
    const result = await db
      .insert(schema.stockMovements)
      .values({
        store_id: data.store_id,
        product_id: data.product_id,
        variant_id: data.variant_id ?? null,
        type: data.type,
        origin: data.origin ?? 'manual',
        quantity: data.quantity,
        reason: data.reason ?? null,
        final_quantity: data.final_quantity ?? null,
        created_by: data.created_by ?? null
      })
      .returning()

    return this.mapRowToStockMovement(result[0])
  }

  async getProductStock(
    productId: string,
    storeId: string,
    variantId?: string | null
  ): Promise<ProductStock | null> {
    const conditions = [
      eq(schema.stockMovements.product_id, productId),
      eq(schema.stockMovements.store_id, storeId)
    ]

    if (variantId !== undefined) {
      if (variantId === null) {
        conditions.push(sql`${schema.stockMovements.variant_id} IS NULL`)
      } else {
        conditions.push(eq(schema.stockMovements.variant_id, variantId))
      }
    }

    // Buscar último movimento para pegar created_at
    const lastMovement = await db
      .select()
      .from(schema.stockMovements)
      .where(and(...conditions))
      .orderBy(desc(schema.stockMovements.created_at))
      .limit(1)

    // Calcular estoque atual
    // IN → +quantity, OUT → -quantity, ADJUST → usar final_quantity se existir
    const movements = await db
      .select()
      .from(schema.stockMovements)
      .where(and(...conditions))
      .orderBy(schema.stockMovements.created_at)

    let currentStock = 0
    let lastAdjustment: StockMovement | null = null

    // Processar movimentos em ordem cronológica
    for (const movement of movements) {
      if (movement.type === 'ADJUST' && movement.final_quantity !== null) {
        // ADJUST com final_quantity: sobrescreve o cálculo anterior
        currentStock = movement.final_quantity
        lastAdjustment = this.mapRowToStockMovement(movement)
      } else if (movement.type === 'IN') {
        currentStock += movement.quantity
      } else if (movement.type === 'OUT') {
        currentStock -= movement.quantity
      } else if (movement.type === 'ADJUST') {
        // ADJUST sem final_quantity: tratar como ajuste relativo
        currentStock += movement.quantity
      }
    }

    return {
      product_id: productId,
      variant_id: variantId ?? null,
      current_stock: Math.max(0, currentStock), // Não permitir estoque negativo
      last_movement_at: lastMovement.length > 0 ? lastMovement[0].created_at : null
    }
  }

  async getProductStocksByProduct(
    productId: string,
    storeId: string
  ): Promise<ProductStock[]> {
    // Buscar todas as variantes do produto
    const variants = await db
      .select()
      .from(schema.productVariants)
      .where(
        and(
          eq(schema.productVariants.product_id, productId),
          eq(schema.productVariants.store_id, storeId)
        )
      )

    const stocks: ProductStock[] = []

    // Estoque do produto (sem variante)
    const productStock = await this.getProductStock(productId, storeId, null)
    if (productStock) {
      stocks.push(productStock)
    }

    // Estoque de cada variante
    for (const variant of variants) {
      const variantStock = await this.getProductStock(
        productId,
        storeId,
        variant.id
      )
      if (variantStock) {
        stocks.push(variantStock)
      }
    }

    return stocks
  }

  async listByProduct(
    productId: string,
    storeId: string,
    variantId?: string | null
  ): Promise<StockMovement[]> {
    const conditions = [
      eq(schema.stockMovements.product_id, productId),
      eq(schema.stockMovements.store_id, storeId)
    ]

    if (variantId !== undefined) {
      if (variantId === null) {
        conditions.push(sql`${schema.stockMovements.variant_id} IS NULL`)
      } else {
        conditions.push(eq(schema.stockMovements.variant_id, variantId))
      }
    }

    const movements = await db
      .select()
      .from(schema.stockMovements)
      .where(and(...conditions))
      .orderBy(desc(schema.stockMovements.created_at))

    return movements.map((row) => this.mapRowToStockMovement(row))
  }

  private mapRowToStockMovement(row: {
    id: string
    store_id: string
    product_id: string
    variant_id: string | null
    type: string
    origin: string | null
    quantity: number
    reason: string | null
    final_quantity: number | null
    created_by: string | null
    created_at: Date
  }): StockMovement {
    return {
      id: row.id,
      store_id: row.store_id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      type: row.type as 'IN' | 'OUT' | 'ADJUST',
      origin: row.origin as 'manual' | 'order' | 'physical_sale' | 'adjustment' | 'return' | null,
      quantity: row.quantity,
      reason: row.reason,
      final_quantity: row.final_quantity,
      created_by: row.created_by,
      created_at: row.created_at
    }
  }
}

