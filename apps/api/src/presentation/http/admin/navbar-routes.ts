import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { NavbarController } from './navbar-controller'
import { NavbarRepository } from '../../../infra/db/repositories/navbar-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminNavbarRoutes(
  app: FastifyInstance
): Promise<void> {
  const navbarRepository = new NavbarRepository()
  const navbarController = new NavbarController(navbarRepository)

  // GET /admin/navbar - Listar todos os itens
  app.get(
    '/admin/navbar',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await navbarController.list(request, reply)
    }
  )

  // GET /admin/navbar/:id - Buscar item por ID
  app.get(
    '/admin/navbar/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await navbarController.get(request, reply)
    }
  )

  // POST /admin/navbar - Criar novo item
  app.post(
    '/admin/navbar',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await navbarController.create(request, reply)
    }
  )

  // PUT /admin/navbar/:id - Atualizar item
  app.put(
    '/admin/navbar/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await navbarController.update(request, reply)
    }
  )

  // DELETE /admin/navbar/:id - Deletar item
  app.delete(
    '/admin/navbar/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await navbarController.delete(request, reply)
    }
  )

  // PUT /admin/navbar/order - Atualizar ordem
  app.put(
    '/admin/navbar/order',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await navbarController.updateOrder(request, reply)
    }
  )
}









