import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ReviewController } from '../catalog/review-controller'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminReviewRoutes(
  app: FastifyInstance
): Promise<void> {
  const reviewController = new ReviewController()

  // PATCH /admin/products/:productId/reviews/:reviewId - Ocultar/exibir avaliação (admin)
  app.patch<{
    Params: { productId: string; reviewId: string }
    Body: { is_hidden: boolean }
  }>(
    '/admin/products/:productId/reviews/:reviewId',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (
      request: FastifyRequest<{
        Params: { productId: string; reviewId: string }
        Body: { is_hidden: boolean }
      }>,
      reply: FastifyReply
    ) => {
      await reviewController.updateVisibility(request, reply)
    }
  )
}

