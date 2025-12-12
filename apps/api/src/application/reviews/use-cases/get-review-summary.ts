import { ReviewRepository } from '../../../infra/db/repositories/review-repository'

export interface GetReviewSummaryDependencies {
  reviewRepository: ReviewRepository
}

export async function getReviewSummaryUseCase(
  productId: string,
  storeId: string,
  dependencies: GetReviewSummaryDependencies
) {
  const { reviewRepository } = dependencies

  return await reviewRepository.getSummary(productId, storeId)
}

