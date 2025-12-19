import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { CategoryController } from './category-controller'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminCategoryRoutes(
  app: FastifyInstance
): Promise<void> {
  const categoryRepository = new CategoryRepository()
  const categoryController = new CategoryController(categoryRepository)

  // GET /admin/categories - Lista categorias (admin ou operador)
  app.get<{
    Querystring: {
      q?: string
      page?: string
      limit?: string
    }
  }>(
    '/admin/categories',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          q?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      await categoryController.list(request, reply)
    }
  )

  // GET /admin/categories/:id - Detalhe da categoria (admin ou operador)
  app.get<{ Params: { id: string } }>(
    '/admin/categories/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await categoryController.get(request, reply)
    }
  )

  // POST /admin/categories - Cria categoria (admin ou operador)
  app.post(
    '/admin/categories',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await categoryController.create(request as FastifyRequest<{ Body: { name: string; slug?: string; parent_id?: string | null } }>, reply)
    }
  )

  // PUT /admin/categories/:id - Atualiza categoria (apenas admin)
  app.put<{ Params: { id: string } }>(
    '/admin/categories/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await categoryController.update(request as FastifyRequest<{ Params: { id: string }; Body: { name?: string; slug?: string; parent_id?: string | null } }>, reply)
    }
  )

  // DELETE /admin/categories/:id - Deleta categoria (apenas admin)
  app.delete<{ Params: { id: string } }>(
    '/admin/categories/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await categoryController.delete(request, reply)
    }
  )
}

