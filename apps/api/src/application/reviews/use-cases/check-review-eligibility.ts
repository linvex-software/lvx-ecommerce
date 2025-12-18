import { ReviewRepository } from '../../../infra/db/repositories/review-repository'

export interface CheckReviewEligibilityDependencies {
  reviewRepository: ReviewRepository
}

export async function checkReviewEligibilityUseCase(
  customerId: string,
  productId: string,
  storeId: string,
  dependencies: CheckReviewEligibilityDependencies
): Promise<{ canReview: boolean; orderItemId?: string }> {
  const { reviewRepository } = dependencies

  return await reviewRepository.canCustomerReview(customerId, productId, storeId)
}

