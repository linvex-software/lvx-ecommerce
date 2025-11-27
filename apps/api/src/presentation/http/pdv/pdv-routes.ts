import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ProductController } from '../admin/product-controller'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerPDVRoutes(app: FastifyInstance): Promise<void> {
  const productRepository = new ProductRepository()
  const stockMovementRepository = new StockMovementRepository()
  const productController = new ProductController(productRepository, stockMovementRepository)

  // GET /pdv/products - Lista produtos para PDV (vendedor, admin ou operador)
  app.get<{
    Querystring: {
      q?: string
      category_id?: string
      status?: string
      page?: string
      limit?: string
    }
  }>(
    '/pdv/products',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          q?: string
          category_id?: string
          status?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      await productController.list(request, reply)
    }
  )

  // GET /pdv/products/:id - Detalhe do produto para PDV (vendedor, admin ou operador)
  app.get<{ Params: { id: string } }>(
    '/pdv/products/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await productController.getById(request, reply)
    }
  )

  // GET /pdv/products/:id/stock - Consulta estoque para PDV (vendedor, admin ou operador)
  app.get<{
    Params: { id: string }
    Querystring: { variant_id?: string }
  }>(
    '/pdv/products/:id/stock',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
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
}

