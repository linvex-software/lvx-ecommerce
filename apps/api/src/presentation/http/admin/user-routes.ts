import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { UserController } from './user-controller'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminUserRoutes(app: FastifyInstance): Promise<void> {
  const userRepository = new UserRepository()
  const userController = new UserController(userRepository)

  // GET /admin/users - Lista usuários da loja (admin ou operador)
  app.get(
    '/admin/users',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await userController.list(request, reply)
    }
  )

  // POST /admin/users - Cria novo usuário (apenas admin)
  app.post(
    '/admin/users',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await userController.create(request, reply)
    }
  )

  // DELETE /admin/users/:id - Deleta usuário (apenas admin)
  app.delete<{ Params: { id: string } }>(
    '/admin/users/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await userController.delete(request, reply)
    }
  )

  // GET /admin/users/vendors - Lista vendedores da loja (admin, operador ou vendedor)
  app.get(
    '/admin/users/vendors',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await userController.listVendors(request, reply)
    }
  )

  // PUT /admin/users/:id/password - Atualiza senha de um usuário (apenas admin)
  app.put<{ Params: { id: string }; Body: { new_password: string } }>(
    '/admin/users/:id/password',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador', 'vendedor'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { new_password: string } }>,
      reply: FastifyReply
    ) => {
      await userController.updatePassword(request, reply)
    }
  )
}

