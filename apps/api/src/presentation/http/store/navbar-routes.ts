import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { NavbarController } from '../admin/navbar-controller'
import { NavbarRepository } from '../../../infra/db/repositories/navbar-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

/**
 * Rotas públicas para o front-end buscar navbar
 * Não requer autenticação, apenas tenant (via domain)
 */
export async function registerStoreNavbarRoutes(
  app: FastifyInstance
): Promise<void> {
  const navbarRepository = new NavbarRepository()
  const navbarController = new NavbarController(navbarRepository)

  // GET /store/navbar - Busca itens da navbar (público)
  app.get(
    '/store/navbar',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await navbarController.list(request, reply)
    }
  )
}









