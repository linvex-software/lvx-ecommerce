import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ProductController } from './product-controller'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminProductRoutes(
  app: FastifyInstance
): Promise<void> {
  const productRepository = new ProductRepository()
  const stockMovementRepository = new StockMovementRepository()
  const productController = new ProductController(
    productRepository,
    stockMovementRepository
  )

  // GET /admin/products - Lista produtos (admin ou operador)
  app.get<{
    Querystring: {
      q?: string
      category_id?: string
      status?: string
      page?: string
      limit?: string
    }
  }>(
    '/admin/products',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
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

  // GET /admin/products/:id - Detalhe do produto (admin ou operador)
  app.get<{ Params: { id: string } }>(
    '/admin/products/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await productController.getById(request, reply)
    }
  )

  // POST /admin/products - Cria produto (apenas admin)
  app.post(
    '/admin/products',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await productController.create(request, reply)
    }
  )

  // PUT /admin/products/:id - Atualiza produto (apenas admin)
  app.put<{ Params: { id: string } }>(
    '/admin/products/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await productController.update(request, reply)
    }
  )

  // DELETE /admin/products/:id - Deleta produto (apenas admin)
  app.delete<{ Params: { id: string } }>(
    '/admin/products/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await productController.delete(request, reply)
    }
  )

  // GET /admin/products/:id/stock - Consulta estoque (admin ou operador)
  app.get<{
    Params: { id: string }
    Querystring: { variant_id?: string }
  }>(
    '/admin/products/:id/stock',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
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

  // POST /admin/products/:id/stock/movements - Cria movimento de estoque (admin ou operador)
  app.post<{ Params: { id: string } }>(
    '/admin/products/:id/stock/movements',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await productController.createStockMovement(request, reply)
    }
  )
}

