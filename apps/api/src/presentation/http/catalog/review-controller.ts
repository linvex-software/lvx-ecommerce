import type { FastifyRequest, FastifyReply } from 'fastify'
import { ReviewRepository } from '../../../infra/db/repositories/review-repository'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { createReviewUseCase } from '../../../application/reviews/use-cases/create-review'
import { getReviewSummaryUseCase } from '../../../application/reviews/use-cases/get-review-summary'
import { listReviewsUseCase } from '../../../application/reviews/use-cases/list-reviews'
import { checkReviewEligibilityUseCase } from '../../../application/reviews/use-cases/check-review-eligibility'
import { getTagsForRating } from '../../../domain/reviews/review-types'

export class ReviewController {
  async getSummary(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      const { productId } = request.params

      if (!storeId) {
        await reply.status(400).send({ error: 'Store ID is required' })
        return
      }

      const reviewRepository = new ReviewRepository()
      const summary = await getReviewSummaryUseCase(productId, storeId, {
        reviewRepository
      })

      await reply.status(200).send({ summary })
    } catch (error) {
      request.log.error(error, 'Erro ao buscar resumo de avaliações')
      await reply.status(500).send({ error: 'Erro ao buscar resumo de avaliações' })
    }
  }

  async list(
    request: FastifyRequest<{
      Params: { productId: string }
      Querystring: { limit?: string }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      const { productId } = request.params
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50

      if (!storeId) {
        await reply.status(400).send({ error: 'Store ID is required' })
        return
      }

      const reviewRepository = new ReviewRepository()
      const reviews = await listReviewsUseCase(productId, storeId, limit, {
        reviewRepository
      })

      await reply.status(200).send({ reviews })
    } catch (error) {
      request.log.error(error, 'Erro ao listar avaliações')
      await reply.status(500).send({ error: 'Erro ao listar avaliações' })
    }
  }

  async create(
    request: FastifyRequest<{
      Params: { productId: string }
      Body: {
        order_item_id: string
        rating: number
        tags?: string[]
      }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      const customer = request.customer

      if (!storeId) {
        await reply.status(400).send({ error: 'Store ID is required' })
        return
      }

      if (!customer) {
        await reply.status(401).send({ error: 'Authentication required' })
        return
      }

      const customerId = customer.id

      const { productId } = request.params
      const { order_item_id, rating, tags } = request.body

      const reviewRepository = new ReviewRepository()
      const orderRepository = new OrderRepository()

      const result = await createReviewUseCase(
        { order_item_id, rating, tags: tags || [] },
        storeId,
        customerId,
        {
          reviewRepository,
          orderRepository
        }
      )

      await reply.status(201).send({ review: { id: result.id } })
    } catch (error) {
      request.log.error(error, 'Erro ao criar avaliação')

      if (error instanceof Error) {
        if (
          error.message.includes('não encontrado') ||
          error.message.includes('não pertence')
        ) {
          await reply.status(404).send({ error: error.message })
          return
        }
        if (error.message.includes('já foi avaliado')) {
          await reply.status(409).send({ error: error.message })
          return
        }
        if (error.message.includes('não é válida')) {
          await reply.status(400).send({ error: error.message })
          return
        }
      }

      await reply.status(500).send({ error: 'Erro ao criar avaliação' })
    }
  }

  async checkEligibility(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      const customer = request.customer

      if (!storeId) {
        await reply.status(400).send({ error: 'Store ID is required' })
        return
      }

      if (!customer) {
        await reply.status(401).send({ error: 'Authentication required' })
        return
      }

      const customerId = customer.id

      const { productId } = request.params

      const reviewRepository = new ReviewRepository()
      const eligibility = await checkReviewEligibilityUseCase(
        customerId,
        productId,
        storeId,
        { reviewRepository }
      )

      await reply.status(200).send({ eligibility })
    } catch (error) {
      request.log.error(error, 'Erro ao verificar elegibilidade de avaliação')
      await reply.status(500).send({ error: 'Erro ao verificar elegibilidade' })
    }
  }

  async getTags(
    request: FastifyRequest<{ Params: { rating: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const rating = parseInt(request.params.rating, 10)

      if (isNaN(rating) || rating < 1 || rating > 5) {
        await reply.status(400).send({ error: 'Rating deve ser entre 1 e 5' })
        return
      }

      const tags = getTagsForRating(rating)

      await reply.status(200).send({ tags })
    } catch (error) {
      request.log.error(error, 'Erro ao buscar tags')
      await reply.status(500).send({ error: 'Erro ao buscar tags' })
    }
  }

  async updateVisibility(
    request: FastifyRequest<{
      Params: { productId: string; reviewId: string }
      Body: { is_hidden: boolean }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      const { reviewId } = request.params
      const { is_hidden } = request.body

      if (!storeId) {
        await reply.status(400).send({ error: 'Store ID is required' })
        return
      }

      const reviewRepository = new ReviewRepository()
      await reviewRepository.updateHidden(reviewId, storeId, is_hidden)

      await reply.status(200).send({ success: true })
    } catch (error) {
      request.log.error(error, 'Erro ao atualizar visibilidade da avaliação')
      await reply.status(500).send({ error: 'Erro ao atualizar visibilidade' })
    }
  }
}

