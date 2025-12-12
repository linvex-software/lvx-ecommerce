import { ReviewRepository } from '../../../infra/db/repositories/review-repository'

export interface ListReviewsDependencies {
  reviewRepository: ReviewRepository
}

export async function listReviewsUseCase(
  productId: string,
  storeId: string,
  limit: number = 50,
  dependencies: ListReviewsDependencies
) {
  const { reviewRepository } = dependencies

  return await reviewRepository.listByProduct(productId, storeId, limit)
}

