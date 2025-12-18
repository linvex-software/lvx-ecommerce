import { ReviewRepository } from '../../../infra/db/repositories/review-repository'

export interface UpdateReviewVisibilityDependencies {
  reviewRepository: ReviewRepository
}

export async function updateReviewVisibilityUseCase(
  reviewId: string,
  storeId: string,
  isHidden: boolean,
  dependencies: UpdateReviewVisibilityDependencies
): Promise<void> {
  const { reviewRepository } = dependencies

  await reviewRepository.updateHidden(reviewId, storeId, isHidden)
}

