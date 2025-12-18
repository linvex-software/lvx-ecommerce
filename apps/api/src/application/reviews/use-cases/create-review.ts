import { z } from 'zod'
import { ReviewRepository } from '../../../infra/db/repositories/review-repository'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { getTagsForRating, isValidTagForRating } from '../../../domain/reviews/review-types'

export const createReviewSchema = z.object({
  order_item_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string()).optional().default([])
})

export interface CreateReviewDependencies {
  reviewRepository: ReviewRepository
  orderRepository: OrderRepository
}

export async function createReviewUseCase(
  input: z.infer<typeof createReviewSchema>,
  storeId: string,
  customerId: string,
  dependencies: CreateReviewDependencies
): Promise<{ id: string }> {
  const { reviewRepository, orderRepository } = dependencies

  // Validar input
  const validated = createReviewSchema.parse(input)

  // Validar rating
  if (validated.rating < 1 || validated.rating > 5) {
    throw new Error('Rating deve ser entre 1 e 5')
  }

  // Validar que order_item existe e pertence ao cliente
  const orderItemData = await orderRepository.findOrderItemById(
    validated.order_item_id,
    storeId,
    customerId
  )

  if (!orderItemData) {
    throw new Error('Order item não encontrado ou não pertence ao cliente')
  }

  const { order, orderItem } = orderItemData

  if (order.payment_status !== 'paid') {
    throw new Error('Apenas pedidos pagos podem ser avaliados')
  }

  // Verificar se já existe review para este order_item
  const existingReview = await reviewRepository.findByOrderItem(validated.order_item_id)
  if (existingReview) {
    throw new Error('Este item já foi avaliado')
  }

  // Validar tags
  if (validated.tags && validated.tags.length > 0) {
    for (const tag of validated.tags) {
      if (!isValidTagForRating(tag, validated.rating)) {
        throw new Error(`Tag "${tag}" não é válida para rating ${validated.rating}`)
      }
    }
  }

  // Criar review
  const review = await reviewRepository.create({
    store_id: storeId,
    product_id: orderItem.product_id,
    order_item_id: validated.order_item_id,
    customer_id: customerId,
    rating: validated.rating,
    tags: validated.tags || []
  })

  return { id: review.id }
}

