import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PublicProductController } from './product-controller'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerCatalogRoutes(
  app: FastifyInstance
): Promise<void> {
  const productRepository = new ProductRepository()
  const productController = new PublicProductController(productRepository)

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
}

