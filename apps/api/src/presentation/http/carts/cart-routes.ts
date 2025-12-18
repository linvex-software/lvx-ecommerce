import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { CartController } from './cart-controller'
import { CartRepository } from '../../../infra/db/repositories/cart-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerCartRoutes(app: FastifyInstance): Promise<void> {
  const cartRepository = new CartRepository()
  const cartController = new CartController(cartRepository)

  // POST /carts - Cria ou atualiza carrinho (público, apenas tenantMiddleware)
  app.post(
    '/carts',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await cartController.saveCart(request, reply)
    }
  )

  // GET /carts/me - Retorna carrinho atual (público, apenas tenantMiddleware)
  app.get(
    '/carts/me',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await cartController.getCart(request, reply)
    }
  )
}

