import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PublicProductController } from './product-controller'
import { ReviewController } from './review-controller'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireCustomerAuth } from '../../../infra/http/middlewares/customer-auth'

export async function registerCatalogRoutes(
  app: FastifyInstance
): Promise<void> {
  const productRepository = new ProductRepository()
  const stockMovementRepository = new StockMovementRepository()
  const productController = new PublicProductController(
    productRepository,
    stockMovementRepository
  )

  // GET /products - Lista produtos públicos (apenas ativos)
  app.get<{
    Querystring: {
      q?: string
      category_id?: string
      sizes?: string | string[]
      colors?: string | string[]
      min_price?: string
      max_price?: string
      page?: string
      limit?: string
    }
  }>(
    '/products',
    {
      onRequest: [tenantMiddleware]
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          q?: string
          category_id?: string
          sizes?: string | string[]
          colors?: string | string[]
          min_price?: string
          max_price?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      await productController.list(request, reply)
    }
  )

  // GET /products/:slug - Detalhe público do produto (apenas ativos)
  app.get<{ Params: { slug: string } }>(
    '/products/:slug',
    {
      onRequest: [tenantMiddleware]
    },
    async (
      request: FastifyRequest<{ Params: { slug: string } }>,
      reply: FastifyReply
    ) => {
      await productController.getBySlug(request, reply)
    }
  )

  // GET /products/:id/stock - Consulta estoque público (com ou sem variante)
  app.get<{
    Params: { id: string }
    Querystring: { variant_id?: string }
  }>(
    '/products/:id/stock',
    {
      onRequest: [tenantMiddleware]
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Querystring: { variant_id?: string }
      }>,
      reply: FastifyReply
    ) => {
      await productController.getStock(request, reply)
    }
  )

  // GET /products/filters/sizes - Lista tamanhos disponíveis
  app.get(
    '/products/filters/sizes',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await productController.getAvailableSizes(request, reply)
    }
  )

  // Reviews routes
  const reviewController = new ReviewController()

  // GET /products/:productId/reviews/summary - Resumo de avaliações (público)
  app.get<{ Params: { productId: string } }>(
    '/products/:productId/reviews/summary',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply) => {
      await reviewController.getSummary(request, reply)
    }
  )

  // GET /products/:productId/reviews - Lista avaliações (público)
  app.get<{
    Params: { productId: string }
    Querystring: { limit?: string }
  }>(
    '/products/:productId/reviews',
    {
      onRequest: [tenantMiddleware]
    },
    async (
      request: FastifyRequest<{
        Params: { productId: string }
        Querystring: { limit?: string }
      }>,
      reply: FastifyReply
    ) => {
      await reviewController.list(request, reply)
    }
  )

  // GET /products/:productId/reviews/eligibility - Verifica se pode avaliar (autenticado)
  app.get<{ Params: { productId: string } }>(
    '/products/:productId/reviews/eligibility',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply) => {
      await reviewController.checkEligibility(request, reply)
    }
  )

  // POST /products/:productId/reviews - Criar avaliação (autenticado)
  app.post<{
    Params: { productId: string }
    Body: {
      order_item_id: string
      rating: number
      tags?: string[]
    }
  }>(
    '/products/:productId/reviews',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (
      request: FastifyRequest<{
        Params: { productId: string }
        Body: {
          order_item_id: string
          rating: number
          tags?: string[]
        }
      }>,
      reply: FastifyReply
    ) => {
      await reviewController.create(request, reply)
    }
  )

  // GET /reviews/tags/:rating - Lista tags disponíveis para um rating
  app.get<{ Params: { rating: string } }>(
    '/reviews/tags/:rating',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest<{ Params: { rating: string } }>, reply: FastifyReply) => {
      await reviewController.getTags(request, reply)
    }
  )
}

