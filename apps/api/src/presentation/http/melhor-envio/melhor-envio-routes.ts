import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MelhorEnvioController } from './melhor-envio-controller'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerMelhorEnvioRoutes(app: FastifyInstance): Promise<void> {
  const controller = new MelhorEnvioController()

  // GET /melhor-envio/authorize?store_id=XXX
  // Redireciona para URL de autorização do Melhor Envio
  // Público (apenas tenantMiddleware) - o usuário será redirecionado para o Melhor Envio
  app.get(
    '/melhor-envio/authorize',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.authorize(request, reply)
    }
  )

  // GET /melhor-envio/callback?code=XXX&state=store_id
  // Recebe callback do Melhor Envio após autorização
  // Público (sem autenticação) - é chamado pelo Melhor Envio
  app.get(
    '/melhor-envio/callback',
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.callback(request, reply)
    }
  )

  // POST /melhor-envio/revoke
  // Revoga autorização (remove tokens)
  // Requer autenticação admin
  app.post(
    '/melhor-envio/revoke',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.revoke(request, reply)
    }
  )

  // GET /melhor-envio/status
  // Verifica status da autorização
  // Requer autenticação admin
  app.get(
    '/melhor-envio/status',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.status(request, reply)
    }
  )
}

