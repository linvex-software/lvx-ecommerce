import { z } from 'zod'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import type { StockMovement, CreateStockMovementInput } from '../../../domain/catalog/stock-types'

const createStockMovementSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  origin: z.enum(['manual', 'order', 'physical_sale', 'adjustment', 'return']).optional(),
  quantity: z.number().int().positive(),
  reason: z.string().max(500).optional().nullable(),
  final_quantity: z.number().int().nonnegative().optional().nullable()
})

export interface CreateStockMovementDependencies {
  stockMovementRepository: StockMovementRepository
}

export async function createStockMovementUseCase(
  input: z.infer<typeof createStockMovementSchema>,
  storeId: string,
  userId: string | null,
  dependencies: CreateStockMovementDependencies
): Promise<StockMovement> {
  const { stockMovementRepository } = dependencies

  const validated = createStockMovementSchema.parse(input)

  // Validar que para ADJUST, se final_quantity não for fornecido, quantity deve ser usado
  if (validated.type === 'ADJUST' && validated.final_quantity === null && validated.quantity <= 0) {
    throw new Error('ADJUST movement must have either final_quantity or positive quantity')
  }

  const createInput: CreateStockMovementInput = {
    store_id: storeId,
    product_id: validated.product_id,
    variant_id: validated.variant_id ?? null,
    type: validated.type,
    origin: validated.origin ?? 'manual',
    quantity: validated.quantity,
    reason: validated.reason ?? null,
    final_quantity: validated.final_quantity ?? null,
    created_by: userId
  }

  return await stockMovementRepository.create(createInput)
}

export { createStockMovementSchema }

